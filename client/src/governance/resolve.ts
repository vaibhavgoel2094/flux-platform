import { parseAgentOutput, classifyAutonomy } from "./outputContract.js";
import { verifyCitations } from "./citations.js";
import { computeAutonomyCeiling, enforceCeiling, type CaseContext, type AutonomyLevel } from "./autonomy.js";

export class InvalidAgentOutputError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export interface ResolvedAction {
  status: string;
  state: "Ready" | "Human review";
  autonomy: AutonomyLevel;
  expectedAutonomy: AutonomyLevel;
  policyAlignment: "Aligned" | "Conservative variance";
  recommendation: string;
  rationale: string;
  policy: string;
  customerDraft: string;
  evidence: string[];
  citations: string[];
  nextFollowUp: string;
  humanApproval: string;
  source: "live-ai" | "saved-evidence";
  fresh: boolean;
  rawText: string;
}

/** Validates a live model response against the output contract, citation
 *  requirement, and autonomy ceiling. Throws on any failure — an incomplete
 *  or unsafe response is always an explicit non-decision, never a silent
 *  fallback. */
export function resolveLiveOutput(ctx: CaseContext, referenceId: string, rawText: string): ResolvedAction {
  const parsed = parseAgentOutput(rawText);
  if (!parsed.valid) {
    throw new InvalidAgentOutputError(
      `The AI response was incomplete. Missing: ${parsed.missing.join(", ")}`,
      "INVALID_AGENT_OUTPUT",
    );
  }
  const f = parsed.fields as Record<string, string>;
  const ceiling = computeAutonomyCeiling(ctx);

  const check = verifyCitations({
    citationText: f.CITATIONS ?? "",
    supportingEvidenceText: f["SUPPORTING EVIDENCE"] ?? "",
    referenceId,
    policyCode: ceiling.policy,
  });
  if (!check.valid) {
    throw new InvalidAgentOutputError(
      "The AI decision was received, but its record or policy references could not be verified. No action was taken.",
      "INVALID_CITATIONS",
    );
  }

  const proposedAutonomy = classifyAutonomy(f["AUTONOMY LEVEL"] ?? "");
  if (proposedAutonomy === "Unclassified") {
    throw new InvalidAgentOutputError("The AI decision used an unknown autonomy label. No action was taken.", "INVALID_AUTONOMY");
  }

  const { autonomy, downgraded } = enforceCeiling(proposedAutonomy, ceiling.autonomy);

  return {
    status: f.STATUS,
    state: f.STATUS?.startsWith("OK") ? "Ready" : "Human review",
    autonomy,
    expectedAutonomy: ceiling.autonomy,
    policyAlignment: downgraded ? "Conservative variance" : "Aligned",
    recommendation: f["RECOMMENDED ACTION"] ?? "",
    rationale: f["DECISION RATIONALE"] ?? "",
    policy: f["APPLIED POLICY"] ?? "",
    customerDraft: f["CUSTOMER COMMUNICATION"] ?? "",
    evidence: (f["SUPPORTING EVIDENCE"] ?? "").split(/\n|;(?=\s*[a-z_]+\.)/).map((v) => v.trim()).filter(Boolean),
    citations: [...check.citations],
    nextFollowUp: f["NEXT FOLLOW-UP DATE"] ?? "Human owner to confirm",
    humanApproval: f["REQUIRED HUMAN APPROVAL"] ?? "Required before customer contact or any system update.",
    source: "live-ai",
    fresh: true,
    rawText,
  };
}

/** Deterministic, no-API-key fallback used only when explicitly requested —
 *  always visibly labeled saved-evidence, never presented as a live decision. */
export function resolveSavedOutput(ctx: CaseContext, referenceId: string, customerName: string): ResolvedAction {
  const ceiling = computeAutonomyCeiling(ctx);
  const communicationAllowed = ceiling.state === "Ready" || ceiling.state === "Approval";
  return {
    status: ceiling.state === "Ready" ? "OK" : "REFUSED-ESCALATE",
    state: ceiling.state === "Ready" ? "Ready" : "Human review",
    autonomy: ceiling.autonomy,
    expectedAutonomy: ceiling.autonomy,
    policyAlignment: "Aligned",
    recommendation:
      ceiling.state === "Blocked"
        ? "Complete the missing records before taking action."
        : ceiling.state === "Ready"
          ? "Send a standard follow-up and confirm payment status."
          : "Route this case to the named human owner.",
    rationale: `${ceiling.reason}; ${ceiling.policy} applies.`,
    policy: ceiling.policy,
    customerDraft: communicationAllowed
      ? `Subject: ${referenceId} — follow-up\n\nHello ${customerName},\n\nWe are following up on ${referenceId}. Please confirm its status or expected resolution date.\n\nRegards,\nFlux`
      : "No customer communication is authorized until the human review is complete.",
    evidence: [`records.json:${referenceId}`, `policy.md:${ceiling.policy.split(" ")[0]}`],
    citations: [`records.json:${referenceId}`, `policy.md:${ceiling.policy.split(" ")[0]}`],
    nextFollowUp: "Human owner to confirm",
    humanApproval: "Required before customer contact or any system update.",
    source: "saved-evidence",
    fresh: false,
    rawText: "",
  };
}
