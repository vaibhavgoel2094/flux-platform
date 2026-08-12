// One-time generator for the bundled synthetic dataset used by the static
// (zero-backend) build — client/src/data/seed.json. Not run by end users;
// re-run this and commit the output only if the dataset itself needs to
// change. Mirrors server/src/seed/seed.ts's data shape but has no Prisma
// dependency, since this output ships as a static JSON asset.
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const id = () => randomUUID();

function computeAutonomyCeiling({ noteText, customerTier, customerStrategicStatus, missingRequiredContext, borderline }) {
  const RESTRICTED = /(credit note|payment plan|extended payment|term extension|write.?off|refund|contract amendment)/i;
  const DISPUTE = /customer dispute|dispute received|we dispute|disputed (amount|invoice|line|charge|tax)/i;
  const NOT_DISPUTE = /no formal dispute|not a dispute/i;
  const strategic = /strategic|executive/i.test(`${customerStrategicStatus} ${customerTier}`);
  const restricted = RESTRICTED.test(noteText);
  const dispute = !NOT_DISPUTE.test(noteText) && DISPUTE.test(noteText);
  if (missingRequiredContext) return { state: "Blocked", autonomy: "Human-led", reason: "Required context is incomplete", policy: "CP-2" };
  if (restricted) return { state: "Restricted", autonomy: "Human-led", reason: "Restricted financial or contractual request", policy: "RA-1 / RA-2 / RA-3" };
  if (dispute) return { state: "Disputed", autonomy: "Human-led", reason: "Customer dispute requires specialist review", policy: "CP-3" };
  if (borderline) return { state: "Approval", autonomy: "Approval required", reason: "Competing routine and relationship signals", policy: "CP-10" };
  if (strategic) return { state: "Approval", autonomy: "Human-led", reason: "Strategic relationship requires human ownership", policy: "CP-4" };
  return { state: "Ready", autonomy: "Autonomous", reason: "Routine policy-compliant case", policy: "CP-1" };
}

function emailFor(name) {
  const slug = name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).slice(0, 2).join("");
  return `ap@${slug}.com`;
}

const org = { id: id(), name: "Meridian Manufacturing Group" };

const users = [
  { id: id(), orgId: org.id, name: "Priya Nandakumar", email: "priya@meridianmfg.com", role: "cfo" },
  { id: id(), orgId: org.id, name: "Daniel Osei", email: "daniel@meridianmfg.com", role: "controller" },
  { id: id(), orgId: org.id, name: "Marisol Vega", email: "marisol@meridianmfg.com", role: "analyst" },
  { id: id(), orgId: org.id, name: "Tomasz Krawiec", email: "tomasz@meridianmfg.com", role: "analyst" },
  { id: id(), orgId: org.id, name: "Renee Ashworth", email: "renee@meridianmfg.com", role: "admin" },
];

const customers = [];
const invoices = [];
const cases = [];
const escalationContacts = [];

