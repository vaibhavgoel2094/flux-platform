import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { anthropicAvailable, runAgent } from "../anthropic.js";

export const copilotRouter = Router();

const COPILOT_SYSTEM_PROMPT = `You are Ask Flux, a conversational analyst answering a finance leader's question about their accounts-receivable portfolio. You are given a JSON snapshot of real customers, invoices, and cases — use only that data, never invent figures. Answer concisely with concrete numbers and cite the record ids you relied on in the form (records:CUSTOMER_ID) or (records:INVOICE_NO). If the data doesn't support an answer, say so plainly instead of guessing.`;

const askSchema = z.object({ question: z.string().min(1) });

copilotRouter.post("/ask", requireAuth, async (req, res) => {
  const parsed = askSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "question is required." });
    return;
  }
  if (!anthropicAvailable()) {
    res.status(412).json({ error: "No ANTHROPIC_API_KEY configured on the server. Ask Flux needs a live model connection." });
    return;
  }

  const orgId = req.user!.orgId;
  const [customers, invoices, cases] = await Promise.all([
    prisma.customer.findMany({ where: { orgId }, select: { id: true, name: true, tier: true, strategicStatus: true } }),
    prisma.invoice.findMany({ where: { orgId }, select: { invoiceNo: true, amount: true, status: true, daysOverdue: true, customerId: true } }),
    prisma.case.findMany({ where: { orgId }, select: { title: true, agentType: true, state: true, autonomy: true, status: true, customerId: true } }),
  ]);

  const snapshot = JSON.stringify({ customers, invoices: invoices.slice(0, 400), cases: cases.slice(0, 400) });
  const userPrompt = `Portfolio snapshot (JSON):\n${snapshot}\n\nQuestion: ${parsed.data.question}`;

  try {
    const answer = await runAgent(COPILOT_SYSTEM_PROMPT, userPrompt);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "The AI provider request failed." });
  }
});
