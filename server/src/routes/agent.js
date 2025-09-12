"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/agent.ts
const express_1 = require("express");
const zod_1 = require("zod");
const agent_1 = require("../ai/agent");
const geminiAgent_1 = require("../ai/geminiAgent");
const audit_1 = require("../services/audit");
const rbac_1 = require("../auth/rbac");
const security_1 = require("../config/security");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const security_2 = require("../middleware/security");
const router = (0, express_1.Router)();
const bodySchema = zod_1.z.object({
    message: zod_1.z.string().min(1).max(2000),
    provider: zod_1.z.enum(["openai", "gemini"]).optional().default("gemini"),
    selectedConnections: zod_1.z.array(zod_1.z.string()).optional()
});
router.post("/", (0, rbac_1.requireRole)("VIEWER"), (0, security_2.tenantRateLimit)(security_1.SECURITY.rateLimitRequests, security_1.SECURITY.rateLimitWindow), security_2.sanitizeInput, security_2.validateQuery, (0, security_2.requestTimeout)(security_1.SECURITY.queryTimeoutMs), async (req, res, next) => {
    const t0 = Date.now();
    try {
        const { message, provider, selectedConnections } = bodySchema.parse(req.body);
        logger_1.logger.info({
            tenantId: req.user.tenantId,
            userId: req.user.id,
            provider,
            messageLength: message.length,
            selectedConnections: selectedConnections?.length || 0
        }, "Processing agent query");
        let result;
        // Use Gemini by default, fallback to OpenAI if needed
        if (provider === "gemini" && env_1.env.geminiKey) {
            result = await (0, geminiAgent_1.handleGeminiQuery)(req.user.tenantId, message, req.user.id, selectedConnections);
        }
        else if (provider === "openai" && env_1.env.openaiKey) {
            result = await (0, agent_1.handleAgentQuery)(req.user.tenantId, message, req.user.id);
        }
        else if (env_1.env.geminiKey) {
            // Fallback to Gemini if OpenAI not available
            result = await (0, geminiAgent_1.handleGeminiQuery)(req.user.tenantId, message, req.user.id, selectedConnections);
        }
        else if (env_1.env.openaiKey) {
            // Fallback to OpenAI if Gemini not available
            result = await (0, agent_1.handleAgentQuery)(req.user.tenantId, message, req.user.id);
        }
        else {
            throw new Error("No AI provider configured. Please set GEMINI_API_KEY or OPENAI_API_KEY");
        }
        await (0, audit_1.auditLog)({
            tenantId: req.user.tenantId,
            userId: req.user.id,
            tool: result.tool ?? "none",
            target: result.target,
            params: { message: message.substring(0, 100), provider },
            rowCount: result.rows,
            durationMs: result.duration || (Date.now() - t0),
            ok: true
        });
        res.json({
            ...result,
            provider,
            timestamp: new Date().toISOString()
        });
    }
    catch (e) {
        logger_1.logger.error({
            error: e.message,
            tenantId: req.user?.tenantId,
            userId: req.user?.id,
            stack: e.stack
        }, "Agent query failed");
        await (0, audit_1.auditLog)({
            tenantId: req.user?.tenantId ?? "unknown",
            userId: req.user?.id,
            tool: "unknown",
            params: {
                messageLength: req.body?.message?.length || 0,
                provider: req.body?.provider || "unknown",
                error: e.message
            },
            durationMs: Math.min(Date.now() - t0, security_1.SECURITY.queryTimeoutMs),
            ok: false,
            error: e.message
        });
        // Return structured error response
        res.status(400).json({
            error: e.message,
            timestamp: new Date().toISOString(),
            duration: Date.now() - t0
        });
    }
});
// Health check endpoint for agent service
router.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        providers: {
            gemini: !!env_1.env.geminiKey,
            openai: !!env_1.env.openaiKey
        },
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
