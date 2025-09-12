"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoSchema = getMongoSchema;
exports.runMongo = runMongo;
const security_1 = require("../config/security");
const errors_1 = require("../utils/errors");
async function getMongoSchema(client, dbName, collectionName) {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const sampleData = await collection.find().limit(3).toArray();
    // Infer schema from sample data
    const columns = new Set();
    sampleData.forEach(doc => {
        Object.keys(doc).forEach(key => {
            if (key !== '_id') {
                columns.add(`${key} (type: ${typeof doc[key]})`);
            }
        });
    });
    return { columns: Array.from(columns), sampleData };
}
async function runMongo(client, allowedCols, a) {
    const limit = Math.min(a.limit ?? security_1.SECURITY.defaultLimit, security_1.SECURITY.maxLimit);
    if (a.projection && Object.keys(a.projection).length) {
        if (allowedCols && allowedCols.length) {
            for (const k of Object.keys(a.projection))
                if (!allowedCols.includes(k))
                    throw (0, errors_1.badReq)("projection not allowed");
        }
    }
    const db = client.db(a.db);
    const coll = db.collection(a.collection);
    const cur = coll.find(a.filter ?? {}, { projection: a.projection }).limit(limit);
    if (a.sort)
        cur.sort(Object.entries(a.sort));
    const rows = await cur.toArray();
    return rows;
}
