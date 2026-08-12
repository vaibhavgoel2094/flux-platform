export interface Me {
  id: string;
  name: string;
  email: string;
  role: "cfo" | "controller" | "analyst" | "admin";
  orgId: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  agentType: string;
  state: string;
  autonomy: string;
  status: string;
  priority: string;
  customer: { id: string; name: string };
  invoice: { id: string; invoiceNo: string; amount: number; daysOverdue: number } | null;
  createdAt: string;
}

export interface AgentAction {
  id: string;
  source: "saved-evidence" | "live-ai";
  recommendation: string;
  rationale: string;
  policy: string;
  customerDraft: string;
  evidence: string[];
  citations: string[];
  nextFollowUp: string | null;
  humanApproval: string;
  proposedAutonomy: string;
  expectedAutonomy: string;
  policyAlignment: string;
  createdAt: string;
}

export interface CaseDetail extends CaseSummary {
  customer: { id: string; name: string; tier: string; strategicStatus: string; escalationContacts: EscalationContact[] };
  invoice: { id: string; invoiceNo: string; amount: number; currency: string; daysOverdue: number; status: string; dueDate: string } | null;
  actions: AgentAction[];
  reviews: { id: string; decision: string; note: string | null; createdAt: string; user: { name: string } }[];
}

export interface EscalationContact {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export interface CustomerSummary {
  id: string;
  name: string;
  tier: string;
  strategicStatus: string;
  outstanding: number;
  overdueCount: number;
  overdueAmount: number;
}

export interface CustomerDetail {
  id: string;
  name: string;
  tier: string;
  strategicStatus: string;
  invoices: { id: string; invoiceNo: string; amount: number; currency: string; status: string; daysOverdue: number; dueDate: string }[];
  escalationContacts: EscalationContact[];
  cases: CaseSummary[];
}

export interface EvaluationControl {
  id: string;
  label: string;
  description: string;
  evaluation: { rating: string | null; runAt: string | null; ratedBy?: { name: string } | null } | null;
}

export interface Bootstrap {
  org: { id: string; name: string };
  users: { id: string; name: string; email: string; role: string }[];
  caseSummary: Record<string, number>;
  released: boolean;
}

export interface Analytics {
  aging: Record<string, number>;
  dso: number;
  collected: number;
  totalReceivable: number;
  topReasons: { reason: string; count: number }[];
}

export interface ActivityItem {
  id: string;
  actorType: "agent" | "human";
  actorName: string;
  summary: string;
  detail: Record<string, unknown>;
  createdAt: string;
}
