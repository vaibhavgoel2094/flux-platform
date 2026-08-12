// Deterministic autonomy ceiling — computed BEFORE the model runs, from
// verifiable signals, independent of anything the model says about itself.
// The model's proposed autonomy is later checked against this ceiling and
// can only be downgraded, never upgraded. Ported and generalized from
// Flux Collect's riskState() so every agent type shares one governance path.

export type CaseState = "Ready" | "Approval" | "Blocked" | "Disputed" | "Restricted";
export type AutonomyLevel = "Human-led" | "Approval required" | "Autonomous";

export interface CaseContext {
  agentType: string;
  noteText: string;          // free text describing the case (email body, ticket notes, etc.)
  customerTier: string;      // "standard" | "strategic"
  customerStrategicStatus: string;
  missingRequiredContext: boolean; // true if a linked record the agent needs is absent
  borderline?: boolean;      // manually flagged edge case for evaluation testing
}

export interface AutonomyVerdict {
  state: CaseState;
  autonomy: AutonomyLevel;
  reason: string;
  policy: string;
}

const RESTRICTED_PATTERN = /(credit note|payment plan|extended payment|term extension|write.?off|refund|contract amendment)/i;
const DISPUTE_PATTERN = /customer dispute|dispute received|we dispute|disputed (amount|invoice|line|charge|tax)/i;
const NOT_DISPUTE_PATTERN = /no formal dispute|not a dispute/i;

export function computeAutonomyCeiling(ctx: CaseContext): AutonomyVerdict {
  const strategic = /strategic|executive/i.test(`${ctx.customerStrategicStatus} ${ctx.customerTier}`);
  const restricted = RESTRICTED_PATTERN.test(ctx.noteText);
  const dispute = !NOT_DISPUTE_PATTERN.test(ctx.noteText) && DISPUTE_PATTERN.test(ctx.noteText);

  if (ctx.missingRequiredContext) {
    return { state: "Blocked", autonomy: "Human-led", reason: "Required context is incomplete", policy: "CP-2" };
  }
  if (restricted) {
    return { state: "Restricted", autonomy: "Human-led", reason: "Restricted financial or contractual request", policy: "RA-1 / RA-2 / RA-3" };
  }
  if (dispute) {
    return { state: "Disputed", autonomy: "Human-led", reason: "Customer dispute requires specialist review", policy: "CP-3" };
  }
  if (ctx.borderline) {
    return { state: "Approval", autonomy: "Approval required", reason: "Competing routine and relationship signals", policy: "CP-10" };
  }
  if (strategic) {
    return { state: "Approval", autonomy: "Human-led", reason: "Strategic relationship requires human ownership", policy: "CP-4" };
  }
  return { state: "Ready", autonomy: "Autonomous", reason: "Routine policy-compliant case", policy: "CP-1" };
}

const AUTONOMY_RANK: Record<AutonomyLevel, number> = {
  "Human-led": 0,
  "Approval required": 1,
  Autonomous: 2,
};

/** The model may only ever be downgraded from the ceiling, never upgraded past it. */
export function enforceCeiling(proposed: AutonomyLevel, ceiling: AutonomyLevel): { autonomy: AutonomyLevel; downgraded: boolean } {
  if (AUTONOMY_RANK[proposed] > AUTONOMY_RANK[ceiling]) {
    return { autonomy: ceiling, downgraded: true };
  }
  return { autonomy: proposed, downgraded: false };
}
