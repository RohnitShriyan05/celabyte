// src/routes/sheets.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sheetDiscoveryService } from "../services/sheetDiscovery";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();
const router = Router();

const addSheetSchema = z.object({
  connectionId: z.string(),
  sheetName: z.string().min(1),
});

const removeSheetSchema = z.object({
  sheetName: z.string().min(1),
});

// GET /sheets - List all whitelisted sheets for tenant
router.get("/", async (req: any, res) => {
  try {
    const sheets = await sheetDiscoveryService.getWhitelistedSheets(req.user.tenantId);
    res.json({ sheets });
  } catch (error: any) {
    logger.error({ error: error.message, tenantId: req.user.tenantId }, "Failed to fetch sheets");
    res.status(500).json({ error: "Failed to fetch sheets" });
  }
});

// POST /sheets - Add a sheet to whitelist
router.post("/", async (req: any, res) => {
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

    await sheetDiscoveryService.addSheetToWhitelist(
      req.user.tenantId,
      connectionId,
      sheetName
    );

    res.json({ success: true, message: 'Sheet added to whitelist' });
  } catch (error: any) {
    logger.error({ 
      error: error.message, 
      tenantId: req.user.tenantId 
    }, "Failed to add sheet to whitelist");
    res.status(500).json({ error: "Failed to add sheet" });
  }
});

// DELETE /sheets - Remove a sheet from whitelist
router.delete("/", async (req: any, res) => {
  try {
    const { sheetName } = removeSheetSchema.parse(req.body);
    
    await sheetDiscoveryService.removeSheetFromWhitelist(
      req.user.tenantId,
      sheetName
    );

    res.json({ success: true, message: 'Sheet removed from whitelist' });
  } catch (error: any) {
    logger.error({ 
      error: error.message, 
      tenantId: req.user.tenantId 
    }, "Failed to remove sheet from whitelist");
    res.status(500).json({ error: "Failed to remove sheet" });
  }
});

// POST /sheets/discover/:connectionId - Discover and auto-whitelist sheets from a connection
router.post("/discover/:connectionId", async (req: any, res) => {
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

    const sheets = await sheetDiscoveryService.discoverAndWhitelistSheets(
      req.user.tenantId,
      connectionId,
      connection.encUri
    );

    res.json({ 
      success: true, 
      message: `Discovered and whitelisted ${sheets.length} sheets`,
      sheets: sheets.map(s => s.fullName)
    });
  } catch (error: any) {
    logger.error({ 
      error: error.message, 
      tenantId: req.user.tenantId,
      connectionId: req.params.connectionId
    }, "Failed to discover sheets");
    res.status(500).json({ error: "Failed to discover sheets" });
  }
});

export default router;
