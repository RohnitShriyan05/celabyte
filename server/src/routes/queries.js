"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/queries.ts
const express_1 = require("express");
const rbac_1 = require("../auth/rbac");
const audit_1 = require("../services/audit");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get query history for the current tenant
router.get("/history", (0, rbac_1.requireRole)("VIEWER"), async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const queries = await prisma.queryLog.findMany({
            where: {
                tenantId: req.user.tenantId,
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: parseInt(limit),
            skip: parseInt(offset),
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
            query: query.params?.message || query.params?.query || 'Unknown query',
            timestamp: query.createdAt.toLocaleString(),
            duration: query.durationMs,
            rows: query.rowCount,
            status: query.ok ? 'success' : 'error',
            error: query.error,
            tool: query.tool,
            target: query.target
        }));
        res.json(formattedQueries);
    }
    catch (error) {
        logger_1.logger.error({ error: error.message, tenantId: req.user?.tenantId }, "Failed to fetch query history");
        res.status(500).json({ error: "Failed to fetch query history" });
    }
});
// Get query statistics
router.get("/stats", (0, rbac_1.requireRole)("VIEWER"), async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
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
    }
    catch (error) {
        logger_1.logger.error({ error: error.message, tenantId: req.user?.tenantId }, "Failed to fetch query stats");
        res.status(500).json({ error: "Failed to fetch query statistics" });
    }
});
// Delete query from history
router.delete("/:queryId", (0, rbac_1.requireRole)("ADMIN"), async (req, res) => {
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
        await (0, audit_1.auditLog)({
            tenantId: req.user.tenantId,
            userId: req.user.id,
            tool: "delete_query",
            params: { queryId },
            durationMs: 0,
            ok: true
        });
        res.json({ message: "Query deleted successfully" });
    }
    catch (error) {
        logger_1.logger.error({ error: error.message, tenantId: req.user?.tenantId }, "Failed to delete query");
        res.status(500).json({ error: "Failed to delete query" });
    }
});
// Clear all query history for tenant
router.delete("/", (0, rbac_1.requireRole)("ADMIN"), async (req, res) => {
    try {
        const result = await prisma.queryLog.deleteMany({
            where: {
                tenantId: req.user.tenantId
            }
        });
        await (0, audit_1.auditLog)({
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
    }
    catch (error) {
        logger_1.logger.error({ error: error.message, tenantId: req.user?.tenantId }, "Failed to clear query history");
        res.status(500).json({ error: "Failed to clear query history" });
    }
});
exports.default = router;
