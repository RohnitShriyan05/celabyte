"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantConnection = getTenantConnection;
// src/services/poolManager.ts
const client_1 = require("@prisma/client");
const secretStore_1 = require("./secretStore");
const mongodb_1 = require("mongodb");
const pg_1 = require("pg");
const promise_1 = __importDefault(require("mysql2/promise"));
const prisma = new client_1.PrismaClient();
const cache = new Map();
async function getTenantConnection(tenantId, preferred) {
    const conn = await prisma.connection.findFirst({
        where: { tenantId, ...(preferred ? { kind: preferred } : {}) },
        orderBy: { createdAt: "asc" }
    });
    if (!conn)
        throw new Error("no connection configured");
    const key = `${conn.id}`;
    if (cache.has(key))
        return cache.get(key);
    const { uri } = await (0, secretStore_1.decryptConnection)(conn.encUri, conn.encMeta);
    let client;
    if (conn.kind === "POSTGRES") {
        client = new pg_1.Pool({ connectionString: uri, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
    }
    else if (conn.kind === "MYSQL") {
        client = promise_1.default.createPool({ uri, connectionLimit: 5, connectTimeout: 5000, waitForConnections: true });
    }
    else if (conn.kind === "MONGODB") {
        const c = new mongodb_1.MongoClient(uri, { maxPoolSize: 5 });
        await c.connect();
        client = c;
    }
    else if (conn.kind === "EXCEL") {
        client = { path: uri }; // "uri" can be a signed URL or storage path
    }
    else {
        throw new Error(`unsupported connection kind: ${conn.kind}`);
    }
    const wrapper = { kind: conn.kind, key, client };
    cache.set(key, wrapper);
    return wrapper;
}
