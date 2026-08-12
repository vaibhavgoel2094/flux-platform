// Fresh synthetic seed data for Flux Platform. Independent of, and not
// copied from, the ai-collections-agent capstone's dataset — new fictional
// org, customers, and invoices for the new repository.
import { prisma } from "../db.js";
import { computeAutonomyCeiling } from "../governance/autonomy.js";

function emailFor(customerName: string): string {
  const slug = customerName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("");
  return `ap@${slug}.com`;
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.activityEntry.deleteMany();
  await prisma.caseReview.deleteMany();
  await prisma.agentAction.deleteMany();
  await prisma.case.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.escalationContact.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.playbookStep.deleteMany();
  await prisma.playbook.deleteMany();
  await prisma.agentPersona.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({ data: { name: "Meridian Manufacturing Group" } });

  const [cfo, controller, analyst1, analyst2, admin] = await Promise.all([
    prisma.user.create({ data: { orgId: org.id, name: "Priya Nandakumar", email: "priya@meridianmfg.com", role: "cfo" } }),
    prisma.user.create({ data: { orgId: org.id, name: "Daniel Osei", email: "daniel@meridianmfg.com", role: "controller" } }),
    prisma.user.create({ data: { orgId: org.id, name: "Marisol Vega", email: "marisol@meridianmfg.com", role: "analyst" } }),
    prisma.user.create({ data: { orgId: org.id, name: "Tomasz Krawiec", email: "tomasz@meridianmfg.com", role: "analyst" } }),
    prisma.user.create({ data: { orgId: org.id, name: "Renee Ashworth", email: "renee@meridianmfg.com", role: "admin" } }),
  ]);
  console.log(`Users: ${[cfo, controller, analyst1, analyst2, admin].map((u) => u.email).join(", ")}`);

  interface CustomerSeed {
    name: string;
    tier: "standard" | "strategic";
    strategicStatus: string;
    invoices: { invoiceNo: string; amount: number; daysOverdue: number; status: "current" | "overdue" | "paid" | "disputed"; caseTitle?: string; caseNoteHint?: string; agentType?: string }[];
    escalation?: { name: string; email: string; role: string }[];
  }

  const customers: CustomerSeed[] = [
    {
      name: "Alderbrook Textiles Ltd",
      tier: "standard",
      strategicStatus: "none",
      invoices: [
        { invoiceNo: "ALD-1042", amount: 18400, daysOverdue: 12, status: "overdue", caseTitle: "Send invoice copy and follow up on Alderbrook's overdue balance" },
        { invoiceNo: "ALD-1039", amount: 6200, daysOverdue: 0, status: "paid" },
      ],
    },
    {
      name: "Northgate Rail Systems",
      tier: "strategic",
      strategicStatus: "key-account",
      invoices: [
        { invoiceNo: "NGR-2210", amount: 142000, daysOverdue: 34, status: "overdue", caseTitle: "Follow up on Northgate's 34-day overdue invoice", caseNoteHint: "strategic account, no formal dispute" },
      ],
      escalation: [{ name: "Owen Marsh", email: "owen.marsh@northgaterail.com", role: "AP Director" }],
    },
    {
      name: "Solent Dairy Cooperative",
      tier: "standard",
      strategicStatus: "none",
      invoices: [
        { invoiceNo: "SDC-3387", amount: 9100, daysOverdue: 61, status: "disputed", caseTitle: "Resolve disputed charge and follow up on overdue invoice", caseNoteHint: "customer dispute received on delivery quantity" },
      ],
    },
    {
      name: "Kestrel Avionics Group",
      tier: "strategic",
      strategicStatus: "key-account",
      invoices: [
        { invoiceNo: "KAG-5510", amount: 264000, daysOverdue: 8, status: "overdue", caseTitle: "Prepare a tailored follow-up for Kestrel's near-term overdue balance", caseNoteHint: "near-strategic customer, mild frustration in last email, no formal dispute" },
      ],
      escalation: [{ name: "Fiona Whitcombe", email: "fiona.w@kestrelavionics.com", role: "Finance Manager" }],
    },
    {
      name: "Bramwell & Ives Logistics",
      tier: "standard",
      strategicStatus: "none",
      invoices: [
        { invoiceNo: "BIL-0921", amount: 4300, daysOverdue: 3, status: "overdue", caseTitle: "Send a routine reminder on Bramwell & Ives' newly overdue invoice" },
        { invoiceNo: "BIL-0908", amount: 7800, daysOverdue: 0, status: "current" },
      ],
    },
    {
      name: "Corvid Analytics Inc",
      tier: "standard",
      strategicStatus: "none",
      invoices: [
        { invoiceNo: "COR-6120", amount: 12750, daysOverdue: 95, status: "overdue", caseTitle: "Escalate Corvid's severely overdue balance", caseNoteHint: "write-off under discussion, requires human review" },
      ],
    },
    {
      name: "Palisade Home Goods",
      tier: "standard",
      strategicStatus: "none",
      invoices: [
        { invoiceNo: "PHG-4471", amount: 3100, daysOverdue: 0, status: "paid" },
        { invoiceNo: "PHG-4488", amount: 5600, daysOverdue: 22, status: "overdue", caseTitle: "Send invoice copy and follow up on Palisade's outstanding balance" },
      ],
    },
    {
      name: "Thistledown Craft Brewing",
      tier: "standard",
      strategicStatus: "none",
      invoices: [
        { invoiceNo: "TCB-1180", amount: 2400, daysOverdue: 45, status: "overdue", caseTitle: "Resolve incorrect billing contact and follow up on overdue invoice", caseNoteHint: "billing contact bounced, needs updated details before contact" },
      ],
    },
  ];

  for (const c of customers) {
    const customer = await prisma.customer.create({
      data: { orgId: org.id, name: c.name, email: emailFor(c.name), tier: c.tier, strategicStatus: c.strategicStatus },
    });

    if (c.escalation) {
      for (const contact of c.escalation) {
        await prisma.escalationContact.create({ data: { customerId: customer.id, ...contact } });
      }
    }

    for (const inv of c.invoices) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - inv.daysOverdue);
      const invoice = await prisma.invoice.create({
        data: {
          orgId: org.id,
          customerId: customer.id,
          invoiceNo: inv.invoiceNo,
          amount: inv.amount,
          dueDate,
          status: inv.status,
          daysOverdue: Math.max(inv.daysOverdue, 0),
        },
      });

      if (inv.caseTitle) {
        const title = inv.caseNoteHint ? `${inv.caseTitle} (${inv.caseNoteHint})` : inv.caseTitle;
        const ceiling = computeAutonomyCeiling({
          agentType: "collections",
          noteText: `${title} ${inv.status}`,
          customerTier: c.tier,
          customerStrategicStatus: c.strategicStatus,
          missingRequiredContext: false,
          borderline: /near-strategic|borderline/i.test(title),
        });
        await prisma.case.create({
          data: {
            orgId: org.id,
            customerId: customer.id,
            invoiceId: invoice.id,
            agentType: "collections",
            title,
            state: ceiling.state,
            autonomy: ceiling.autonomy,
            status: "Not analyzed",
            priority: inv.amount > 50000 ? "high" : inv.daysOverdue > 60 ? "high" : "normal",
          },
        });
      }
    }
  }

  console.log(`Seeded ${customers.length} hero customers for org "${org.name}".`);

  // --- Bulk synthetic volume ------------------------------------------------
  // The hand-authored accounts above carry the demo narrative; this generates
  // hundreds more so Control Tower, Analytics, and the release-gate story
  // reflect real portfolio scale rather than a handful of rows.
  const PREFIXES = ["Ashford", "Bellrock", "Cinder", "Dunmore", "Elkfield", "Fairview", "Graymoor", "Hartlow", "Ironvale", "Juniper", "Kingswell", "Larkspur", "Millbrook", "Norwood", "Oakmere", "Pinehurst", "Quarrystone", "Ridgeway", "Silvercreek", "Thorncliff", "Underwood", "Vantage", "Westgate", "Yarrow", "Zenith"];
  const SUFFIXES = ["Industries", "Manufacturing", "Holdings", "Logistics", "Group", "Partners", "Foods", "Materials", "Components", "Systems", "Freight", "Textiles", "Chemicals", "Packaging", "Fabrication", "Distribution"];
  const AGENT_TEMPLATES: Record<string, (customer: string, ref: string) => string> = {
    collections: (c, r) => `Send a payment reminder and follow up on ${c}'s overdue invoice ${r}`,
    billing: (c, r) => `Answer ${c}'s billing query on invoice ${r}`,
    deductions: (c, r) => `Investigate deduction claimed by ${c} against invoice ${r}`,
    cash_application: (c, r) => `Match unapplied payment from ${c} against invoice ${r}`,
    supplier_payer: (c, r) => `Follow up with ${c} on payer-side correspondence for ${r}`,
  };
  const AGENT_WEIGHTS: [string, number][] = [
    ["collections", 0.55],
    ["billing", 0.18],
    ["cash_application", 0.12],
    ["deductions", 0.1],
    ["supplier_payer", 0.05],
  ];
  function pickAgentType(): string {
    const roll = Math.random();
    let acc = 0;
    for (const [type, weight] of AGENT_WEIGHTS) {
      acc += weight;
      if (roll <= acc) return type;
    }
    return "collections";
  }
  function pickStatus(): "current" | "overdue" | "paid" | "disputed" {
    const roll = Math.random();
    if (roll < 0.32) return "paid";
    if (roll < 0.42) return "current";
    if (roll < 0.9) return "overdue";
    return "disputed";
  }

  const BULK_COUNT = 180;
  let invoiceSeq = 7000;
  let bulkCases = 0;

  for (let i = 0; i < BULK_COUNT; i++) {
    const prefix = PREFIXES[i % PREFIXES.length];
    const suffix = SUFFIXES[(i * 7 + 3) % SUFFIXES.length];
    const name = `${prefix} ${suffix}${i >= PREFIXES.length ? ` ${Math.floor(i / PREFIXES.length) + 1}` : ""}`;
    const strategic = Math.random() < 0.12;
    const customer = await prisma.customer.create({
      data: {
        orgId: org.id,
        name,
        email: emailFor(name),
        tier: strategic ? "strategic" : "standard",
        strategicStatus: strategic ? "key-account" : "none",
      },
    });

    const invoiceCount = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < invoiceCount; j++) {
      const status = pickStatus();
      const daysOverdue = status === "overdue" || status === "disputed" ? 1 + Math.floor(Math.random() * 110) : 0;
      const amount = Math.round((300 + Math.random() * 48000) / 10) * 10;
      const invoiceNo = `INV-${invoiceSeq++}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - daysOverdue);

      const invoice = await prisma.invoice.create({
        data: { orgId: org.id, customerId: customer.id, invoiceNo, amount, dueDate, status, daysOverdue },
      });

      const needsCase = status === "overdue" || status === "disputed" || (status === "current" && Math.random() < 0.15);
      if (!needsCase) continue;

      const agentType = status === "disputed" ? "deductions" : pickAgentType();
      const title = AGENT_TEMPLATES[agentType](name, invoiceNo);
      const ceiling = computeAutonomyCeiling({
        agentType,
        noteText: `${title} ${status}${status === "disputed" ? " customer dispute received" : ""}`,
        customerTier: customer.tier,
        customerStrategicStatus: customer.strategicStatus,
        missingRequiredContext: false,
      });
      await prisma.case.create({
        data: {
          orgId: org.id,
          customerId: customer.id,
          invoiceId: invoice.id,
          agentType,
          title,
          state: ceiling.state,
          autonomy: ceiling.autonomy,
          status: "Not analyzed",
          priority: amount > 30000 ? "high" : daysOverdue > 75 ? "high" : "normal",
        },
      });
      bulkCases++;
    }
  }
  console.log(`Seeded ${BULK_COUNT} additional synthetic customers and ${bulkCases} additional cases.`);

  // --- Agent Studio: personas -------------------------------------------
  const personas = [
    { agentType: "collections", label: "Collections", instructions: "Prioritize payroll-funding-risk accounts first. Never offer payment plans, write-offs, or term changes without human approval. Keep tone firm but respectful for accounts over 60 days overdue." },
    { agentType: "billing", label: "Billing Support", instructions: "Answer only from verified invoice and contract records. If a customer asks for a discount or credit, do not agree — route to a human." },
    { agentType: "deductions", label: "Deductions", instructions: "Compare the deduction against the original invoice, delivery record, and contract terms. Flag deductions over $10,000 for mandatory human review regardless of evidence strength." },
    { agentType: "cash_application", label: "Cash Application", instructions: "Only auto-match a payment when the amount, customer, and reference number all agree with an open invoice. Any partial or ambiguous match goes to a human queue." },
    { agentType: "supplier_payer", label: "Supplier & Payer", instructions: "Mirror the Collections agent's caution on payer-side correspondence. Escalate any request that touches contract terms." },
  ];
  for (const p of personas) {
    await prisma.agentPersona.create({ data: { orgId: org.id, ...p } });
  }

  // --- Agent Studio: automation rules -------------------------------------
  const automations = [
    { category: "payment_queries", label: "Payment queries", agentType: "billing", live: true, involvementPct: 82 },
    { category: "statement_requests", label: "Request for statements", agentType: "billing", live: true, involvementPct: 94 },
    { category: "update_details", label: "Update details", agentType: "billing", live: false, involvementPct: 0 },
    { category: "invoice_queries", label: "Invoice queries", agentType: "billing", live: true, involvementPct: 76 },
    { category: "billing_arrangement", label: "Billing arrangement", agentType: "collections", live: false, involvementPct: 0 },
    { category: "email_response", label: "Email response", agentType: "collections", live: true, involvementPct: 61 },
    { category: "generic_other", label: "Generic / other", agentType: "collections", live: false, involvementPct: 12 },
  ];
  for (const a of automations) {
    await prisma.automationRule.create({ data: { orgId: org.id, ...a } });
  }

  // --- Playbooks: segment cadences ----------------------------------------
  const highValue = await prisma.playbook.create({
    data: { orgId: org.id, name: "High Value Customers", description: "Design and configure how Flux pays you out on strategic accounts.", segment: "strategic" },
  });
  await prisma.playbookStep.createMany({
    data: [
      { playbookId: highValue.id, order: 1, triggerDays: 1, action: "send_email", template: "Gentle reminder — invoice due" },
      { playbookId: highValue.id, order: 2, triggerDays: 5, action: "escalate", template: "Notify named escalation contact" },
      { playbookId: highValue.id, order: 3, triggerDays: 15, action: "create_task", template: "Human owner call scheduled" },
      { playbookId: highValue.id, order: 4, triggerDays: 35, action: "escalate", template: "Escalate to Controller for review" },
    ],
  });
  const standardCadence = await prisma.playbook.create({
    data: { orgId: org.id, name: "Standard Accounts", description: "Default cadence for non-strategic accounts.", segment: "standard" },
  });
  await prisma.playbookStep.createMany({
    data: [
      { playbookId: standardCadence.id, order: 1, triggerDays: 3, action: "send_email", template: "Standard payment reminder" },
      { playbookId: standardCadence.id, order: 2, triggerDays: 14, action: "send_email", template: "Second reminder — firmer tone" },
      { playbookId: standardCadence.id, order: 3, triggerDays: 30, action: "create_task", template: "Route to AR analyst queue" },
    ],
  });

  console.log("Sign in locally with any seeded email, e.g. daniel@meridianmfg.com (controller) or marisol@meridianmfg.com (analyst).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