const HERO = [
  {
    name: "Alderbrook Textiles Ltd", tier: "standard", strategicStatus: "none",
    invoices: [
      { invoiceNo: "ALD-1042", amount: 18400, daysOverdue: 12, status: "overdue", caseTitle: "Send invoice copy and follow up on Alderbrook's overdue balance" },
      { invoiceNo: "ALD-1039", amount: 6200, daysOverdue: 0, status: "paid" },
    ],
  },
  {
    name: "Northgate Rail Systems", tier: "strategic", strategicStatus: "key-account",
    invoices: [{ invoiceNo: "NGR-2210", amount: 142000, daysOverdue: 34, status: "overdue", caseTitle: "Follow up on Northgate's 34-day overdue invoice", caseNoteHint: "strategic account, no formal dispute" }],
    escalation: [{ name: "Owen Marsh", email: "owen.marsh@northgaterail.com", role: "AP Director" }],
  },
  {
    name: "Solent Dairy Cooperative", tier: "standard", strategicStatus: "none",
    invoices: [{ invoiceNo: "SDC-3387", amount: 9100, daysOverdue: 61, status: "disputed", caseTitle: "Resolve disputed charge and follow up on overdue invoice", caseNoteHint: "customer dispute received on delivery quantity" }],
  },
  {
    name: "Kestrel Avionics Group", tier: "strategic", strategicStatus: "key-account",
    invoices: [{ invoiceNo: "KAG-5510", amount: 264000, daysOverdue: 8, status: "overdue", caseTitle: "Prepare a tailored follow-up for Kestrel's near-term overdue balance", caseNoteHint: "near-strategic customer, mild frustration in last email, no formal dispute" }],
    escalation: [{ name: "Fiona Whitcombe", email: "fiona.w@kestrelavionics.com", role: "Finance Manager" }],
  },
  {
    name: "Bramwell & Ives Logistics", tier: "standard", strategicStatus: "none",
    invoices: [
      { invoiceNo: "BIL-0921", amount: 4300, daysOverdue: 3, status: "overdue", caseTitle: "Send a routine reminder on Bramwell & Ives' newly overdue invoice" },
      { invoiceNo: "BIL-0908", amount: 7800, daysOverdue: 0, status: "current" },
    ],
  },
  {
    name: "Corvid Analytics Inc", tier: "standard", strategicStatus: "none",
    invoices: [{ invoiceNo: "COR-6120", amount: 12750, daysOverdue: 95, status: "overdue", caseTitle: "Escalate Corvid's severely overdue balance", caseNoteHint: "write-off under discussion, requires human review" }],
  },
  {
    name: "Palisade Home Goods", tier: "standard", strategicStatus: "none",
    invoices: [
      { invoiceNo: "PHG-4471", amount: 3100, daysOverdue: 0, status: "paid" },
      { invoiceNo: "PHG-4488", amount: 5600, daysOverdue: 22, status: "overdue", caseTitle: "Send invoice copy and follow up on Palisade's outstanding balance" },
    ],
  },
  {
    name: "Thistledown Craft Brewing", tier: "standard", strategicStatus: "none",
    invoices: [{ invoiceNo: "TCB-1180", amount: 2400, daysOverdue: 45, status: "overdue", caseTitle: "Resolve incorrect billing contact and follow up on overdue invoice", caseNoteHint: "billing contact bounced, needs updated details before contact" }],
  },
];

function addCustomer({ name, tier, strategicStatus }) {
  const customer = { id: id(), orgId: org.id, name, email: emailFor(name), tier, strategicStatus, createdAt: new Date().toISOString() };
  customers.push(customer);
  return customer;
}

function addInvoiceAndCase(customer, inv, agentTypeOverride) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() - inv.daysOverdue);
  const invoice = {
    id: id(), orgId: org.id, customerId: customer.id, invoiceNo: inv.invoiceNo, amount: inv.amount,
    currency: "GBP", dueDate: dueDate.toISOString(), status: inv.status, daysOverdue: Math.max(inv.daysOverdue, 0),
    createdAt: new Date().toISOString(),
  };
  invoices.push(invoice);
  if (inv.caseTitle) {
    const title = inv.caseNoteHint ? `${inv.caseTitle} (${inv.caseNoteHint})` : inv.caseTitle;
    const ceiling = computeAutonomyCeiling({
      noteText: `${title} ${inv.status}`, customerTier: customer.tier, customerStrategicStatus: customer.strategicStatus,
      missingRequiredContext: false, borderline: /near-strategic|borderline/i.test(title),
    });
    cases.push({
      id: id(), orgId: org.id, customerId: customer.id, invoiceId: invoice.id, agentType: agentTypeOverride ?? "collections",
      title, state: ceiling.state, autonomy: ceiling.autonomy, status: "Not analyzed",
      priority: inv.amount > 50000 ? "high" : inv.daysOverdue > 60 ? "high" : "normal", createdAt: new Date().toISOString(),
    });
  }
  return invoice;
}

