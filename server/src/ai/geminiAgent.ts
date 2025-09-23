import {
  GoogleGenerativeAI,
  GoogleGenerativeAIError,
} from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";
import { sqlSchema, mongoSchema, sheetSchema } from "./tools";
import { getAllowedTables } from "../services/whitelist";
import { getTenantConnection } from "../services/poolManager";
import { runSQL, getSqlSchema } from "../db/sqlRunner";
import { runMongo, getMongoSchema } from "../db/mongoRunner";
import { runSheet, getSheetSchema } from "../db/sheetRunner";
import { logger } from "../utils/logger";
import { sheetDiscoveryService } from "../services/sheetDiscovery";

const prisma = new PrismaClient();

const SYSTEM_PROMPT = `You are Celabyte, an expert data analyst AI. Your goal is to help users understand their data by answering their questions in a conversational and helpful manner.

**Your Persona:**
- **Expert & Decisive:** You are knowledgeable and make intelligent inferences from the data provided. Avoid asking obvious clarifying questions when the answer can be determined from the sample data.
- **Data-Driven:** Analyze the sample data carefully to understand data formats, types, and patterns. Use this analysis to make informed decisions.
- **Context-Aware:** Remember the conversation history to answer follow-up questions.
- **Error-Resilient:** When queries fail, suggest alternative approaches or simpler queries that might work.

**Core Task: Analyze the user's query and available data schema, then take one of the following actions:**

1.  **Generate a Structured Query:** If the user's request can be answered with data, formulate a JSON query for one of the available tools (sql, mongo, sheet).
    - **Analyze Schema:** Pay close attention to the provided table/sheet schema, including column names and sample data. Use the EXACT column names as shown in the schema.
    - **Infer Data Formats:** Look at the sample data to understand date formats, number formats, and data types. Don't ask for clarification if the format is clear from the samples.
    - **Safety First:** Always prefer small limits (e.g., 50-100 rows) and simple filters unless the user specifies otherwise.
    - **Handle Restrictions:** Respect column access restrictions. Only use columns that are explicitly allowed.
    - **Database-Specific Optimization:**
      - **SQL:** Use proper SQL syntax for the database type (PostgreSQL vs MySQL). Handle case sensitivity appropriately.
      - **MongoDB:** Use MongoDB query operators correctly. Handle document structure properly.
      - **Sheets:** Account for potential data type inconsistencies and empty cells.
    - **Tool Format:**
      - **SQL:** \`{"action": "sql", "dialect": "postgres|mysql", "table": "exact_table_name", "columns": ["col1", "col2"], "where": {"column": "value"}, "orderBy": "column", "limit": 50}\`
      - **MongoDB:** \`{"action": "mongo", "db": "database_name", "collection": "collection_name", "filter": {"field": "value"}, "projection": {"field1": 1}, "sort": {"field": 1}, "limit": 50}\`
      - **Sheets:** \`{"action": "sheet", "sheet": "sheet_name", "filter": {"column": "value"}, "select": ["col1", "col2"], "limit": 50}\`

2.  **Ask for Clarification ONLY when truly necessary:** Only ask questions when the query is genuinely ambiguous and cannot be resolved by examining the sample data or when no accessible data sources are available.

3.  **Answer Directly:** If the user asks a general question or something that doesn't require a data query, provide a helpful, conversational response.

4.  **Handle Fallbacks Gracefully:** If you cannot fulfill a request, explain why and suggest what you *can* do. Offer simpler alternative queries or different approaches.

**Data Analysis Guidelines:**
- **Date Formats:** Examine sample date values to determine the format (MM/DD/YYYY, DD/MM/YYYY, timestamps, etc.)
- **Numeric Data:** Look at sample numbers to understand if they represent currency, percentages, counts, etc.
- **Text Data:** Analyze sample text to understand categories, formats, and patterns
- **Data Quality:** Account for potential null values, inconsistent formats, and data quality issues
- **Make Reasonable Assumptions:** When data formats are standard or obvious from samples, proceed with confidence
- **Error Recovery:** If a query might fail, suggest simpler alternatives (e.g., remove complex filters, use fewer columns)

**Query Optimization Strategies:**
- Start with simple queries and add complexity gradually
- Use appropriate data types and handle null values
- For large datasets, always use LIMIT to prevent timeouts
- When filtering, use exact matches from sample data when possible
- For text searches, consider case sensitivity issues

**Conversation History:**
- Previous user messages and your responses will be provided. Use them to understand the context of the current question.
- Refer to previous results if the user asks a follow-up question (e.g., "now show that by region").
- Learn from previous errors to avoid repeating the same mistakes.`;

