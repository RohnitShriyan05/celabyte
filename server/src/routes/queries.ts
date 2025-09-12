// src/routes/queries.ts
import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { requireRole } from "../auth/rbac";
import { auditLog } from "../services/audit";
import { logger } from "../utils/logger";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Get query history for the current tenant
router.get("/history", requireRole("VIEWER"), async (req: any, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const queries = await prisma.queryLog.findMany({
      where: {
        tenantId: req.user.tenantId,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        tool: true,
        target: true,
        rowCount: true,
        durationMs: true,
        ok: true,
        error: true,
        createdAt: true,
        params: true
      }
    });

    // Transform the data for frontend consumption
    const formattedQueries = queries.map(query => ({
      id: query.id,
      query: (query.params as any)?.message || (query.params as any)?.query || 'Unknown query',
      timestamp: query.createdAt.toLocaleString(),
      duration: query.durationMs,
      rows: query.rowCount,
      status: query.ok ? 'success' : 'error',
      error: query.error,
      tool: query.tool,
      target: query.target
    }));

    res.json(formattedQueries);

  } catch (error: any) {
    logger.error({ error: error.message, tenantId: req.user?.tenantId }, "Failed to fetch query history");
    res.status(500).json({ error: "Failed to fetch query history" });
  }
});

// Get query statistics
router.get("/stats", requireRole("VIEWER"), async (req: any, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const stats = await prisma.queryLog.aggregate({
      where: {
        tenantId: req.user.tenantId,
        createdAt: {
          gte: daysAgo
        }
      },
      _count: {
        id: true
      },
      _avg: {
        durationMs: true,
        rowCount: true
      },
      _sum: {
        rowCount: true
      }
    });

    const successRate = await prisma.queryLog.count({
      where: {
        tenantId: req.user.tenantId,
        createdAt: {
          gte: daysAgo
        },
        ok: true
      }
    });

    const totalQueries = stats._count.id || 0;

    res.json({
      totalQueries,
      successRate: totalQueries > 0 ? (successRate / totalQueries) * 100 : 0,
      avgDuration: Math.round(stats._avg.durationMs || 0),
      avgRowsReturned: Math.round(stats._avg.rowCount || 0),
      totalRowsProcessed: stats._sum.rowCount || 0,
      period: `${days} days`
    });

  } catch (error: any) {
    logger.error({ error: error.message, tenantId: req.user?.tenantId }, "Failed to fetch query stats");
    res.status(500).json({ error: "Failed to fetch query statistics" });
  }
});

// Delete query from history
router.delete("/:queryId", requireRole("ADMIN"), async (req: any, res: Response) => {
  try {
    const { queryId } = req.params;

    const query = await prisma.queryLog.findFirst({
      where: {
        id: queryId,
        tenantId: req.user.tenantId
      }
    });

    if (!query) {
      return res.status(404).json({ error: "Query not found" });
    }

    await prisma.queryLog.delete({
      where: {
        id: queryId
      }
    });

    await auditLog({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      tool: "delete_query",
      params: { queryId },
      durationMs: 0,
      ok: true
    });

    res.json({ message: "Query deleted successfully" });

  } catch (error: any) {
    logger.error({ error: error.message, tenantId: req.user?.tenantId }, "Failed to delete query");
    res.status(500).json({ error: "Failed to delete query" });
  }
});

// Clear all query history for tenant
router.delete("/", requireRole("ADMIN"), async (req: any, res: Response) => {
  try {
    const result = await prisma.queryLog.deleteMany({
      where: {
        tenantId: req.user.tenantId
      }
    });

    await auditLog({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      tool: "clear_history",
      params: { deletedCount: result.count },
      durationMs: 0,
      ok: true
    });

    res.json({ 
      message: "Query history cleared successfully",
      deletedCount: result.count 
    });

  } catch (error: any) {
    logger.error({ error: error.message, tenantId: req.user?.tenantId }, "Failed to clear query history");
    res.status(500).json({ error: "Failed to clear query history" });
  }
});

export default router;