for (const h of HERO) {
  const customer = addCustomer(h);
  if (h.escalation) for (const c of h.escalation) escalationContacts.push({ id: id(), customerId: customer.id, ...c, active: true });
  for (const inv of h.invoices) addInvoiceAndCase(customer, inv);
}

const PREFIXES = ["Ashford", "Bellrock", "Cinder", "Dunmore", "Elkfield", "Fairview", "Graymoor", "Hartlow", "Ironvale", "Juniper", "Kingswell", "Larkspur", "Millbrook", "Norwood", "Oakmere", "Pinehurst", "Quarrystone", "Ridgeway", "Silvercreek", "Thorncliff", "Underwood", "Vantage", "Westgate", "Yarrow", "Zenith"];
const SUFFIXES = ["Industries", "Manufacturing", "Holdings", "Logistics", "Group", "Partners", "Foods", "Materials", "Components", "Systems", "Freight", "Textiles", "Chemicals", "Packaging", "Fabrication", "Distribution"];
const AGENT_TEMPLATES = {
  collections: (c, r) => `Send a payment reminder and follow up on ${c}'s overdue invoice ${r}`,
  billing: (c, r) => `Answer ${c}'s billing query on invoice ${r}`,
  deductions: (c, r) => `Investigate deduction claimed by ${c} against invoice ${r}`,
  cash_application: (c, r) => `Match unapplied payment from ${c} against invoice ${r}`,
  supplier_payer: (c, r) => `Follow up with ${c} on payer-side correspondence for ${r}`,
};
const AGENT_WEIGHTS = [["collections", 0.55], ["billing", 0.18], ["cash_application", 0.12], ["deductions", 0.1], ["supplier_payer", 0.05]];
function pickAgentType() {
  const roll = Math.random();
  let acc = 0;
  for (const [type, weight] of AGENT_WEIGHTS) { acc += weight; if (roll <= acc) return type; }
  return "collections";
}
function pickStatus() {
  const roll = Math.random();
  if (roll < 0.32) return "paid";
  if (roll < 0.42) return "current";
  if (roll < 0.9) return "overdue";
  return "disputed";
}

let invoiceSeq = 7000;
const BULK_COUNT = 180;
for (let i = 0; i < BULK_COUNT; i++) {
  const prefix = PREFIXES[i % PREFIXES.length];
  const suffix = SUFFIXES[(i * 7 + 3) % SUFFIXES.length];
  const name = `${prefix} ${suffix}${i >= PREFIXES.length ? ` ${Math.floor(i / PREFIXES.length) + 1}` : ""}`;
  const strategic = Math.random() < 0.12;
  const customer = addCustomer({ name, tier: strategic ? "strategic" : "standard", strategicStatus: strategic ? "key-account" : "none" });

  const invoiceCount = 1 + Math.floor(Math.random() * 3);
  for (let j = 0; j < invoiceCount; j++) {
    const status = pickStatus();
    const daysOverdue = status === "overdue" || status === "disputed" ? 1 + Math.floor(Math.random() * 110) : 0;
    const amount = Math.round((300 + Math.random() * 48000) / 10) * 10;
    const invoiceNo = `INV-${invoiceSeq++}`;
    const needsCase = status === "overdue" || status === "disputed" || (status === "current" && Math.random() < 0.15);
    const agentType = status === "disputed" ? "deductions" : pickAgentType();
    addInvoiceAndCase(
      customer,
      { invoiceNo, amount, daysOverdue, status, caseTitle: needsCase ? AGENT_TEMPLATES[agentType](name, invoiceNo) : undefined },
      agentType,
    );
  }
}

