import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const customersRouter = Router();

customersRouter.get("/", requireAuth, async (req, res) => {
  const customers = await prisma.customer.findMany({
    where: { orgId: req.user!.orgId },
    include: { invoices: true },
    orderBy: { name: "asc" },
  });
  res.json(
    customers.map((c) => {
      const overdue = c.invoices.filter((i) => i.status === "overdue");
      return {
        id: c.id,
        name: c.name,
        tier: c.tier,
        strategicStatus: c.strategicStatus,
        outstanding: c.invoices.filter((i) => i.status !== "paid").reduce((sum, i) => sum + i.amount, 0),
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, i) => sum + i.amount, 0),
      };
    }),
  );
});

customersRouter.get("/:id", requireAuth, async (req, res) => {
  const customer = await prisma.customer.findFirst({
    where: { id: String(req.params.id), orgId: req.user!.orgId },
    include: {
      invoices: { orderBy: { dueDate: "desc" } },
      escalationContacts: true,
      cases: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  res.json(customer);
});

customersRouter.post("/:id/escalation-contacts", requireAuth, async (req, res) => {
  const { name, email, role } = req.body ?? {};
  if (!name || !email) {
    res.status(400).json({ error: "name and email are required." });
    return;
  }
  const customer = await prisma.customer.findFirst({ where: { id: String(req.params.id), orgId: req.user!.orgId } });
  if (!customer) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  const contact = await prisma.escalationContact.create({
    data: { customerId: customer.id, name, email, role: role ?? "Escalation contact" },
  });
  res.status(201).json(contact);
});

customersRouter.put("/escalation-contacts/:contactId", requireAuth, async (req, res) => {
  const contact = await prisma.escalationContact.update({
    where: { id: String(req.params.contactId) },
    data: { active: Boolean(req.body?.active) },
  });
  res.json(contact);
});