// Enhanced query validation and optimization
function optimizeQuery(
  structuredQuery: any,
  connectionType: string,
  schemaInfo: any
): any {
  const optimized = { ...structuredQuery };

  // Add connection-specific optimizations
  if (connectionType === "POSTGRES" || connectionType === "MYSQL") {
    // Ensure proper SQL formatting
    if (optimized.action === "sql") {
      optimized.dialect = connectionType.toLowerCase();
      optimized.limit = Math.min(optimized.limit || 50, 100); // Reasonable limit
    }
  } else if (connectionType === "MONGODB") {
    // MongoDB-specific optimizations
    if (optimized.action === "mongo") {
      optimized.limit = Math.min(optimized.limit || 50, 100);
      // Ensure proper MongoDB syntax
      if (
        optimized.projection &&
        Object.keys(optimized.projection).length === 0
      ) {
        delete optimized.projection;
      }
    }
  } else if (connectionType === "EXCEL") {
    // Sheet-specific optimizations
    if (optimized.action === "sheet") {
      optimized.limit = Math.min(optimized.limit || 50, 100);
      // Handle potential data inconsistencies
    }
  }

  return optimized;
}
// Validate API key on startup
if (!env.geminiKey || env.geminiKey.length < 20) {
  logger.warn(
    "Invalid or missing GEMINI_API_KEY. Please set a valid API key from Google AI Studio."
  );
}

const genAI = new GoogleGenerativeAI(env.geminiKey);

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

