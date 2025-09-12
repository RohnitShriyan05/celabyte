"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const jwt_1 = require("./auth/jwt");
const tenant_1 = require("./middleware/tenant");
const agent_1 = __importDefault(require("./routes/agent"));
const health_1 = __importDefault(require("./routes/health"));
const auth_1 = __importDefault(require("./routes/auth"));
const connections_1 = __importDefault(require("./routes/connections"));
const allowedTables_1 = __importDefault(require("./routes/allowedTables"));
const queries_1 = __importDefault(require("./routes/queries"));
const billing_1 = __importDefault(require("./routes/billing"));
const sheets_1 = __importDefault(require("./routes/sheets"));
const app = (0, express_1.default)();
app.set("x-powered-by", false);
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({ origin: env_1.env.corsOrigin, credentials: true }));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: "300kb" }));
app.use((0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use("/health", health_1.default);
app.use("/auth", auth_1.default);
// Auth then tenant context for protected routes
app.use(jwt_1.authMiddleware); // attaches req.user
app.use(tenant_1.tenantContext); // attaches req.tenant, req.role
app.use("/api/agent", agent_1.default);
app.use("/api/chat", require("./routes/chat").default);
app.use("/api/databases", require("./routes/databases").default);
app.use("/api/auth", require("./routes/auth").default);
app.use("/api/billing", billing_1.default);
app.use("/sheets", sheets_1.default);
app.use((err, _req, res, _next) => {
    logger_1.logger.error({ err }, "Unhandled error");
    const status = err.status ?? 500;
    res.status(status).json({ error: err.message ?? "Internal Server Error" });
});
app.listen(env_1.env.port, '0.0.0.0', () => logger_1.logger.info(`api up on :${env_1.env.port}`));
