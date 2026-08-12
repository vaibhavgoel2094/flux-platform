export interface Org { id: string; name: string; }
export interface UserRow { id: string; orgId: string; name: string; email: string; role: string; }
export interface CustomerRow { id: string; orgId: string; name: string; email: string; tier: string; strategicStatus: string; createdAt: string; }
export interface InvoiceRow { id: string; orgId: string; customerId: string; invoiceNo: string; amount: number; currency: string; dueDate: string; status: string; daysOverdue: number; createdAt: string; }
export interface CaseRow { id: string; orgId: string; customerId: string; invoiceId: string | null; agentType: string; title: string; state: string; autonomy: string; status: string; priority: string; createdAt: string; }
export interface EscalationContactRow { id: string; customerId: string; name: string; email: string; role: string; active: boolean; }
export interface PlaybookStepRow { id: string; playbookId: string; order: number; triggerDays: number; action: string; template: string; }
export interface PlaybookRow { id: string; orgId: string; name: string; description: string; segment: string; steps: PlaybookStepRow[]; }
export interface PersonaRow { id: string; orgId: string; agentType: string; label: string; instructions: string; updatedAt: string; }
export interface AutomationRow { id: string; orgId: string; category: string; label: string; agentType: string; live: boolean; involvementPct: number; }

export interface AgentActionRow {
  id: string; caseId: string; source: "saved-evidence" | "live-ai";
  recommendation: string; rationale: string; policy: string; customerDraft: string;
  evidence: string[]; citations: string[]; nextFollowUp: string | null; humanApproval: string;
  proposedAutonomy: string; expectedAutonomy: string; policyAlignment: string; rawText: string; createdAt: string;
}
export interface CaseReviewRow {
  id: string; caseId: string; userId: string; decision: string; note: string | null; finalDraft: string | null; createdAt: string;
}
export interface EvaluationRow {
  id: string; orgId: string; agentType: string; control: string; rating: string | null; runAt: string | null; ratedById: string | null;
}
export interface ActivityRow {
  id: string; orgId: string; actorType: "agent" | "human"; actorName: string; summary: string; detail: Record<string, unknown>; createdAt: string;
}

export interface Dataset {
  org: Org; users: UserRow[]; customers: CustomerRow[]; invoices: InvoiceRow[]; cases: CaseRow[];
  escalationContacts: EscalationContactRow[]; personas: PersonaRow[]; automations: AutomationRow[]; playbooks: PlaybookRow[];
}

export interface Workspace extends Dataset {
  agentActions: AgentActionRow[];
  caseReviews: CaseReviewRow[];
  evaluations: EvaluationRow[];
  activity: ActivityRow[];
}
