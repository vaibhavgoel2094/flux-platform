import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";

import { authRouter } from "./routes/auth.js";
import { bootstrapRouter } from "./routes/bootstrap.js";
import { customersRouter } from "./routes/customers.js";
import { casesRouter } from "./routes/cases.js";
import { evaluationsRouter } from "./routes/evaluations.js";
import { activityRouter } from "./routes/activity.js";
import { analyticsRouter } from "./routes/analytics.js";
import { playbooksRouter } from "./routes/playbooks.js";
import { agentStudioRouter } from "./routes/agentStudio.js";
import { copilotRouter } from "./routes/copilot.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "256kb" }));
app.use(pinoHttp({ redact: ["req.headers.cookie", "req.headers.authorization"] }));
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/bootstrap", bootstrapRouter);
app.use("/api/customers", customersRouter);
app.use("/api/cases", casesRouter);
app.use("/api/evaluations", evaluationsRouter);
app.use("/api/activity", activityRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/playbooks", playbooksRouter);
app.use("/api/agent-studio", agentStudioRouter);
app.use("/api/copilot", copilotRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Flux Platform server listening on http://localhost:${PORT}`);
});
