import { Router } from "express";
import { prisma } from "../db.js";

export const authRouter = Router();

// Stub login: pick any seeded user by email, no password. This exists only
// to unblock product/UI development locally — production wires WorkOS/Auth0
// SSO into requireAuth instead, and this route is disabled outside dev.
authRouter.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ error: "No user with that email in the seeded workspace." });
    return;
  }
  res.cookie("fluxSession", user.id, { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 7 });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("fluxSession");
  res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  const userId = req.cookies?.fluxSession;
  if (!userId) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(401).json({ error: "Session expired." });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId });
});
