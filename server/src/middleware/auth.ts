import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";

// Stub auth for local development: a signed session cookie holding a user id.
// Swap for WorkOS/Auth0 SSO by replacing only requireAuth's cookie lookup —
// every route downstream reads req.user and never touches the cookie itself.
declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; orgId: string; name: string; email: string; role: string };
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
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
  req.user = { id: user.id, orgId: user.orgId, name: user.name, email: user.email, role: user.role };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "This action requires a different role." });
      return;
    }
    next();
  };
}
