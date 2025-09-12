"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
// src/services/audit.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function auditLog(input) {
    await prisma.queryLog.create({ data: {
            tenantId: input.tenantId,
            userId: input.userId,
            tool: input.tool,
            target: input.target,
            params: input.params,
            rowCount: input.rowCount ?? null,
            durationMs: input.durationMs,
            ok: input.ok,
            error: input.error ?? null
        } });
}
