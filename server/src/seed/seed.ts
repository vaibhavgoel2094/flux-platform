// Fresh synthetic seed data for Flux Platform. Independent of, and not
// copied from, the ai-collections-agent capstone's dataset — new fictional
// org, customers, and invoices for the new repository.
import { prisma } from "../db.js";
import { computeAutonomyCeiling } from "../governance/autonomy.js";

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
    invoices: { invoiceNo: string; amount: number; daysOverdue: number; status: "current" | "overdue" | "paid" | "disputed"; caseTitle?: string; caseNoteHint?: string }[];
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
      data: { orgId: org.id, name: c.name, tier: c.tier, strategicStatus: c.strategicStatus },
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

  console.log(`Seeded ${customers.length} customers for org "${org.name}".`);
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
