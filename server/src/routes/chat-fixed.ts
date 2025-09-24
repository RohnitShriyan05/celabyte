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

    const user = req.user; // Type assertion to help TypeScript

    const conversation = await prisma.chatConversation.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
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

    const user = req.user;

    const conversations = await prisma.chatConversation.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.id,
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

      // Transform messages to maintain backward compatibility
      const transformedMessages = messages.map((msg) => {
        const metadata = (msg.metadata as any) || {};
        return {
          id: msg.id,
          message: msg.role === "USER" ? msg.content : "",
          response: msg.role === "ASSISTANT" ? msg.content : "",
          provider: metadata.provider || "gemini",
          createdAt: msg.createdAt,
          durationMs: metadata.durationMs || null,
          rowCount: metadata.rowCount || null,
          target: metadata.target || null,
          role: msg.role,
        };
      });

      res.json({
        success: true,
        messages: transformedMessages,
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

// Send a message and get AI response
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

      // Store the user message
      const chatMessage = await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "USER",
          content: message,
          metadata: {
            provider,
            tenantId: user.tenantId,
            userId: user.id,
          },
        },
      });

      let result: any;

      // Get AI response based on provider with enhanced error handling
      try {
        if (provider === "gemini") {
          result = await handleGeminiQuery(
            user.tenantId,
            message,
            user.id,
            undefined,
            conversationId
          );
        } else {
          result = await handleAgentQuery(user.tenantId, message, user.id);
        }
      } catch (aiError: any) {
        logger.error(
          {
            error: aiError.message,
            tenantId: user.tenantId,
            userId: user.id,
            provider,
            message: message.substring(0, 100), // Log first 100 chars of message
          },
          "AI query processing failed"
        );

        // Provide user-friendly error response
        let errorResponse = "I encountered an issue processing your request. ";

        if (
          aiError.message.includes("API key") ||
          aiError.message.includes("Configuration")
        ) {
          errorResponse +=
            "There's a configuration issue with the AI service. Please contact support.";
        } else if (
          aiError.message.includes("Network") ||
          aiError.message.includes("connection")
        ) {
          errorResponse +=
            "I'm having trouble connecting to the AI service. Please try again in a moment.";
        } else if (
          aiError.message.includes("not allowed") ||
          aiError.message.includes("Access")
        ) {
          errorResponse += aiError.message; // These are already user-friendly
        } else if (
          aiError.message.includes("not found") ||
          aiError.message.includes("does not exist")
        ) {
          errorResponse +=
            aiError.message +
            " You might want to check your data source or try a different query.";
        } else if (
          aiError.message.includes("timeout") ||
          aiError.message.includes("Timeout")
        ) {
          errorResponse +=
            "Your query took too long to process. Try asking for a smaller dataset or simplifying your request.";
        } else {
          errorResponse += `${aiError.message} You can try rephrasing your question or asking for something simpler.`;
        }

        result = {
          tool: null,
          data: null,
          answer: errorResponse,
          duration: Date.now() - t0,
          error: true,
        };
      }

      // Store the assistant response as a separate message
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "ASSISTANT",
          content: result.answer,
          metadata: {
            provider,
            tool: result.tool,
            target: result.target || null,
            data: result.data ? JSON.stringify(result.data) : null,
            rowCount: result.rows || null,
            durationMs:
              "duration" in result && result.duration
                ? result.duration
                : Date.now() - t0,
            tenantId: user.tenantId,
            userId: user.id,
          },
        },
      });

      // Update conversation timestamp
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Audit log
      await auditLog({
        tenantId: user.tenantId,
        userId: user.id,
        tool: result.tool || "CHAT",
        target: result.target,
        params: { message, provider, conversationId },
        rowCount: result.rows,
        durationMs: Date.now() - t0,
        ok: !result.error,
        error: result.error ? String(result.answer) : undefined,
      });

      res.json({
        success: true,
        message: {
          id: assistantMessage.id,
          message: message, // User's original message
          response: assistantMessage.content,
          provider: provider,
          createdAt: assistantMessage.createdAt,
          durationMs:
            (assistantMessage.metadata as any)?.durationMs || Date.now() - t0,
          rowCount: (assistantMessage.metadata as any)?.rowCount || result.rows,
          target: (assistantMessage.metadata as any)?.target || result.target,
        },
        data: result.data,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, tenantId: req.user?.tenantId },
        "Failed to process message"
      );

      // Try to create an error response message if processing failed
      const { conversationId } = req.params;
      try {
        const lastMessage = await prisma.chatMessage.findFirst({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
        });

        // If the last message is from the user (no assistant response yet), create an error response
        if (lastMessage && lastMessage.role === "USER") {
          await prisma.chatMessage.create({
            data: {
              conversationId,
              role: "ASSISTANT",
              content: `Error: ${error.message}`,
              metadata: {
                error: true,
                durationMs: Date.now() - t0,
              },
            },
          });
        }
      } catch (errorHandlingError: any) {
        logger.error(
          {
            error: errorHandlingError.message,
            conversationId,
          },
          "Failed to create error response message"
        );
      }

      res.status(400).json({ error: error.message });
    }
  }
);

// Delete a conversation
router.delete("/:conversationId", requireRole("VIEWER"), async (req, res) => {
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

    // Delete messages first (cascade)
    await prisma.chatMessage.deleteMany({
      where: { conversationId },
    });

    // Delete conversation
    await prisma.chatConversation.delete({
      where: { id: conversationId },
    });

    res.json({ success: true });
  } catch (error: any) {
    logger.error(
      { error: error.message, tenantId: req.user?.tenantId },
      "Failed to delete conversation"
    );
    res.status(400).json({ error: error.message });
  }
});

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

    // Verify conversation belongs to user and update
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

export default router;
