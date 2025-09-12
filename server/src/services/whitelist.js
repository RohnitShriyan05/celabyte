"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedTables = getAllowedTables;
// src/services/whitelist.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getAllowedTables(tenantId) {
    const list = await prisma.allowedTable.findMany({ where: { tenantId } });
    // Map name => allowedCols (empty means all)
    const map = new Map();
    for (const r of list) {
        const raw = r.allowedCols;
        let cols = [];
        if (typeof raw === "string") {
            try {
                const parsed = JSON.parse(raw);
                cols = Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string") : [];
            }
            catch {
                cols = [];
            }
        }
        else if (Array.isArray(raw)) {
            cols = raw.filter((c) => typeof c === "string");
        }
        else {
            cols = [];
        }
        map.set(r.name, cols);
    }
    return map;
}