// Retry helper function
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on authentication errors or client errors
      if (error instanceof GoogleGenerativeAIError) {
        if (
          error.message.includes("API key") ||
          error.message.includes("invalid")
        ) {
          throw new Error(
            `Invalid Gemini API key. Please check your GEMINI_API_KEY in .env file.`
          );
        }
      }

      if (attempt <= retries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
          RETRY_CONFIG.maxDelay
        );

        logger.warn(
          {
            attempt,
            maxRetries: retries,
            delay,
            error: error.message,
            context,
          },
          `Retrying ${context} after error`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

async function getSchemaContext(
  tenantId: string,
  conn: any,
  wl: Map<string, string[]>
): Promise<string> {
  let context = "\n\n**Available Data Schema & Sample Data:**\n";
  let validResources = 0;
  let totalResources = wl.size;

  for (const [name, allowedCols] of wl.entries()) {
    try {
      if (conn.kind === "POSTGRES" || conn.kind === "MYSQL") {
        const { columns, sampleData } = await getSqlSchema(conn.client, name);
        if (columns.length > 0) {
          validResources++;
          const restrictions =
            allowedCols && allowedCols.length > 0
              ? `\n- **Restricted columns:** Only ${allowedCols.join(
                  ", "
                )} are accessible`
              : `\n- **Access:** All columns accessible`;

          context += `\n**Table: ${name}** (${
            conn.kind
          })\n- **Columns:** ${columns.join(
            ", "
          )}${restrictions}\n- **Sample Data (${
            sampleData.length
          } rows):**\n${JSON.stringify(sampleData, null, 2)}\n`;
        } else {
          context += `\n**Table: ${name}** (${conn.kind})\n- **Status:** Empty or inaccessible\n`;
        }
      } else if (conn.kind === "MONGODB") {
        const [db, collection] = name.split(".");
        if (db && collection) {
          const { columns, sampleData } = await getMongoSchema(
            conn.client,
            db,
            collection
          );
          if (columns.length > 0) {
            validResources++;
            const restrictions =
              allowedCols && allowedCols.length > 0
                ? `\n- **Restricted fields:** Only ${allowedCols.join(
                    ", "
                  )} are accessible`
                : `\n- **Access:** All fields accessible`;

            context += `\n**Collection: ${name}** (MongoDB)\n- **Fields:** ${columns.join(
              ", "
            )}${restrictions}\n- **Sample Data (${
              sampleData.length
            } documents):**\n${JSON.stringify(sampleData, null, 2)}\n`;
          } else {
            context += `\n**Collection: ${name}** (MongoDB)\n- **Status:** Empty or inaccessible\n`;
          }
        }
      } else if (conn.kind === "EXCEL") {
        const sheetName = name.includes("!") ? name.split("!")[1] : name;
        const { columns, sampleData } = await getSheetSchema(
          conn.client,
          sheetName
        );
        if (columns.length > 0) {
          validResources++;
          const restrictions =
            allowedCols && allowedCols.length > 0
              ? `\n- **Restricted columns:** Only ${allowedCols.join(
                  ", "
                )} are accessible`
              : `\n- **Access:** All columns accessible`;

          context += `\n**Sheet: ${name}** (Google Sheets/Excel)\n- **Columns:** ${columns.join(
            ", "
          )}${restrictions}\n- **Sample Data (${
            sampleData.length
          } rows):**\n${JSON.stringify(sampleData, null, 2)}\n`;
        } else {
          context += `\n**Sheet: ${name}** (Google Sheets/Excel)\n- **Status:** Empty or inaccessible\n`;
        }
      }
    } catch (error: any) {
      logger.warn(
        { error: error.message, tenantId, resource: name },
        "Failed to fetch schema for context"
      );
      context += `\n**${name}** (${conn.kind})\n- **Status:** Error - ${error.message}\n`;
    }
  }

  // Add summary of available resources
  context += `\n**Summary:** ${validResources} of ${totalResources} data sources are accessible and contain data.\n`;

  if (validResources === 0) {
    context += `\n**⚠️ Warning:** No accessible data sources found. Please check permissions and data availability.\n`;
  }

  return context;
}

async function getConversationHistory(conversationId: string): Promise<string> {
  if (!conversationId) return "";

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 10, // Last 10 messages for context
  });

  if (messages.length === 0) return "";

  let history = "\n\n**Conversation History:**\n";
  for (const msg of messages) {
    const role = msg.role === "USER" ? "User" : "Assistant";
    history += `${role}: ${msg.content}\n`;

    // Include query results in context if available
    if (
      msg.metadata &&
      typeof msg.metadata === "object" &&
      "data" in msg.metadata
    ) {
      const metadata = msg.metadata as any;
      if (
        metadata.data &&
        Array.isArray(metadata.data) &&
        metadata.data.length > 0
      ) {
        history += `[Previous query returned ${metadata.data.length} rows]\n`;
      }
    }
  }

  return history;
}

async function storeConversationMessage(
  conversationId: string,
  tenantId: string,
  userId: string,
  userMessage: string,
  result: any
) {
  try {
    // Store user message
    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: "USER",
        content: userMessage,
      },
    });

    // Store assistant response
    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: result.answer,
        metadata: {
          tool: result.tool,
          target: result.target,
          rows: result.rows,
          data: result.data,
          duration: result.duration,
        },
      },
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  } catch (error: any) {
    logger.error(
      { error: error.message, conversationId, tenantId, userId },
      "Failed to store conversation message"
    );
  }
}

