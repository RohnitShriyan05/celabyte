// src/routes/agent.ts
import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { handleAgentQuery } from "../ai/agent";
import { handleGeminiQuery } from "../ai/geminiAgent";
import { auditLog } from "../services/audit";
import { requireViewer } from "../auth/authorization";
import { SECURITY } from "../config/security";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import {
  tenantRateLimit,
  validateQuery,
  sanitizeInput,
  requestTimeout,
} from "../middleware/security";

const router = Router();

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  provider: z.enum(["openai", "gemini"]).optional().default("gemini"),
  selectedConnections: z.array(z.string()).optional(),
});

router.post(
  "/",
  requireViewer,
  tenantRateLimit(SECURITY.rateLimitRequests, SECURITY.rateLimitWindow),
  sanitizeInput,
  validateQuery,
  requestTimeout(SECURITY.queryTimeoutMs),
  async (req: any, res: Response, next: import("express").NextFunction) => {
    const t0 = Date.now();
    try {
      const { message, provider, selectedConnections } = bodySchema.parse(
        req.body
      );

      logger.info(
        {
          tenantId: req.user.tenantId,
          userId: req.user.id,
          provider,
          messageLength: message.length,
          selectedConnections: selectedConnections?.length || 0,
        },
        "Processing agent query"
      );

      let result: any;

      // Use Gemini by default, fallback to OpenAI if needed
      if (provider === "gemini" && env.geminiKey) {
        result = await handleGeminiQuery(
          req.user.tenantId,
          message,
          req.user.id,
          selectedConnections
        );
      } else if (provider === "openai" && env.openaiKey) {
        result = await handleAgentQuery(
          req.user.tenantId,
          message,
          req.user.id
        );
      } else if (env.geminiKey) {
        // Fallback to Gemini if OpenAI not available
        result = await handleGeminiQuery(
          req.user.tenantId,
          message,
          req.user.id,
          selectedConnections
        );
      } else if (env.openaiKey) {
        // Fallback to OpenAI if Gemini not available
        result = await handleAgentQuery(
          req.user.tenantId,
          message,
          req.user.id
        );
      } else {
        throw new Error(
          "No AI provider configured. Please set GEMINI_API_KEY or OPENAI_API_KEY"
        );
      }

      await auditLog({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        tool: result.tool ?? "none",
        target: result.target,
        params: { message: message.substring(0, 100), provider },
        rowCount: result.rows,
        durationMs: result.duration || Date.now() - t0,
        ok: true,
      });

      res.json({
        ...result,
        provider,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      logger.error(
        {
          error: e.message,
          tenantId: req.user?.tenantId,
          userId: req.user?.id,
          stack: e.stack,
        },
        "Agent query failed"
      );

      await auditLog({
        tenantId: req.user?.tenantId ?? "unknown",
        userId: req.user?.id,
        tool: "unknown",
        params: {
          messageLength: req.body?.message?.length || 0,
          provider: req.body?.provider || "unknown",
          error: e.message,
        },
        durationMs: Math.min(Date.now() - t0, SECURITY.queryTimeoutMs),
        ok: false,
        error: e.message,
      });

      // Return structured error response
      res.status(400).json({
        error: e.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - t0,
      });
    }
  }
);

// Health check endpoint for agent service
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    providers: {
      gemini: !!env.geminiKey,
      openai: !!env.openaiKey,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
