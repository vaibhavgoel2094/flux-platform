import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { REQUIRED_CONTROLS } from "./evaluations.js";

export const bootstrapRouter = Router();

bootstrapRouter.get("/", requireAuth, async (req, res) => {
  const orgId = req.user!.orgId;

  const [org, users, caseCounts, evaluations] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.user.findMany({ where: { orgId }, select: { id: true, name: true, email: true, role: true } }),
    prisma.case.groupBy({ by: ["status"], where: { orgId }, _count: true }),
    prisma.evaluation.findMany({ where: { orgId, agentType: "collections" } }),
  ]);

  const controlsAccepted = REQUIRED_CONTROLS.every((c) =>
    evaluations.some((e) => e.control === c.id && e.rating === "pass"),
  );

  res.json({
    org: { id: org?.id, name: org?.name },
    users,
    caseSummary: Object.fromEntries(caseCounts.map((c) => [c.status, c._count])),
    released: controlsAccepted,
  });
});
