import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { computeAutonomyCeiling, type CaseContext } from "../governance/autonomy.js";
import { systemPromptFor } from "../governance/prompts.js";
import { resolveLiveOutput, resolveSavedOutput, InvalidAgentOutputError } from "../governance/resolve.js";
import { anthropicAvailable, runAgent } from "../anthropic.js";

export const casesRouter = Router();

casesRouter.get("/", requireAuth, async (req, res) => {
  const cases = await prisma.case.findMany({
    where: { orgId: req.user!.orgId },
    include: { customer: true, invoice: true },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
  res.json(
    cases.map((c) => ({
      id: c.id,
      title: c.title,
      agentType: c.agentType,
      state: c.state,
      autonomy: c.autonomy,
      status: c.status,
      priority: c.priority,
      customer: { id: c.customer.id, name: c.customer.name },
      invoice: c.invoice ? { id: c.invoice.id, invoiceNo: c.invoice.invoiceNo, amount: c.invoice.amount, daysOverdue: c.invoice.daysOverdue } : null,
      createdAt: c.createdAt,
    })),
  );
});

casesRouter.get("/:id", requireAuth, async (req, res) => {
  const item = await prisma.case.findFirst({
    where: { id: String(req.params.id), orgId: req.user!.orgId },
    include: {
      customer: { include: { escalationContacts: true } },
      invoice: true,
      actions: { orderBy: { createdAt: "desc" } },
      reviews: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
    },
  });
  if (!item) {
    res.status(404).json({ error: "Case not found." });
    return;
  }
  res.json({
    ...item,
    actions: item.actions.map((a) => ({ ...a, evidence: JSON.parse(a.evidence), citations: JSON.parse(a.citations) })),
  });
});

function buildContext(item: { agentType: string; customer: { tier: string; strategicStatus: string }; invoice: { status: string } | null; title: string }): CaseContext {
  return {
    agentType: item.agentType,
    noteText: `${item.title} ${item.invoice?.status ?? ""}`,
    customerTier: item.customer.tier,
    customerStrategicStatus: item.customer.strategicStatus,
    missingRequiredContext: false,
    borderline: /near-strategic|borderline/i.test(item.title),
  };
}

const analyzeSchema = z.object({ mode: z.enum(["live", "saved"]) });

casesRouter.post("/:id/analyze", requireAuth, async (req, res) => {
  const parsed = analyzeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "mode must be 'live' or 'saved'." });
    return;
  }
  const item = await prisma.case.findFirst({
    where: { id: String(req.params.id), orgId: req.user!.orgId },
    include: { customer: true, invoice: true },
  });
  if (!item) {
    res.status(404).json({ error: "Case not found." });
    return;
  }
  const referenceId = item.invoice?.invoiceNo ?? item.id;
  const ctx = buildContext(item);

  try {
    let resolved;
    if (parsed.data.mode === "live") {
      if (!anthropicAvailable()) {
        res.status(412).json({ error: "No ANTHROPIC_API_KEY configured on the server. Ask an admin to set one, or run a saved-evidence analysis instead." });
        return;
      }
      const ceiling = computeAutonomyCeiling(ctx);
      const userPrompt = [
        `Analyze only this case: ${item.title}`,
        `Reference: records.json:${referenceId}`,
        `Customer: ${item.customer.name} (tier: ${item.customer.tier}, strategic status: ${item.customer.strategicStatus})`,
        item.invoice ? `Invoice: ${item.invoice.invoiceNo}, ${item.invoice.currency} ${item.invoice.amount}, ${item.invoice.daysOverdue} days overdue, status ${item.invoice.status}` : "No linked invoice.",
        `Deterministic policy ceiling for this case: ${ceiling.autonomy} (${ceiling.policy}) — do not propose more autonomy than this.`,
      ].join("\n");
      const rawText = await runAgent(systemPromptFor(item.agentType), userPrompt);
      resolved = resolveLiveOutput(ctx, referenceId, rawText);
    } else {
      resolved = resolveSavedOutput(ctx, referenceId, item.customer.name);
    }

    const action = await prisma.agentAction.create({
      data: {
        caseId: item.id,
        source: resolved.source,
        recommendation: resolved.recommendation,
        rationale: resolved.rationale,
        policy: resolved.policy,
        customerDraft: resolved.customerDraft,
        evidence: JSON.stringify(resolved.evidence),
        citations: JSON.stringify(resolved.citations),
        nextFollowUp: resolved.nextFollowUp,
        humanApproval: resolved.humanApproval,
        proposedAutonomy: resolved.autonomy,
        expectedAutonomy: resolved.expectedAutonomy,
        policyAlignment: resolved.policyAlignment,
        rawText: resolved.rawText,
      },
    });

    const updated = await prisma.case.update({
      where: { id: item.id },
      data: { state: resolved.state === "Ready" ? "Ready" : "Approval", autonomy: resolved.autonomy, status: resolved.state === "Ready" ? "Recommendation ready" : "Human review required" },
    });

    await prisma.activityEntry.create({
      data: {
        orgId: req.user!.orgId,
        actorType: "agent",
        actorName: `Flux ${item.agentType} agent`,
        summary: `${resolved.source === "live-ai" ? "Live" : "Saved-evidence"} analysis run on ${item.title}`,
        detail: JSON.stringify({ caseId: item.id, actionId: action.id, autonomy: resolved.autonomy, source: resolved.source }),
      },
    });

    res.json({ case: updated, action: { ...action, evidence: resolved.evidence, citations: resolved.citations } });
  } catch (err) {
    if (err instanceof InvalidAgentOutputError) {
      res.status(422).json({ error: err.message, code: err.code });
      return;
    }
    console.error(err);
    res.status(502).json({ error: "The AI provider request failed. No action was taken." });
  }
});

const reviewSchema = z.object({
  decision: z.enum(["approve", "edit", "escalate", "correction"]),
  note: z.string().optional(),
});

casesRouter.post("/:id/review", requireAuth, async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "decision must be one of approve, edit, escalate, correction." });
    return;
  }
  const item = await prisma.case.findFirst({ where: { id: String(req.params.id), orgId: req.user!.orgId } });
  if (!item) {
    res.status(404).json({ error: "Case not found." });
    return;
  }
  const review = await prisma.caseReview.create({
    data: { caseId: item.id, userId: req.user!.id, decision: parsed.data.decision, note: parsed.data.note },
  });
  const updated = await prisma.case.update({ where: { id: item.id }, data: { status: "Reviewed" } });

  await prisma.activityEntry.create({
    data: {
      orgId: req.user!.orgId,
      actorType: "human",
      actorName: req.user!.name,
      summary: `${req.user!.name} ${parsed.data.decision}d the case: ${item.title}`,
      detail: JSON.stringify({ caseId: item.id, reviewId: review.id, decision: parsed.data.decision, note: parsed.data.note }),
    },
  });

  res.json({ case: updated, review });
});
