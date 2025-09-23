// src/db/sqlRunner.ts
import { Pool as PgPool } from "pg";
import type { Pool as MyPool } from "mysql2/promise";
import { SECURITY } from "../config/security";
import { badReq } from "../utils/errors";
import { schemaCache, queryCache } from "../utils/cache";

export type SqlArgs = {
  dialect: "postgres" | "mysql";
  table: string;
  columns?: string[];
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
};

export async function runSQL(
  client: PgPool | MyPool,
  allowCols: string[] | undefined,
  args: SqlArgs
) {
  const startTime = Date.now();

  // Create cache key from query parameters
  const cacheKey = `sql_${JSON.stringify(args)}_${allowCols?.join(",")}`;
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Pre-validate and optimize columns
    const cols = args.columns && args.columns.length ? args.columns : ["*"];
    if (allowCols && allowCols.length) {
      // Use Set for O(1) lookup instead of O(n) includes
      const allowedSet = new Set(allowCols);
      for (const c of cols) {
        if (c !== "*" && !allowedSet.has(c)) {
          throw badReq(
            `Column '${c}' not allowed. Available columns: ${allowCols.join(
              ", "
            )}`
          );
        }
      }
    }

    // Optimize limit - use smaller default for faster queries
    const limit = Math.min(
      args.limit ?? Math.min(SECURITY.defaultLimit, 50), // Reduced default limit
      SECURITY.maxLimit
    );

    const whereKeys = Object.keys(args.where ?? {});
    const ob = args.orderBy ? sanitizeIdent(args.orderBy, allowCols) : "";

    if ("query" in client && typeof client.query === "function") {
      // mysql2
      const table = sanitizeIdent(args.table, allowCols);
      const conds =
        whereKeys
          .map((k) => `${sanitizeIdent(k, allowCols)} = ?`)
          .join(" AND ") || "1=1";
      const sql = `SELECT ${cols
        .map((c) => (c === "*" ? "*" : sanitizeIdent(c, allowCols)))
        .join(",")}
                   FROM ${table}
                   WHERE ${conds} ${ob ? `ORDER BY ${ob}` : ""} LIMIT ?`;

      try {
        const [rows] = await (client as MyPool).query(sql, [
          ...whereKeys.map((k) => args.where![k]),
          limit,
        ]);

        const result = rows as any[];
        // Cache successful results for fast retrieval
        if (result && result.length < 100) {
          // Only cache smaller results
          queryCache.set(cacheKey, result, 60 * 1000); // 1 minute cache
        }
        return result;
      } catch (mysqlError: any) {
        if (mysqlError.code === "ER_NO_SUCH_TABLE") {
          throw new Error(
            `Table '${args.table}' does not exist in the database`
          );
        } else if (mysqlError.code === "ER_BAD_FIELD_ERROR") {
          throw new Error(
            `One or more columns do not exist in table '${args.table}'. Please check column names.`
          );
        } else if (mysqlError.code === "ER_ACCESS_DENIED_ERROR") {
          throw new Error(
            `Access denied to table '${args.table}'. Check your database permissions.`
          );
        }
        throw new Error(`MySQL query error: ${mysqlError.message}`);
      }
    } else {
      // pg
      const table = sanitizeIdent(args.table, allowCols, true);
      const params = whereKeys.map((k) => args.where![k]);
      const conds =
        whereKeys
          .map((k, i) => `${sanitizeIdent(k, allowCols, true)} = $${i + 1}`)
          .join(" AND ") || "1=1";
      const sql = `SELECT ${cols
        .map((c) => (c === "*" ? "*" : sanitizeIdent(c, allowCols, true)))
        .join(",")}
                   FROM ${table}
                   WHERE ${conds} ${ob ? `ORDER BY ${ob}` : ""} LIMIT $${
        params.length + 1
      }`;

      try {
        const res = await (client as PgPool).query({
          text: sql,
          values: [...params, limit],
        });

        const result = res.rows as any[];
        // Cache successful results for fast retrieval
        if (result && result.length < 100) {
          // Only cache smaller results
          queryCache.set(cacheKey, result, 60 * 1000); // 1 minute cache
        }
        return result;
      } catch (pgError: any) {
        if (pgError.code === "42P01") {
          throw new Error(
            `Table '${args.table}' does not exist in the database`
          );
        } else if (pgError.code === "42703") {
          throw new Error(
            `One or more columns do not exist in table '${args.table}'. Please check column names.`
          );
        } else if (pgError.code === "42501") {
          throw new Error(
            `Access denied to table '${args.table}'. Check your database permissions.`
          );
        } else if (pgError.code === "08003") {
          throw new Error(`Database connection is closed. Please try again.`);
        }
        throw new Error(`PostgreSQL query error: ${pgError.message}`);
      }
    }
  } catch (error: any) {
    if (
      error.message.includes("Column") &&
      error.message.includes("not allowed")
    ) {
      throw error; // Re-throw our custom column permission errors
    }
    throw new Error(`SQL execution failed: ${error.message}`);
  }
}