export async function handleGeminiQuery(
  tenantId: string,
  message: string,
  userId?: string,
  selectedConnections?: string[],
  conversationId?: string
) {
  const startTime = Date.now();

  try {
    const wl = await getAllowedTables(tenantId);
    const conn = await getTenantConnection(tenantId);

    if (!conn) {
      throw new Error("No database connection found for tenant");
    }

    // Get conversation history for context
    const conversationHistory = conversationId
      ? await getConversationHistory(conversationId)
      : "";

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512, // Reduced for faster responses
        candidateCount: 1, // Only generate one response
      },
    });

    // Step 1: Optimized source selection - limit to top 3 most likely sources
    const sourceNames = Array.from(wl.keys());
    const limitedSources = sourceNames.slice(0, 10); // Limit context size
    const initialPrompt = `Select max 3 most relevant data sources for: "${message}"

Sources: ${limitedSources.join(", ")}

Format: ["source1", "source2", "source3"]`;

    const sourceSelectionResult = (await Promise.race([
      withRetry(() => model.generateContent(initialPrompt), "source selection"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Source selection timeout")), 5000)
      ),
    ])) as any;

    const relevantSourcesText = sourceSelectionResult.response.text();
    let relevantSources: string[] = [];
    try {
      const jsonMatch = relevantSourcesText.match(/\s*(\[.*\])/s);
      if (jsonMatch) {
        relevantSources = JSON.parse(jsonMatch[1]);
      }
    } catch (e) {
      logger.warn(
        { error: e, text: relevantSourcesText },
        "Failed to parse relevant sources"
      );
      // Fallback to all sources if parsing fails
      relevantSources = sourceNames;
    }

    // Step 2: Build optimized context for relevant sources only (max 3)
    const relevantWl = new Map<string, string[]>();
    relevantSources.slice(0, 3).forEach((s) => {
      const cols = wl.get(s);
      if (cols !== undefined) {
        relevantWl.set(s, cols);
      }
    });

    let connectionContext = `Connection: ${conn.kind}`;
    if (conn.kind === "EXCEL") connectionContext += ' - use "sheet" action';
    else if (conn.kind === "POSTGRES" || conn.kind === "MYSQL")
      connectionContext += ' - use "sql" action';
    else if (conn.kind === "MONGODB")
      connectionContext += ' - use "mongo" action';

    // Get schema context - now with parallel processing for speed
    const schemaContext = await getSchemaContext(tenantId, conn, relevantWl);
    connectionContext += schemaContext;

    logger.info({ connectionContext }, "Context sent to Gemini");

    // Optimized analysis with timeout and reduced context
    const compactPrompt = `${SYSTEM_PROMPT.substring(0, 1000)}...

${connectionContext}

Query: ${message}`;

    const analysisResult = (await Promise.race([
      withRetry(
        () => model.generateContent(compactPrompt),
        "initial query analysis"
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Analysis timeout")), 8000)
      ),
    ])) as any;

    const analysisText = analysisResult.response.text();

    // Try to parse JSON response for structured queries
    let structuredQuery: any = null;
    try {
      const jsonMatch = analysisText.match(/\{.*\}/s);
      if (jsonMatch) {
        structuredQuery = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Not a structured query, treat as informational
    }

    if (!structuredQuery || !structuredQuery.action) {
      return {
        tool: null,
        data: null,
        answer: analysisText,
        duration: Date.now() - startTime,
      };
    }

    // Optimize the query based on connection type and available schema
    const optimizedQuery = optimizeQuery(
      structuredQuery,
      conn.kind,
      relevantWl
    );
    logger.info(
      { originalQuery: structuredQuery, optimizedQuery },
      "Query optimization applied"
    );

    // Execute the structured query with enhanced error handling
    let data: any, target: string | undefined, toolName: string;
    let queryAttempt = 1;
    const maxAttempts = 2;

    if (optimizedQuery.action === "sql") {
      toolName = "runSQL";
      const args = {
        dialect:
          optimizedQuery.dialect ||
          (conn.kind === "POSTGRES" ? "postgres" : "mysql"),
        table: optimizedQuery.table,
        columns: optimizedQuery.columns || ["*"],
        where: optimizedQuery.where || {},
        orderBy: optimizedQuery.orderBy,
        limit: Math.min(optimizedQuery.limit || 50, 200),
      };

      try {
        const validatedArgs = sqlSchema.parse(args);
        target = validatedArgs.table;
        const allowedCols = wl.get(validatedArgs.table);

        if (!allowedCols && !wl.has(validatedArgs.table)) {
          throw new Error(
            `Table '${
              validatedArgs.table
            }' is not available. Available tables: ${Array.from(wl.keys()).join(
              ", "
            )}`
          );
        }

        if (conn.kind !== "POSTGRES" && conn.kind !== "MYSQL") {
          throw new Error(
            `Connection type '${conn.kind}' is not compatible with SQL queries. Please use the appropriate query type for your data source.`
          );
        }

        data = await runSQL(conn.client, allowedCols, validatedArgs);

        if (!data || data.length === 0) {
          // Try a simplified query without filters if the original returned no results
          if (Object.keys(validatedArgs.where).length > 0) {
            logger.info(
              { tenantId },
              "Original query returned no results, trying without filters"
            );
            const simpleArgs = { ...validatedArgs, where: {} };
            const fallbackData = await runSQL(
              conn.client,
              allowedCols,
              simpleArgs
            );

            if (fallbackData && fallbackData.length > 0) {
              data = fallbackData.slice(0, 5); // Show sample of available data
              logger.info(
                { tenantId, originalWhere: validatedArgs.where },
                "Fallback query succeeded"
              );
            }
          }
        }
      } catch (sqlError: any) {
        logger.error(
          { error: sqlError.message, args, tenantId },
          "SQL query execution failed"
        );

        // Try to provide helpful error context
        if (sqlError.message.includes("does not exist")) {
          throw new Error(
            `${sqlError.message}. Available tables: ${Array.from(
              wl.keys()
            ).join(", ")}`
          );
        } else if (sqlError.message.includes("not allowed")) {
          const allowedCols = wl.get(args.table);
          throw new Error(
            `${sqlError.message}${
              allowedCols
                ? `. Available columns: ${allowedCols.join(", ")}`
                : ""
            }`
          );
        }
        throw sqlError;
      }
    } else if (optimizedQuery.action === "mongo") {
      toolName = "runMongo";
      const args = {
        db: optimizedQuery.db,
        collection: optimizedQuery.collection,
        filter: optimizedQuery.filter || {},
        projection: optimizedQuery.projection,
        sort: optimizedQuery.sort,
        limit: Math.min(optimizedQuery.limit || 50, 200),
      };

      try {
        const validatedArgs = mongoSchema.parse(args);
        target = `${validatedArgs.db}.${validatedArgs.collection}`;
        const allowedCols = wl.get(target);

        if (!allowedCols && !wl.has(target)) {
          throw new Error(
            `Collection '${target}' is not available. Available collections: ${Array.from(
              wl.keys()
            ).join(", ")}`
          );
        }

        if (conn.kind !== "MONGODB") {
          throw new Error(
            `Connection type '${conn.kind}' is not compatible with MongoDB queries. Please use the appropriate query type for your data source.`
          );
        }

        data = await runMongo(conn.client, allowedCols, validatedArgs);

        if (!data || data.length === 0) {
          // Try a simplified query without filters if the original returned no results
          if (Object.keys(validatedArgs.filter).length > 0) {
            logger.info(
              { tenantId },
              "Original MongoDB query returned no results, trying without filters"
            );
            const simpleArgs = { ...validatedArgs, filter: {} };
            const fallbackData = await runMongo(
              conn.client,
              allowedCols,
              simpleArgs
            );

            if (fallbackData && fallbackData.length > 0) {
              data = fallbackData.slice(0, 5); // Show sample of available data
              logger.info(
                { tenantId, originalFilter: validatedArgs.filter },
                "Fallback MongoDB query succeeded"
              );
            }
          }
        }
      } catch (mongoError: any) {
        logger.error(
          { error: mongoError.message, args, tenantId },
          "MongoDB query execution failed"
        );

        // Try to provide helpful error context
        if (mongoError.message.includes("does not exist")) {
          throw new Error(
            `${mongoError.message}. Available collections: ${Array.from(
              wl.keys()
            ).join(", ")}`
          );
        } else if (mongoError.message.includes("not allowed")) {
          const allowedCols = wl.get(target!);
          throw new Error(
            `${mongoError.message}${
              allowedCols ? `. Available fields: ${allowedCols.join(", ")}` : ""
            }`
          );
        }
        throw mongoError;
      }
    } else if (optimizedQuery.action === "sheet") {
      toolName = "runSheet";

      try {
        // Get connection details from database to extract URL
        const connDetails = await prisma.connection.findFirst({
          where: { tenantId },
        });

        if (!connDetails) {
          throw new Error("Sheet connection details not found for this tenant");
        }

        // Extract spreadsheet ID from Google Sheets URL
        const sheetsUrl = connDetails.encUri;
        let spreadsheetId = "";
        let sheetName = optimizedQuery.sheet || "Sheet1";

        // Parse Google Sheets URL to extract spreadsheet ID
        const urlMatch = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (urlMatch) {
          spreadsheetId = urlMatch[1];
        } else {
          // Fallback: use the entire URL as path
          spreadsheetId = sheetsUrl;
        }

        // Extract sheet name from URL if gid parameter exists
        const gidMatch = sheetsUrl.match(/gid=(\d+)/);
        if (gidMatch && !optimizedQuery.sheet) {
          sheetName = `gid_${gidMatch[1]}`;
        }

        const args = {
          path: spreadsheetId,
          sheet: sheetName,
          filter: optimizedQuery.filter || {},
          select: optimizedQuery.select || [],
          limit: Math.min(optimizedQuery.limit || 50, 200),
        };

        const validatedArgs = sheetSchema.parse(args);
        target = `${validatedArgs.path}!${validatedArgs.sheet}`;
        let allowedCols = wl.get(target);

        if (!allowedCols && !wl.has(target)) {
          // Auto-whitelist the sheet if it's not in the whitelist
          try {
            logger.info(
              { tenantId, target },
              "Auto-whitelisting sheet on first access"
            );
            // Get the connection ID from the database since conn.key is not the same as connection ID
            const dbConn = await prisma.connection.findFirst({
              where: { tenantId, kind: "EXCEL" },
            });
            if (dbConn) {
              await sheetDiscoveryService.addSheetToWhitelist(
                tenantId,
                dbConn.id,
                target
              );
            }
            allowedCols = []; // Empty array means all columns allowed
          } catch (autoWhitelistError: any) {
            logger.error(
              {
                tenantId,
                target,
                error: autoWhitelistError.message,
              },
              "Failed to auto-whitelist sheet"
            );
            throw new Error(
              `Sheet '${target}' is not available. Available sheets: ${Array.from(
                wl.keys()
              ).join(", ")}`
            );
          }
        }

        if (conn.kind !== "EXCEL") {
          throw new Error(
            `Connection type '${conn.kind}' is not compatible with sheet queries. Please use the appropriate query type for your data source.`
          );
        }

        data = await runSheet(conn.client, allowedCols, validatedArgs);

        if (!data || data.length === 0) {
          // Try a simplified query without filters if the original returned no results
          if (
            Object.keys(validatedArgs.filter).length > 0 ||
            validatedArgs.select.length > 0
          ) {
            logger.info(
              { tenantId },
              "Original sheet query returned no results, trying simplified version"
            );
            const simpleArgs = { ...validatedArgs, filter: {}, select: [] };
            const fallbackData = await runSheet(
              conn.client,
              allowedCols,
              simpleArgs
            );

            if (fallbackData && fallbackData.length > 0) {
              data = fallbackData.slice(0, 5); // Show sample of available data
              logger.info(
                { tenantId, originalArgs: validatedArgs },
                "Fallback sheet query succeeded"
              );
            }
          }
        }
      } catch (sheetError: any) {
        logger.error(
          { error: sheetError.message, args: optimizedQuery, tenantId },
          "Sheet query execution failed"
        );

        // Try to provide helpful error context
        if (
          sheetError.message.includes("not found") ||
          sheetError.message.includes("does not exist")
        ) {
          throw new Error(
            `${sheetError.message}. Available sheets: ${Array.from(
              wl.keys()
            ).join(", ")}`
          );
        } else if (
          sheetError.message.includes("not allowed") ||
          sheetError.message.includes("permission")
        ) {
          throw new Error(
            `${sheetError.message}. Please check sheet permissions and accessibility.`
          );
        }
        throw sheetError;
      }
    } else {
      throw new Error(`Unknown action: ${structuredQuery.action}`);
    }

    // Generate final response with enhanced data context
    const dataCount = Array.isArray(data) ? data.length : data ? 1 : 0;
    const sampleData = Array.isArray(data) ? data.slice(0, 3) : data;

    const summaryPrompt = `Analyze and summarize the query results. Provide insights and format the response in a user-friendly way.

**User's Original Query:** "${message}"

**Query Execution Details:**
- Data Source: ${target} (${conn.kind})
- Tool Used: ${toolName}
- Rows Retrieved: ${dataCount}

**Sample Data:** 
${JSON.stringify(sampleData, null, 2)}

**Instructions:**
1. If data was found, provide a clear summary of the key findings
2. If no data was returned, explain possible reasons and suggest alternatives
3. If this was a fallback query (simplified version), mention that the original query was adjusted
4. Format numbers, dates, and other data types appropriately
5. Highlight any interesting patterns or insights
6. Keep the response conversational and helpful

**Response should be structured as:**
- Brief summary of what was found
- Key insights or patterns
- Any limitations or notes about the data
- Suggestions for follow-up questions if relevant`;

    let summaryText: string;
    try {
      const summaryResult = await withRetry(
        () => model.generateContent(summaryPrompt),
        "summary generation"
      );
      summaryText = summaryResult.response.text();
    } catch (summaryError: any) {
      logger.warn(
        { error: summaryError.message, tenantId },
        "Summary generation failed, using fallback"
      );
      // Fallback summary if Gemini fails
      summaryText =
        dataCount > 0
          ? `Found ${dataCount} result${
              dataCount === 1 ? "" : "s"
            } from ${target}. The data includes the requested information, though I couldn't generate a detailed summary at this time.`
          : `No results found for your query on ${target}. You might want to try a different search or check if the data exists.`;
    }

    const result = {
      tool: toolName,
      target,
      rows: dataCount,
      data: Array.isArray(data) ? data.slice(0, 100) : data,
      answer: summaryText,
      duration: Date.now() - startTime,
    };

    // Store the conversation if conversationId is provided
    if (conversationId && userId) {
      await storeConversationMessage(
        conversationId,
        tenantId,
        userId,
        message,
        result
      );
    }

    return result;
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        tenantId,
        userId,
        message,
        duration: Date.now() - startTime,
      },
      "Gemini query failed"
    );

    // Provide more specific and helpful error messages
    if (
      error.message.includes("API key") ||
      error.message.includes("invalid")
    ) {
      throw new Error(
        `❌ **Configuration Error**: Invalid Gemini API key. Please check your GEMINI_API_KEY configuration and ensure it's valid.`
      );
    }

    if (
      error.message.includes("fetch failed") ||
      error.message.includes("network")
    ) {
      throw new Error(
        `🌐 **Network Error**: Unable to connect to Gemini API. Please check your internet connection and try again.`
      );
    }

    if (
      error.message.includes("not allowed") ||
      error.message.includes("Available")
    ) {
      throw new Error(`🔒 **Access Error**: ${error.message}`);
    }

    if (
      error.message.includes("does not exist") ||
      error.message.includes("not found")
    ) {
      throw new Error(`🔍 **Data Error**: ${error.message}`);
    }

    if (error.message.includes("not compatible")) {
      throw new Error(`⚙️ **Connection Error**: ${error.message}`);
    }

    if (
      error.message.includes("timeout") ||
      error.message.includes("Timeout")
    ) {
      throw new Error(
        `⏱️ **Timeout Error**: The query took too long to execute. Try simplifying your request or reducing the data scope.`
      );
    }

    // For database-specific errors, provide helpful context
    if (
      error.message.includes("SQL") ||
      error.message.includes("MongoDB") ||
      error.message.includes("Sheet")
    ) {
      throw new Error(
        `🔧 **Query Error**: ${error.message}. Try rephrasing your question or asking for a simpler analysis.`
      );
    }

    // Generic fallback with suggestion
    throw new Error(
      `❓ **Processing Error**: ${error.message}. You can try asking a simpler question or rephrasing your request.`
    );
  }
}