const personas = [
  { id: id(), orgId: org.id, agentType: "collections", label: "Collections", instructions: "Prioritize payroll-funding-risk accounts first. Never offer payment plans, write-offs, or term changes without human approval. Keep tone firm but respectful for accounts over 60 days overdue.", updatedAt: new Date().toISOString() },
  { id: id(), orgId: org.id, agentType: "billing", label: "Billing Support", instructions: "Answer only from verified invoice and contract records. If a customer asks for a discount or credit, do not agree — route to a human.", updatedAt: new Date().toISOString() },
  { id: id(), orgId: org.id, agentType: "deductions", label: "Deductions", instructions: "Compare the deduction against the original invoice, delivery record, and contract terms. Flag deductions over $10,000 for mandatory human review regardless of evidence strength.", updatedAt: new Date().toISOString() },
  { id: id(), orgId: org.id, agentType: "cash_application", label: "Cash Application", instructions: "Only auto-match a payment when the amount, customer, and reference number all agree with an open invoice. Any partial or ambiguous match goes to a human queue.", updatedAt: new Date().toISOString() },
  { id: id(), orgId: org.id, agentType: "supplier_payer", label: "Supplier & Payer", instructions: "Mirror the Collections agent's caution on payer-side correspondence. Escalate any request that touches contract terms.", updatedAt: new Date().toISOString() },
];

const automations = [
  { id: id(), orgId: org.id, category: "payment_queries", label: "Payment queries", agentType: "billing", live: true, involvementPct: 82 },
  { id: id(), orgId: org.id, category: "statement_requests", label: "Request for statements", agentType: "billing", live: true, involvementPct: 94 },
  { id: id(), orgId: org.id, category: "update_details", label: "Update details", agentType: "billing", live: false, involvementPct: 0 },
  { id: id(), orgId: org.id, category: "invoice_queries", label: "Invoice queries", agentType: "billing", live: true, involvementPct: 76 },
  { id: id(), orgId: org.id, category: "billing_arrangement", label: "Billing arrangement", agentType: "collections", live: false, involvementPct: 0 },
  { id: id(), orgId: org.id, category: "email_response", label: "Email response", agentType: "collections", live: true, involvementPct: 61 },
  { id: id(), orgId: org.id, category: "generic_other", label: "Generic / other", agentType: "collections", live: false, involvementPct: 12 },
];

const highValueId = id();
const standardId = id();
const playbooks = [
  {
    id: highValueId, orgId: org.id, name: "High Value Customers", description: "Design and configure how Flux pays you out on strategic accounts.", segment: "strategic",
    steps: [
      { id: id(), playbookId: highValueId, order: 1, triggerDays: 1, action: "send_email", template: "Gentle reminder — invoice due" },
      { id: id(), playbookId: highValueId, order: 2, triggerDays: 5, action: "escalate", template: "Notify named escalation contact" },
      { id: id(), playbookId: highValueId, order: 3, triggerDays: 15, action: "create_task", template: "Human owner call scheduled" },
      { id: id(), playbookId: highValueId, order: 4, triggerDays: 35, action: "escalate", template: "Escalate to Controller for review" },
    ],
  },
  {
    id: standardId, orgId: org.id, name: "Standard Accounts", description: "Default cadence for non-strategic accounts.", segment: "standard",
    steps: [
      { id: id(), playbookId: standardId, order: 1, triggerDays: 3, action: "send_email", template: "Standard payment reminder" },
      { id: id(), playbookId: standardId, order: 2, triggerDays: 14, action: "send_email", template: "Second reminder — firmer tone" },
      { id: id(), playbookId: standardId, order: 3, triggerDays: 30, action: "create_task", template: "Route to AR analyst queue" },
    ],
  },
];

const dataset = { org, users, customers, invoices, cases, escalationContacts, personas, automations, playbooks };

const outPath = join(__dirname, "..", "client", "src", "data", "seed.json");
writeFileSync(outPath, JSON.stringify(dataset, null, 2));
console.log(`Wrote ${customers.length} customers, ${invoices.length} invoices, ${cases.length} cases to ${outPath}`);
