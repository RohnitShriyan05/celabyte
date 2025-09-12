// src/db/sqlRunner.ts
import { Pool as PgPool } from "pg"
import type { Pool as MyPool } from "mysql2/promise"
import { SECURITY } from "../config/security"
import { badReq } from "../utils/errors"

export type SqlArgs = {
  dialect: "postgres"|"mysql",
  table: string, columns?: string[],
  where?: Record<string, any>,
  orderBy?: string, limit?: number
}

export async function runSQL(client: PgPool|MyPool, allowCols: string[]|undefined, args: SqlArgs){
  const cols = (args.columns && args.columns.length ? args.columns : ["*"])
  if(allowCols && allowCols.length){
    for(const c of cols) if(c!=="*" && !allowCols.includes(c)) throw badReq("column not allowed")
  }
  const limit = Math.min(args.limit ?? SECURITY.defaultLimit, SECURITY.maxLimit)

  const whereKeys = Object.keys(args.where ?? {})
  const ob = args.orderBy ? sanitizeIdent(args.orderBy, allowCols) : ""

  if("query" in client && typeof client.query === 'function'){ // mysql2
    const table = sanitizeIdent(args.table, allowCols)
    const conds = whereKeys.map(k=> `${sanitizeIdent(k, allowCols)} = ?`).join(" AND ") || "1=1"
    const sql = `SELECT ${cols.map(c=> c==="*"?"*":sanitizeIdent(c, allowCols)).join(",")}
                 FROM ${table}
                 WHERE ${conds} ${ob ? `ORDER BY ${ob}` : ""} LIMIT ?`
    const [rows] = await (client as MyPool).query(sql, [...whereKeys.map(k=>args.where![k]), limit])
    return rows as any[]
  } else { // pg
    const table = sanitizeIdent(args.table, allowCols, true)
    const params = whereKeys.map(k=> args.where![k])
    const conds = whereKeys.map((k,i)=> `${sanitizeIdent(k, allowCols, true)} = $${i+1}`).join(" AND ") || "1=1"
    const sql = `SELECT ${cols.map(c=> c==="*"?"*":sanitizeIdent(c, allowCols, true)).join(",")}
                 FROM ${table}
                 WHERE ${conds} ${ob ? `ORDER BY ${ob}` : ""} LIMIT $${params.length+1}`
    const res = await (client as PgPool).query({ text: sql, values: [...params, limit] })
    return res.rows as any[]
  }
}

export async function getSqlSchema(client: PgPool | MyPool, table: string): Promise<{ columns: string[], sampleData: any[] }> {
  let columns: string[] = [];
  let sampleData: any[] = [];

  if ("query" in client && typeof client.query === 'function') { // mysql2
    const [colsResult]: any = await (client as MyPool).query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()
    `, [table]);
    columns = colsResult.map((c: any) => `${c.COLUMN_NAME} (${c.DATA_TYPE})`);

    const [rows] = await (client as MyPool).query(`SELECT * FROM ${sanitizeIdent(table)} LIMIT 3`);
    sampleData = rows as any[];
  } else { // pg
    const res = await (client as PgPool).query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [table]);
    columns = res.rows.map(r => `${r.column_name} (${r.data_type})`);

    const sres = await (client as PgPool).query(`SELECT * FROM ${sanitizeIdent(table, undefined, true)} LIMIT 3`);
    sampleData = sres.rows;
  }

  return { columns, sampleData };
}

function sanitizeIdent(name:string, allowCols?:string[], quotePg=false){
  if(name.includes(";")||name.includes("--")||name.includes("/*")) throw badReq("invalid identifier")
  if(allowCols && allowCols.length && name!=="*" && !allowCols.includes(name) && !name.includes(".")) {
    // when sanitizing orderBy or table without explicit allow, we only accept simple word chars
  }
  if(!/^[a-zA-Z0-9_.]+$/.test(name)) throw badReq("invalid identifier")
  return quotePg ? name.split(".").map(p=> `"${p}"`).join(".") : name
}
