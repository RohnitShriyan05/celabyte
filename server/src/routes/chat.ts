import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "../auth/rbac";
import { handleGeminiQuery } from "../ai/geminiAgent";
import { handleAgentQuery } from "../ai/agent";
import { auditLog } from "../services/audit";
import { SECURITY } from "../config/security";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import {
  tenantRateLimit,
  sanitizeInput,
  validateQuery,
  requestTimeout,
} from "../middleware/security";

const router = Router();
const prisma = new PrismaClient();

const createChatSchema = z.object({
  title: z.string().min(1).max(100).optional(),
});

const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  provider: z.enum(["openai", "gemini"]).optional().default("gemini"),
});

// Create a new chat conversation
router.post("/", requireRole("VIEWER"), async (req, res) => {
  try {
    const { title } = createChatSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const conversation = await prisma.chatConversation.create({
      data: {
        tenantId: req.user.tenantId,
        userId: req.user.id,
        title: title || "New Chat",
      },
    });

    res.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error(
      { error: error.message, tenantId: req.user?.tenantId },
      "Failed to create chat"
    );
    res.status(400).json({ error: error.message });
  }
});

// Get all conversations for a user
router.get("/", requireRole("VIEWER"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const conversations = await prisma.chatConversation.findMany({
      where: {
        tenantId: req.user.tenantId,
        userId: req.user.id,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json({
      success: true,
      conversations: conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv._count.messages,
      })),
    });
  } catch (error: any) {
    logger.error(
      { error: error.message, tenantId: req.user?.tenantId },
      "Failed to get conversations"
    );
    res.status(400).json({ error: error.message });
  }
});

// Get messages for a specific conversation
router.get(
  "/:conversationId/messages",
  requireRole("VIEWER"),
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const user = req.user;

      // Verify conversation belongs to user
      const conversation = await prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          tenantId: user.tenantId,
          userId: user.id,
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          metadata: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
        messages,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, tenantId: req.user?.tenantId },
        "Failed to get messages"
      );
      res.status(400).json({ error: error.message });
    }
  }
);

// Send a message in a conversation
router.post(
  "/:conversationId/messages",
  requireRole("VIEWER"),
  tenantRateLimit(),
  sanitizeInput,
  validateQuery,
  requestTimeout(30000),
  async (req, res) => {
    const t0 = Date.now();

    try {
      const { conversationId } = req.params;
      const { message, provider } = sendMessageSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const user = req.user; // Type assertion for TypeScript

      // Verify conversation belongs to user
      const conversation = await prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          tenantId: user.tenantId,
          userId: user.id,
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      logger.info(
        {
          tenantId: user.tenantId,
          userId: user.id,
          conversationId,
          provider,
          messageLength: message.length,
        },
        "Processing chat message"
      );

      let result;

      // Use Gemini by default, fallback to OpenAI if needed
      if (provider === "gemini" && env.geminiKey) {
        result = await handleGeminiQuery(
          user.tenantId,
          message,
          user.id,
          undefined,
          conversationId
        );
      } else if (provider === "openai" && env.openaiKey) {
        result = await handleAgentQuery(user.tenantId, message, user.id);
      } else if (env.geminiKey) {
        result = await handleGeminiQuery(
          user.tenantId,
          message,
          user.id,
          undefined,
          conversationId
        );
      } else if (env.openaiKey) {
        result = await handleAgentQuery(user.tenantId, message, user.id);
      } else {
        throw new Error(
          "No AI provider configured. Please set GEMINI_API_KEY or OPENAI_API_KEY"
        );
      }

      await auditLog({
        tenantId: user.tenantId,
        userId: user.id,
        tool: result.tool ?? "none",
        target: (result as any).target,
        params: {
          message: message.substring(0, 100),
          provider,
          conversationId,
        },
        rowCount: (result as any).rows,
        durationMs: (result as any).duration || Date.now() - t0,
        ok: true,
      });

      res.json({
        success: true,
        result: {
          ...result,
          provider,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          tenantId: req.user?.tenantId,
          userId: req.user?.id,
          conversationId: req.params.conversationId,
          stack: error.stack,
        },
        "Chat message failed"
      );

      await auditLog({
        tenantId: req.user?.tenantId ?? "unknown",
        userId: req.user?.id,
        tool: "unknown",
        params: {
          messageLength: req.body?.message?.length || 0,
          provider: req.body?.provider || "unknown",
          conversationId: req.params.conversationId,
          error: error.message,
        },
        durationMs: Math.min(Date.now() - t0, SECURITY.queryTimeoutMs),
        ok: false,
        error: error.message,
      });

      res.status(400).json({
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - t0,
      });
    }
  }
);

// Update conversation title
router.patch("/:conversationId", requireRole("VIEWER"), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = z
      .object({ title: z.string().min(1).max(100) })
      .parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = req.user;

    const conversation = await prisma.chatConversation.updateMany({
      where: {
        id: conversationId,
        tenantId: user.tenantId,
        userId: user.id,
      },
      data: { title },
    });

    if (conversation.count === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error(
      { error: error.message, tenantId: req.user?.tenantId },
      "Failed to update conversation"
    );
    res.status(400).json({ error: error.message });
  }
});

// Delete a conversation
router.delete("/:conversationId", requireRole("VIEWER"), async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = req.user;

    const conversation = await prisma.chatConversation.deleteMany({
      where: {
        id: conversationId,
        tenantId: user.tenantId,
        userId: user.id,
      },
    });

    if (conversation.count === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error(
      { error: error.message, tenantId: req.user?.tenantId },
      "Failed to delete conversation"
    );
    res.status(400).json({ error: error.message });
  }
});

export default router;
