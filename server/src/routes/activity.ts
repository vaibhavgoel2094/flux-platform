import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const activityRouter = Router();

activityRouter.get("/", requireAuth, async (req, res) => {
  const entries = await prisma.activityEntry.findMany({
    where: { orgId: req.user!.orgId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(entries.map((e) => ({ ...e, detail: JSON.parse(e.detail) })));
});

activityRouter.get("/export", requireAuth, async (req, res) => {
  const entries = await prisma.activityEntry.findMany({ where: { orgId: req.user!.orgId }, orderBy: { createdAt: "desc" } });
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=flux-activity-export.json");
  res.json(entries.map((e) => ({ ...e, detail: JSON.parse(e.detail) })));
});
