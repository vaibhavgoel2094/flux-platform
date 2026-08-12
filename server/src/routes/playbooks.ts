import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const playbooksRouter = Router();

playbooksRouter.get("/", requireAuth, async (req, res) => {
  const playbooks = await prisma.playbook.findMany({
    where: { orgId: req.user!.orgId },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(playbooks);
});

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  segment: z.enum(["strategic", "standard", "all"]),
});

playbooksRouter.post("/", requireAuth, requireRole("controller", "cfo", "admin"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "name and segment are required." });
    return;
  }
  const playbook = await prisma.playbook.create({
    data: { orgId: req.user!.orgId, name: parsed.data.name, description: parsed.data.description ?? "", segment: parsed.data.segment },
  });
  res.status(201).json({ ...playbook, steps: [] });
});

const stepSchema = z.object({
  triggerDays: z.number().int().min(0),
  action: z.enum(["send_email", "escalate", "create_task", "phone_call"]),
  template: z.string().min(1),
});

playbooksRouter.post("/:id/steps", requireAuth, requireRole("controller", "cfo", "admin"), async (req, res) => {
  const parsed = stepSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "triggerDays, action, and template are required." });
    return;
  }
  const playbook = await prisma.playbook.findFirst({ where: { id: String(req.params.id), orgId: req.user!.orgId }, include: { steps: true } });
  if (!playbook) {
    res.status(404).json({ error: "Playbook not found." });
    return;
  }
  const step = await prisma.playbookStep.create({
    data: { playbookId: playbook.id, order: playbook.steps.length + 1, ...parsed.data },
  });
  res.status(201).json(step);
});

playbooksRouter.delete("/steps/:stepId", requireAuth, requireRole("controller", "cfo", "admin"), async (req, res) => {
  await prisma.playbookStep.delete({ where: { id: String(req.params.stepId) } });
  res.json({ ok: true });
});
