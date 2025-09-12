"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/sheets.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const sheetDiscovery_1 = require("../services/sheetDiscovery");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const addSheetSchema = zod_1.z.object({
    connectionId: zod_1.z.string(),
    sheetName: zod_1.z.string().min(1),
});
const removeSheetSchema = zod_1.z.object({
    sheetName: zod_1.z.string().min(1),
});
// GET /sheets - List all whitelisted sheets for tenant
router.get("/", async (req, res) => {
    try {
        const sheets = await sheetDiscovery_1.sheetDiscoveryService.getWhitelistedSheets(req.user.tenantId);
        res.json({ sheets });
    }
    catch (error) {
        logger_1.logger.error({ error: error.message, tenantId: req.user.tenantId }, "Failed to fetch sheets");
        res.status(500).json({ error: "Failed to fetch sheets" });
    }
});
// POST /sheets - Add a sheet to whitelist
router.post("/", async (req, res) => {
    try {
        const { connectionId, sheetName } = addSheetSchema.parse(req.body);
        // Verify connection belongs to tenant
        const connection = await prisma.connection.findFirst({
            where: {
                id: connectionId,
                tenantId: req.user.tenantId,
                kind: 'EXCEL'
            }
        });
        if (!connection) {
            return res.status(404).json({ error: 'Excel connection not found' });
        }
        await sheetDiscovery_1.sheetDiscoveryService.addSheetToWhitelist(req.user.tenantId, connectionId, sheetName);
        res.json({ success: true, message: 'Sheet added to whitelist' });
    }
    catch (error) {
        logger_1.logger.error({
            error: error.message,
            tenantId: req.user.tenantId
        }, "Failed to add sheet to whitelist");
        res.status(500).json({ error: "Failed to add sheet" });
    }
});
// DELETE /sheets - Remove a sheet from whitelist
router.delete("/", async (req, res) => {
    try {
        const { sheetName } = removeSheetSchema.parse(req.body);
        await sheetDiscovery_1.sheetDiscoveryService.removeSheetFromWhitelist(req.user.tenantId, sheetName);
        res.json({ success: true, message: 'Sheet removed from whitelist' });
    }
    catch (error) {
        logger_1.logger.error({
            error: error.message,
            tenantId: req.user.tenantId
        }, "Failed to remove sheet from whitelist");
        res.status(500).json({ error: "Failed to remove sheet" });
    }
});
// POST /sheets/discover/:connectionId - Discover and auto-whitelist sheets from a connection
router.post("/discover/:connectionId", async (req, res) => {
    try {
        const connectionId = req.params.connectionId;
        // Verify connection belongs to tenant
        const connection = await prisma.connection.findFirst({
            where: {
                id: connectionId,
                tenantId: req.user.tenantId,
                kind: 'EXCEL'
            }
        });
        if (!connection) {
            return res.status(404).json({ error: 'Excel connection not found' });
        }
        const sheets = await sheetDiscovery_1.sheetDiscoveryService.discoverAndWhitelistSheets(req.user.tenantId, connectionId, connection.encUri);
        res.json({
            success: true,
            message: `Discovered and whitelisted ${sheets.length} sheets`,
            sheets: sheets.map(s => s.fullName)
        });
    }
    catch (error) {
        logger_1.logger.error({
            error: error.message,
            tenantId: req.user.tenantId,
            connectionId: req.params.connectionId
        }, "Failed to discover sheets");
        res.status(500).json({ error: "Failed to discover sheets" });
    }
});
exports.default = router;
