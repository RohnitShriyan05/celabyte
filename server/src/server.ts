// src/server.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { authMiddleware } from "./auth/jwt";
import { tenantContext } from "./middleware/tenant";
import agentRouter from "./routes/agent";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import connectionsRouter from "./routes/connections";
import allowedTablesRouter from "./routes/allowedTables";
import queriesRouter from "./routes/queries";
import billingRouter from "./routes/billing";
import sheetsRouter from "./routes/sheets";

const app = express();
app.set("x-powered-by", false);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "300kb" }));
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/health", healthRouter);
app.use("/auth", authRouter);

// Auth then tenant context for protected routes
app.use(authMiddleware); // attaches req.user
app.use(tenantContext); // attaches req.tenant, req.role

app.use("/agent", agentRouter);
app.use("/connections", connectionsRouter);
app.use("/allowed-tables", allowedTablesRouter);
app.use("/queries", queriesRouter);
app.use("/billing", billingRouter);
app.use("/sheets", sheetsRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "Unhandled error");
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message ?? "Internal Server Error" });
});

app.listen(env.port, '0.0.0.0', () => logger.info(`api up on :${env.port}`));