export async function getSqlSchema(
  client: PgPool | MyPool,
  table: string
): Promise<{ columns: string[]; sampleData: any[] }> {
  // Check cache first
  const cacheKey = `sql_${table}_${typeof client}`;
  const cached = schemaCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let columns: string[] = [];
  let sampleData: any[] = [];

  try {
    if ("query" in client && typeof client.query === "function") {
      // mysql2 - Optimized query with only essential columns
      try {
        const [colsResult]: any = await (client as MyPool).query(
          `
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()
          ORDER BY ORDINAL_POSITION
          LIMIT 50
        `,
          [table]
        );

        if (colsResult.length === 0) {
          throw new Error(
            `Table '${table}' not found or has no accessible columns`
          );
        }

        columns = colsResult.map(
          (c: any) =>
            `${c.COLUMN_NAME} (${c.DATA_TYPE}${
              c.IS_NULLABLE === "YES" ? ", nullable" : ""
            })`
        );

        // Fetch sample data with reduced limit and timeout
        try {
          const [rows] = (await Promise.race([
            (client as MyPool).query(
              `SELECT * FROM ${sanitizeIdent(table)} LIMIT 2`
            ),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 2000)
            ),
          ])) as any;
          sampleData = rows as any[];
        } catch (sampleError: any) {
          // Skip sample data if it's slow or fails
          sampleData = [];
        }
      } catch (mysqlError: any) {
        if (mysqlError.code === "ER_NO_SUCH_TABLE") {
          throw new Error(`Table '${table}' does not exist in the database`);
        }
        throw new Error(`MySQL schema error: ${mysqlError.message}`);
      }
    } else {
      // pg - Optimized query with only essential columns
      try {
        const res = await (client as PgPool).query(
          `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
          LIMIT 50
        `,
          [table]
        );

        if (res.rows.length === 0) {
          throw new Error(
            `Table '${table}' not found or has no accessible columns`
          );
        }

        columns = res.rows.map(
          (r) =>
            `${r.column_name} (${r.data_type}${
              r.is_nullable === "YES" ? ", nullable" : ""
            })`
        );

        // Fetch sample data with timeout and reduced limit
        try {
          const sres = (await Promise.race([
            (client as PgPool).query(
              `SELECT * FROM ${sanitizeIdent(table, undefined, true)} LIMIT 2`
            ),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 2000)
            ),
          ])) as any;
          sampleData = sres.rows;
        } catch (sampleError: any) {
          // Skip sample data if it's slow or fails
          sampleData = [];
        }
      } catch (pgError: any) {
        if (pgError.code === "42P01") {
          throw new Error(`Table '${table}' does not exist in the database`);
        } else if (pgError.code === "42501") {
          throw new Error(
            `Access denied to table '${table}'. Check your database permissions.`
          );
        }
        throw new Error(`PostgreSQL schema error: ${pgError.message}`);
      }
    }
  } catch (error: any) {
    console.error(`Schema fetch error for table ${table}:`, error.message);
    // Return empty schema instead of throwing to allow system to continue
    return { columns: [], sampleData: [] };
  }

  const result = { columns, sampleData };
  // Cache the result for future use
  schemaCache.set(cacheKey, result);

  return result;
}

function sanitizeIdent(name: string, allowCols?: string[], quotePg = false) {
  if (name.includes(";") || name.includes("--") || name.includes("/*"))
    throw badReq("invalid identifier");
  if (
    allowCols &&
    allowCols.length &&
    name !== "*" &&
    !allowCols.includes(name) &&
    !name.includes(".")
  ) {
    // when sanitizing orderBy or table without explicit allow, we only accept simple word chars
  }
  if (!/^[a-zA-Z0-9_.]+$/.test(name)) throw badReq("invalid identifier");
  return quotePg
    ? name
        .split(".")
        .map((p) => `"${p}"`)
        .join(".")
    : name;
}
