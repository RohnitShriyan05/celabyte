"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheetSchema = exports.mongoSchema = exports.sqlSchema = void 0;
// src/ai/tools.ts
const zod_1 = require("zod");
exports.sqlSchema = zod_1.z.object({
    dialect: zod_1.z.enum(["postgres", "mysql"]),
    table: zod_1.z.string(),
    columns: zod_1.z.array(zod_1.z.string()).default(["*"]),
    where: zod_1.z.record(zod_1.z.any()).default({}),
    orderBy: zod_1.z.string().optional(),
    limit: zod_1.z.number().min(1).max(200).default(50)
});
exports.mongoSchema = zod_1.z.object({
    db: zod_1.z.string(),
    collection: zod_1.z.string(),
    filter: zod_1.z.record(zod_1.z.any()).default({}),
    projection: zod_1.z.record(zod_1.z.number()).default({}),
    sort: zod_1.z.record(zod_1.z.number()).optional(),
    limit: zod_1.z.number().min(1).max(200).default(50)
});
exports.sheetSchema = zod_1.z.object({
    path: zod_1.z.string(),
    sheet: zod_1.z.string(),
    filter: zod_1.z.record(zod_1.z.any()).default({}),
    select: zod_1.z.array(zod_1.z.string()).default([]),
    limit: zod_1.z.number().min(1).max(200).default(50)
});
