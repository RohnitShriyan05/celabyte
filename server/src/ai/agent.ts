import OpenAI from "openai";
import { sqlSchema, mongoSchema, sheetSchema } from "./tools";
import { getAllowedTables } from "../services/whitelist";
import { getTenantConnection } from "../services/poolManager";
import { runSQL } from "../db/sqlRunner";
import { runMongo } from "../db/mongoRunner";
import { runSheet } from "../db/sheetRunner";

const SYSTEM = `You are a careful data assistant for analytics. 
Use tools runSQL, runMongo, runSheet. Prefer small limits and equality filters.
Only query whitelisted tables/collections. If schema unclear, ask for the exact table/collection name.`;

// Fix: Type definitions for OpenAI chat completion responses, especially tool_calls and function arguments
type ToolCall = {
  function: {
    name: string;
    arguments: string;
  };
};

type ChatCompletionChoice = {
  message: {
    content: string;
    tool_calls?: ToolCall[];
  };
};

type ChatCompletionResponse = {
  choices: ChatCompletionChoice[];
};

export async function handleAgentQuery(
  tenantId: string,
  message: string,
  userId?: string
) {
  const oai = new OpenAI();

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
  })) as ChatCompletionResponse;

  const call = chat.choices[0].message.tool_calls?.[0];
  if (!call) {
    return {
      tool: null,
      data: null,
      answer: chat.choices[0].message.content,
    };
  }

  // Enforce whitelist
  const wl = await getAllowedTables(tenantId);

  const conn = await getTenantConnection(tenantId);
  let data: any, target: string | undefined;

  if (call.function.name === "runSQL") {
    const args = sqlSchema.parse(JSON.parse(call.function.arguments));
    target = args.table;
    const allowedCols = wl.get(args.table);
    if (!allowedCols && !wl.has(args.table)) throw new Error("table not allowed");
    if (conn.kind !== "POSTGRES" && conn.kind !== "MYSQL")
      throw new Error("tenant connection is not SQL");
    data = await runSQL(conn.client, allowedCols, args);
  } else if (call.function.name === "runMongo") {
    const args = mongoSchema.parse(JSON.parse(call.function.arguments));
    target = `${args.db}.${args.collection}`;
    const allowedCols = wl.get(target);
    if (!allowedCols && !wl.has(target)) throw new Error("collection not allowed");
    if (conn.kind !== "MONGODB") throw new Error("tenant connection is not Mongo");
    data = await runMongo(conn.client, allowedCols, args);
  } else if (call.function.name === "runSheet") {
    const args = sheetSchema.parse(JSON.parse(call.function.arguments));
    target = `${args.path}!${args.sheet}`;
    const allowedCols = wl.get(target);
    if (!allowedCols && !wl.has(target)) throw new Error("sheet not allowed");
    if (conn.kind !== "EXCEL") throw new Error("tenant connection is not Sheet");
    data = await runSheet(conn.client, allowedCols, args);
  } else {
    throw new Error("unknown tool");
  }

  const final = (await oai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Summarize briefly. If tabular, show key stats and JSON preview (max 20 rows).",
      },
      { role: "user", content: message },
      {
        role: "function",
        name: call.function.name,
        content: JSON.stringify(Array.isArray(data) ? data.slice(0, 20) : data),
      },
    ],
  })) as ChatCompletionResponse;

  return {
    tool: call.function.name,
    target,
    rows: Array.isArray(data) ? data.length : undefined,
    data: Array.isArray(data) ? data.slice(0, 20) : data,
    answer: final.choices[0].message.content,
  };
}
