import { GoogleGenerativeAI, GoogleGenerativeAIError } from "@google/generative-ai";
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

**Core Task: Analyze the user's query and available data schema, then take one of the following actions:**

1.  **Generate a Structured Query:** If the user's request can be answered with data, formulate a JSON query for one of the available tools (sql, mongo, sheet).
    - **Analyze Schema:** Pay close attention to the provided table/sheet schema, including column names and sample data. Use the EXACT column names.
    - **Infer Data Formats:** Look at the sample data to understand date formats, number formats, and data types. Don't ask for clarification if the format is clear from the samples.
    - **Safety First:** Always prefer small limits (e.g., 100 rows) and simple filters unless the user specifies otherwise.
    - **Tool Format:**
        - **SQL:** \`{"action": "sql", "query": "SELECT ..."}\`
        - **MongoDB:** \`{"action": "mongo", "collection": "...", "filter": {...}}\`
        - **Sheets:** \`{"action": "sheet", "sheet": "...", "filter": {...}, "select": [...]}\`

2.  **Ask for Clarification ONLY when truly necessary:** Only ask questions when the query is genuinely ambiguous and cannot be resolved by examining the sample data.

3.  **Answer Directly:** If the user asks a general question or something that doesn't require a data query, provide a helpful, conversational response.

4.  **Handle Fallbacks Gracefully:** If you cannot fulfill a request, explain why and suggest what you *can* do.

**Data Analysis Guidelines:**
- **Date Formats:** Examine sample date values to determine the format (MM/DD/YYYY, DD/MM/YYYY, timestamps, etc.)
- **Numeric Data:** Look at sample numbers to understand if they represent currency, percentages, counts, etc.
- **Text Data:** Analyze sample text to understand categories, formats, and patterns
- **Make Reasonable Assumptions:** When data formats are standard or obvious from samples, proceed with confidence

**Conversation History:**
- Previous user messages and your responses will be provided. Use them to understand the context of the current question.
- Refer to previous results if the user asks a follow-up question (e.g., "now show that by region").`;
// Validate API key on startup
if (!env.geminiKey || env.geminiKey.length < 20) {
  logger.warn("Invalid or missing GEMINI_API_KEY. Please set a valid API key from Google AI Studio.");
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
        if (error.message.includes('API key') || error.message.includes('invalid')) {
          throw new Error(`Invalid Gemini API key. Please check your GEMINI_API_KEY in .env file.`);
        }
      }
      
      if (attempt <= retries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
          RETRY_CONFIG.maxDelay
        );
        
        logger.warn({
          attempt,
          maxRetries: retries,
          delay,
          error: error.message,
          context
        }, `Retrying ${context} after error`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
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
  
  for (const [name, _] of wl.entries()) {
    try {
      if (conn.kind === 'POSTGRES' || conn.kind === 'MYSQL') {
        const { columns, sampleData } = await getSqlSchema(conn.client, name);
        context += `\n**Table: ${name}**\n- Columns: ${columns.join(', ')}\n- Sample Data:\n${JSON.stringify(sampleData, null, 2)}\n`;
      } else if (conn.kind === 'MONGODB') {
        const [db, collection] = name.split('.');
        if (db && collection) {
          const { columns, sampleData } = await getMongoSchema(conn.client, db, collection);
          context += `\n**Collection: ${name}**\n- Fields: ${columns.join(', ')}\n- Sample Data:\n${JSON.stringify(sampleData, null, 2)}\n`;
        }
      } else if (conn.kind === 'EXCEL') {
        const sheetName = name.includes('!') ? name.split('!')[1] : name;
        const { columns, sampleData } = await getSheetSchema(conn.client, sheetName);
        context += `\n**Sheet: ${name}**\n- Columns: ${columns.join(', ')}\n- Sample Data:\n${JSON.stringify(sampleData, null, 2)}\n`;
      }
    } catch (error: any) {
      logger.warn({ error: error.message, tenantId, resource: name }, "Failed to fetch schema for context");
    }
  }
  
  return context;
}

