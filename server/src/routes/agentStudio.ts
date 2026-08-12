import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const agentStudioRouter = Router();

agentStudioRouter.get("/personas", requireAuth, async (req, res) => {
  const personas = await prisma.agentPersona.findMany({ where: { orgId: req.user!.orgId }, orderBy: { agentType: "asc" } });
  res.json(personas);
});

const personaSchema = z.object({ instructions: z.string().min(1) });

agentStudioRouter.put("/personas/:agentType", requireAuth, requireRole("controller", "cfo", "admin"), async (req, res) => {
  const parsed = personaSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "instructions is required." });
    return;
  }
  const persona = await prisma.agentPersona.update({
    where: { orgId_agentType: { orgId: req.user!.orgId, agentType: String(req.params.agentType) } },
    data: { instructions: parsed.data.instructions },
  });
  res.json(persona);
});

agentStudioRouter.get("/automations", requireAuth, async (req, res) => {
  const rules = await prisma.automationRule.findMany({ where: { orgId: req.user!.orgId }, orderBy: { category: "asc" } });
  res.json(rules);
});

const toggleSchema = z.object({ live: z.boolean() });

agentStudioRouter.put("/automations/:id", requireAuth, requireRole("controller", "cfo", "admin"), async (req, res) => {
  const parsed = toggleSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "live must be a boolean." });
    return;
  }
  const rule = await prisma.automationRule.update({ where: { id: String(req.params.id) }, data: { live: parsed.data.live } });
  res.json(rule);
});
