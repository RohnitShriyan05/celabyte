// src/services/sheetDiscovery.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

interface SheetInfo {
  spreadsheetId: string;
  sheetName: string;
  fullName: string; // spreadsheetId!sheetName
}

export class SheetDiscoveryService {
  
  /**
   * Discovers sheets from a Google Sheets URL and automatically whitelists them
   */
  async discoverAndWhitelistSheets(tenantId: string, connectionId: string, sheetsUrl: string): Promise<SheetInfo[]> {
    try {
      const sheets = await this.discoverSheetsFromUrl(sheetsUrl);
      
      // Auto-whitelist all discovered sheets
      for (const sheet of sheets) {
        await this.ensureSheetWhitelisted(tenantId, connectionId, sheet);
      }
      
      logger.info({
        tenantId,
        connectionId,
        sheetsCount: sheets.length,
        sheets: sheets.map(s => s.fullName)
      }, "Auto-discovered and whitelisted sheets");
      
      return sheets;
      
    } catch (error: any) {
      logger.error({
        tenantId,
        connectionId,
        error: error.message,
        sheetsUrl
      }, "Failed to discover sheets");
      throw error;
    }
  }
  
  /**
   * Discovers sheets from a Google Sheets URL
   */
  private async discoverSheetsFromUrl(sheetsUrl: string): Promise<SheetInfo[]> {
    const sheets: SheetInfo[] = [];
    
    // Extract spreadsheet ID from URL
    const spreadsheetId = this.extractSpreadsheetId(sheetsUrl);
    if (!spreadsheetId) {
      throw new Error("Invalid Google Sheets URL");
    }
    
    // For now, we'll create default sheet entries
    // In a full implementation, you'd use Google Sheets API to get actual sheet names
    const defaultSheets = [
      'Sheet1',
      'gid_0', // Default sheet with gid
      'teams', // Common sheet names
      'data',
      'users'
    ];
    
    // Check if URL has specific gid
    const gidMatch = sheetsUrl.match(/gid=(\d+)/);
    if (gidMatch) {
      const gidSheetName = `gid_${gidMatch[1]}`;
      sheets.push({
        spreadsheetId,
        sheetName: gidSheetName,
        fullName: `${spreadsheetId}!${gidSheetName}`
      });
    }
    
    // Add default sheets
    for (const sheetName of defaultSheets) {
      sheets.push({
        spreadsheetId,
        sheetName,
        fullName: `${spreadsheetId}!${sheetName}`
      });
    }
    
    return sheets;
  }
  
  /**
   * Ensures a sheet is whitelisted for the tenant
   */
  private async ensureSheetWhitelisted(tenantId: string, connectionId: string, sheet: SheetInfo): Promise<void> {
    const existing = await prisma.allowedTable.findFirst({
      where: {
        tenantId,
        name: sheet.fullName
      }
    });
    
    if (!existing) {
      await prisma.allowedTable.create({
        data: {
          tenantId,
          connectionId,
          name: sheet.fullName,
          allowedCols: '[]' // Empty array means all columns allowed
        }
      });
      
      logger.debug({
        tenantId,
        connectionId,
        sheetName: sheet.fullName
      }, "Auto-whitelisted sheet");
    }
  }
  
  /**
   * Extracts spreadsheet ID from Google Sheets URL
   */
  private extractSpreadsheetId(url: string): string | null {
    // Handle different Google Sheets URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/ // Direct spreadsheet ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }
  
  /**
   * Adds a specific sheet to whitelist (for manual additions)
   */
  async addSheetToWhitelist(tenantId: string, connectionId: string, sheetIdentifier: string): Promise<void> {
    // Handle both full sheet names and just sheet names
    let fullSheetName = sheetIdentifier;
    
    if (!sheetIdentifier.includes('!')) {
      // If no spreadsheet ID provided, try to find it from connection
      const connection = await prisma.connection.findFirst({
        where: { id: connectionId, tenantId }
      });
      
      if (connection) {
        const spreadsheetId = this.extractSpreadsheetId(connection.encUri);
        if (spreadsheetId) {
          fullSheetName = `${spreadsheetId}!${sheetIdentifier}`;
        }
      }
    }
    
    await this.ensureSheetWhitelisted(tenantId, connectionId, {
      spreadsheetId: fullSheetName.split('!')[0],
      sheetName: fullSheetName.split('!')[1],
      fullName: fullSheetName
    });
  }
  
  /**
   * Gets all whitelisted sheets for a tenant
   */
  async getWhitelistedSheets(tenantId: string): Promise<string[]> {
    const allowedTables = await prisma.allowedTable.findMany({
      where: { tenantId },
      select: { name: true }
    });
    
    return allowedTables
      .map(t => t.name)
      .filter(name => name.includes('!')); // Only sheet names
  }
  
  /**
   * Removes a sheet from whitelist
   */
  async removeSheetFromWhitelist(tenantId: string, sheetName: string): Promise<void> {
    await prisma.allowedTable.deleteMany({
      where: {
        tenantId,
        name: sheetName
      }
    });
    
    logger.info({
      tenantId,
      sheetName
    }, "Removed sheet from whitelist");
  }
}

export const sheetDiscoveryService = new SheetDiscoveryService();
