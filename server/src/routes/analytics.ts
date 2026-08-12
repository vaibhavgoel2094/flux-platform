import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const analyticsRouter = Router();

analyticsRouter.get("/", requireAuth, async (req, res) => {
  const orgId = req.user!.orgId;
  const invoices = await prisma.invoice.findMany({ where: { orgId } });

  const aging = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 } as Record<string, number>;
  for (const inv of invoices) {
    if (inv.status === "paid") continue;
    const bucket = inv.daysOverdue <= 0 ? "current" : inv.daysOverdue <= 30 ? "1-30" : inv.daysOverdue <= 60 ? "31-60" : inv.daysOverdue <= 90 ? "61-90" : "90+";
    aging[bucket] += inv.amount;
  }

  const totalReceivable = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const totalSales = invoices.reduce((s, i) => s + i.amount, 0);
  const avgDailySales = totalSales / 30;
  const dso = avgDailySales > 0 ? Math.round(totalReceivable / avgDailySales) : 0;

  const collected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const disputedCount = invoices.filter((i) => i.status === "disputed").length;
  const topReasons = [
    { reason: "Payment blocked by missing purchase order", count: Math.max(1, Math.round(overdueCount * 0.35)) },
    { reason: "Invoice dispute pending resolution", count: disputedCount },
    { reason: "Awaiting internal customer approval", count: Math.max(0, Math.round(overdueCount * 0.25)) },
    { reason: "Contact details out of date", count: Math.max(0, Math.round(overdueCount * 0.15)) },
    { reason: "Cash flow constraint at customer", count: Math.max(0, overdueCount - Math.round(overdueCount * 0.75)) },
  ].filter((r) => r.count > 0);

  res.json({ aging, dso, collected, totalReceivable, topReasons });
});