async function getConversationHistory(conversationId: string): Promise<string> {
  if (!conversationId) return "";
  
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 10 // Last 10 messages for context
  });
  
  if (messages.length === 0) return "";
  
  let history = "\n\n**Conversation History:**\n";
  for (const msg of messages) {
    const role = msg.role === 'USER' ? 'User' : 'Assistant';
    history += `${role}: ${msg.content}\n`;
    
    // Include query results in context if available
    if (msg.metadata && typeof msg.metadata === 'object' && 'data' in msg.metadata) {
      const metadata = msg.metadata as any;
      if (metadata.data && Array.isArray(metadata.data) && metadata.data.length > 0) {
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
        role: 'USER',
        content: userMessage,
      }
    });

    // Store assistant response
    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: result.answer,
        metadata: {
          tool: result.tool,
          target: result.target,
          rows: result.rows,
          data: result.data,
          duration: result.duration,
        }
      }
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

  } catch (error: any) {
    logger.error({ error: error.message, conversationId, tenantId, userId }, "Failed to store conversation message");
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
    const conversationHistory = conversationId ? await getConversationHistory(conversationId) : "";

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      }
    });

    // Step 1: First pass to identify relevant tables/collections/sheets
    const sourceNames = Array.from(wl.keys());
    const initialPrompt = `Given the user query, identify which of the following data sources are relevant. Respond with a JSON array of source names. 

User Query: "${message}"

Available Sources: ${sourceNames.join(', ')}

Response format: ["source1", "source2", ...]`;

    const sourceSelectionResult = await withRetry(
      () => model.generateContent(initialPrompt),
      'source selection'
    );
    
    const relevantSourcesText = sourceSelectionResult.response.text();
    let relevantSources: string[] = [];
    try {
      const jsonMatch = relevantSourcesText.match(/\s*(\[.*\])/s);
      if (jsonMatch) {
        relevantSources = JSON.parse(jsonMatch[1]);
      }
    } catch (e) {
      logger.warn({ error: e, text: relevantSourcesText }, "Failed to parse relevant sources");
      // Fallback to all sources if parsing fails
      relevantSources = sourceNames;
    }

    // Step 2: Build detailed context for relevant sources only
    const relevantWl = new Map(relevantSources.map(s => [s, wl.get(s)!]));
    let connectionContext = `
Available connection type: ${conn.kind}
${conn.kind === 'EXCEL' ? 'This is a Google Sheets/Excel connection - use "sheet" action only.' : ''}
${conn.kind === 'POSTGRES' || conn.kind === 'MYSQL' ? 'This is a SQL database - use "sql" action.' : ''}
${conn.kind === 'MONGODB' ? 'This is a MongoDB database - use "mongo" action.' : ''}`;

    const schemaContext = await getSchemaContext(tenantId, conn, relevantWl);
    connectionContext += schemaContext;

    logger.info({ connectionContext }, "Context sent to Gemini");

    const analysisResult = await withRetry(
      () => model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: connectionContext },
        { text: conversationHistory },
        { text: `User query: ${message}` }
      ]),
      'initial query analysis'
    );

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

    // Execute the structured query
    
    let data: any, target: string | undefined, toolName: string;

    if (structuredQuery.action === "sql") {
      toolName = "runSQL";
      const args = {
        dialect: structuredQuery.dialect,
        table: structuredQuery.table,
        columns: structuredQuery.columns || ["*"],
        where: structuredQuery.where || {},
        orderBy: structuredQuery.orderBy,
        limit: Math.min(structuredQuery.limit || 100, 1000)
      };
      
      const validatedArgs = sqlSchema.parse(args);
      target = validatedArgs.table;
      const allowedCols = wl.get(validatedArgs.table);
      
      if (!allowedCols && !wl.has(validatedArgs.table)) {
        throw new Error(`Table '${validatedArgs.table}' is not allowed for this tenant`);
      }
      
      if (conn.kind !== "POSTGRES" && conn.kind !== "MYSQL") {
        throw new Error("Tenant connection is not SQL compatible");
      }
      
      data = await runSQL(conn.client, allowedCols, validatedArgs);
      
    } else if (structuredQuery.action === "mongo") {
      toolName = "runMongo";
      const args = {
        db: structuredQuery.db,
        collection: structuredQuery.collection,
        filter: structuredQuery.filter || {},
        projection: structuredQuery.projection,
        sort: structuredQuery.sort,
        limit: Math.min(structuredQuery.limit || 100, 1000)
      };
      
      const validatedArgs = mongoSchema.parse(args);
      target = `${validatedArgs.db}.${validatedArgs.collection}`;
      const allowedCols = wl.get(target);
      
      if (!allowedCols && !wl.has(target)) {
        throw new Error(`Collection '${target}' is not allowed for this tenant`);
      }
      
      if (conn.kind !== "MONGODB") {
        throw new Error("Tenant connection is not MongoDB compatible");
      }
      
      data = await runMongo(conn.client, allowedCols, validatedArgs);
      
    } else if (structuredQuery.action === "sheet") {
      toolName = "runSheet";
      
      // Get connection details from database to extract URL
      const connDetails = await prisma.connection.findFirst({
        where: { tenantId }
      });
      
      if (!connDetails) {
        throw new Error("Connection details not found");
      }
      
      // Extract spreadsheet ID from Google Sheets URL
      const sheetsUrl = connDetails.encUri;
      let spreadsheetId = '';
      let sheetName = structuredQuery.sheet || 'Sheet1';
      
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
      if (gidMatch && !structuredQuery.sheet) {
        sheetName = `gid_${gidMatch[1]}`;
      }
      
      const args = {
        path: spreadsheetId,
        sheet: sheetName,
        filter: structuredQuery.filter || {},
        select: structuredQuery.select || [],
        limit: Math.min(structuredQuery.limit || 100, 1000)
      };
      
      const validatedArgs = sheetSchema.parse(args);
      target = `${validatedArgs.path}!${validatedArgs.sheet}`;
      let allowedCols = wl.get(target);
      
      if (!allowedCols && !wl.has(target)) {
        // Auto-whitelist the sheet if it's not in the whitelist
        try {
          logger.info({ tenantId, target }, "Auto-whitelisting sheet on first access");
          // Get the connection ID from the database since conn.key is not the same as connection ID
          const dbConn = await prisma.connection.findFirst({
            where: { tenantId, kind: 'EXCEL' }
          });
          if (dbConn) {
            await sheetDiscoveryService.addSheetToWhitelist(tenantId, dbConn.id, target);
          }
          allowedCols = []; // Empty array means all columns allowed
        } catch (autoWhitelistError: any) {
          logger.error({ 
            tenantId, 
            target, 
            error: autoWhitelistError.message 
          }, "Failed to auto-whitelist sheet");
          throw new Error(`Sheet '${target}' is not allowed for this tenant`);
        }
      }
      
      if (conn.kind !== "EXCEL") {
        throw new Error("Tenant connection is not Excel compatible");
      }
      
      data = await runSheet(conn.client, allowedCols, validatedArgs);
      
    } else {
      throw new Error(`Unknown action: ${structuredQuery.action}`);
    }

    // Generate final response with data context
    const summaryPrompt = `Summarize the query results briefly. Show key insights and format the data nicely.
Original query: ${message}
Data returned: ${JSON.stringify(Array.isArray(data) ? data.slice(0, 5) : data)}
Row count: ${Array.isArray(data) ? data.length : 1}`;

    const summaryResult = await withRetry(
      () => model.generateContent(summaryPrompt),
      'summary generation'
    );

    const result = {
      tool: toolName,
      target,
      rows: Array.isArray(data) ? data.length : undefined,
      data: Array.isArray(data) ? data.slice(0, 100) : data,
      answer: summaryResult.response.text(),
      duration: Date.now() - startTime,
    };

    // Store the conversation if conversationId is provided
    if (conversationId && userId) {
      await storeConversationMessage(conversationId, tenantId, userId, message, result);
    }

    return result;

  } catch (error: any) {
    logger.error({ 
      error: error.message, 
      stack: error.stack,
      tenantId, 
      userId,
      duration: Date.now() - startTime
    }, "Gemini query failed");
    
    // Provide more specific error messages
    if (error.message.includes('API key')) {
      throw new Error(`[GoogleGenerativeAI Error]: Invalid API key. Please check your GEMINI_API_KEY configuration.`);
    }
    
    if (error.message.includes('fetch failed')) {
      throw new Error(`[GoogleGenerativeAI Error]: Network error - unable to connect to Gemini API. Please check your internet connection and try again.`);
    }
    
    throw new Error(`[GoogleGenerativeAI Error]: ${error.message}`);
  }
}
