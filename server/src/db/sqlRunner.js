"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSQL = runSQL;
exports.getSqlSchema = getSqlSchema;
const security_1 = require("../config/security");
const errors_1 = require("../utils/errors");
async function runSQL(client, allowCols, args) {
    const cols = (args.columns && args.columns.length ? args.columns : ["*"]);
    if (allowCols && allowCols.length) {
        for (const c of cols)
            if (c !== "*" && !allowCols.includes(c))
                throw (0, errors_1.badReq)("column not allowed");
    }
    const limit = Math.min(args.limit ?? security_1.SECURITY.defaultLimit, security_1.SECURITY.maxLimit);
    const whereKeys = Object.keys(args.where ?? {});
    const ob = args.orderBy ? sanitizeIdent(args.orderBy, allowCols) : "";
    if ("query" in client && typeof client.query === 'function') { // mysql2
        const table = sanitizeIdent(args.table, allowCols);
        const conds = whereKeys.map(k => `${sanitizeIdent(k, allowCols)} = ?`).join(" AND ") || "1=1";
        const sql = `SELECT ${cols.map(c => c === "*" ? "*" : sanitizeIdent(c, allowCols)).join(",")}
                 FROM ${table}
                 WHERE ${conds} ${ob ? `ORDER BY ${ob}` : ""} LIMIT ?`;
        const [rows] = await client.query(sql, [...whereKeys.map(k => args.where[k]), limit]);
        return rows;
    }
    else { // pg
        const table = sanitizeIdent(args.table, allowCols, true);
        const params = whereKeys.map(k => args.where[k]);
        const conds = whereKeys.map((k, i) => `${sanitizeIdent(k, allowCols, true)} = $${i + 1}`).join(" AND ") || "1=1";
        const sql = `SELECT ${cols.map(c => c === "*" ? "*" : sanitizeIdent(c, allowCols, true)).join(",")}
                 FROM ${table}
                 WHERE ${conds} ${ob ? `ORDER BY ${ob}` : ""} LIMIT $${params.length + 1}`;
        const res = await client.query({ text: sql, values: [...params, limit] });
        return res.rows;
    }
}
async function getSqlSchema(client, table) {
    let columns = [];
    let sampleData = [];
    if ("query" in client && typeof client.query === 'function') { // mysql2
        const [colsResult] = await client.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()
    `, [table]);
        columns = colsResult.map((c) => `${c.COLUMN_NAME} (${c.DATA_TYPE})`);
        const [rows] = await client.query(`SELECT * FROM ${sanitizeIdent(table)} LIMIT 3`);
        sampleData = rows;
    }
    else { // pg
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [table]);
        columns = res.rows.map(r => `${r.column_name} (${r.data_type})`);
        const sres = await client.query(`SELECT * FROM ${sanitizeIdent(table, undefined, true)} LIMIT 3`);
        sampleData = sres.rows;
    }
    return { columns, sampleData };
}
function sanitizeIdent(name, allowCols, quotePg = false) {
    if (name.includes(";") || name.includes("--") || name.includes("/*"))
        throw (0, errors_1.badReq)("invalid identifier");
    if (allowCols && allowCols.length && name !== "*" && !allowCols.includes(name) && !name.includes(".")) {
        // when sanitizing orderBy or table without explicit allow, we only accept simple word chars
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(name))
        throw (0, errors_1.badReq)("invalid identifier");
    return quotePg ? name.split(".").map(p => `"${p}"`).join(".") : name;
}
