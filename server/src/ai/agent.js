"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAgentQuery = handleAgentQuery;
const openai_1 = __importDefault(require("openai"));
const tools_1 = require("./tools");
const whitelist_1 = require("../services/whitelist");
const poolManager_1 = require("../services/poolManager");
const sqlRunner_1 = require("../db/sqlRunner");
const mongoRunner_1 = require("../db/mongoRunner");
const sheetRunner_1 = require("../db/sheetRunner");
const SYSTEM = `You are a careful data assistant for analytics. 
Use tools runSQL, runMongo, runSheet. Prefer small limits and equality filters.
Only query whitelisted tables/collections. If schema unclear, ask for the exact table/collection name.`;
async function handleAgentQuery(tenantId, message, userId) {
    const oai = new openai_1.default();
    const chat = (await oai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: message },
        ],
        tools: [
            {
                type: "function",
                function: {
                    name: "runSQL",
                    parameters: {
                        type: "object",
                        properties: {
                            dialect: { type: "string", enum: ["postgres", "mysql"] },
                            table: { type: "string" },
                            columns: { type: "array", items: { type: "string" } },
                            where: { type: "object", additionalProperties: true },
                            orderBy: { type: "string" },
                            limit: { type: "number" },
                        },
                        required: ["dialect", "table"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "runMongo",
                    parameters: {
                        type: "object",
                        properties: {
                            db: { type: "string" },
                            collection: { type: "string" },
                            filter: { type: "object", additionalProperties: true },
                            projection: { type: "object", additionalProperties: { type: "number" } },
                            sort: { type: "object", additionalProperties: { type: "number" } },
                            limit: { type: "number" },
                        },
                        required: ["db", "collection"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "runSheet",
                    parameters: {
                        type: "object",
                        properties: {
                            path: { type: "string" },
                            sheet: { type: "string" },
                            filter: { type: "object", additionalProperties: true },
                            select: { type: "array", items: { type: "string" } },
                            limit: { type: "number" },
                        },
                        required: ["path", "sheet"],
                    },
                },
            },
        ],
        tool_choice: "auto",
    }));
    const call = chat.choices[0].message.tool_calls?.[0];
    if (!call) {
        return {
            tool: null,
            data: null,
            answer: chat.choices[0].message.content,
        };
    }
    // Enforce whitelist
    const wl = await (0, whitelist_1.getAllowedTables)(tenantId);
    const conn = await (0, poolManager_1.getTenantConnection)(tenantId);
    let data, target;
    if (call.function.name === "runSQL") {
        const args = tools_1.sqlSchema.parse(JSON.parse(call.function.arguments));
        target = args.table;
        const allowedCols = wl.get(args.table);
        if (!allowedCols && !wl.has(args.table))
            throw new Error("table not allowed");
        if (conn.kind !== "POSTGRES" && conn.kind !== "MYSQL")
            throw new Error("tenant connection is not SQL");
        data = await (0, sqlRunner_1.runSQL)(conn.client, allowedCols, args);
    }
    else if (call.function.name === "runMongo") {
        const args = tools_1.mongoSchema.parse(JSON.parse(call.function.arguments));
        target = `${args.db}.${args.collection}`;
        const allowedCols = wl.get(target);
        if (!allowedCols && !wl.has(target))
            throw new Error("collection not allowed");
        if (conn.kind !== "MONGODB")
            throw new Error("tenant connection is not Mongo");
        data = await (0, mongoRunner_1.runMongo)(conn.client, allowedCols, args);
    }
    else if (call.function.name === "runSheet") {
        const args = tools_1.sheetSchema.parse(JSON.parse(call.function.arguments));
        target = `${args.path}!${args.sheet}`;
        const allowedCols = wl.get(target);
        if (!allowedCols && !wl.has(target))
            throw new Error("sheet not allowed");
        if (conn.kind !== "EXCEL")
            throw new Error("tenant connection is not Sheet");
        data = await (0, sheetRunner_1.runSheet)(conn.client, allowedCols, args);
    }
    else {
        throw new Error("unknown tool");
    }
    const final = (await oai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
            {
                role: "system",
                content: "Summarize briefly. If tabular, show key stats and JSON preview (max 20 rows).",
            },
            { role: "user", content: message },
            {
                role: "function",
                name: call.function.name,
                content: JSON.stringify(Array.isArray(data) ? data.slice(0, 20) : data),
            },
        ],
    }));
    return {
        tool: call.function.name,
        target,
        rows: Array.isArray(data) ? data.length : undefined,
        data: Array.isArray(data) ? data.slice(0, 20) : data,
        answer: final.choices[0].message.content,
    };
}
