// src/db/mongoRunner.ts
import type { MongoClient } from "mongodb"
import { SECURITY } from "../config/security"
import { badReq } from "../utils/errors"

export type MongoArgs = {
  db: string, collection: string,
  filter?: Record<string, any>,
  projection?: Record<string, number>,
  sort?: Record<string, number>,
  limit?: number
}

export async function getMongoSchema(client: MongoClient, dbName: string, collectionName: string): Promise<{ columns: string[], sampleData: any[] }> {
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  const sampleData = await collection.find().limit(3).toArray();

  // Infer schema from sample data
  const columns = new Set<string>();
  sampleData.forEach(doc => {
    Object.keys(doc).forEach(key => {
      if (key !== '_id') {
        columns.add(`${key} (type: ${typeof doc[key]})`);
      }
    });
  });

  return { columns: Array.from(columns), sampleData };
}

export async function runMongo(client: MongoClient, allowedCols: string[]|undefined, a: MongoArgs){
  const limit = Math.min(a.limit ?? SECURITY.defaultLimit, SECURITY.maxLimit)
  if(a.projection && Object.keys(a.projection).length){
    if(allowedCols && allowedCols.length){
      for(const k of Object.keys(a.projection)) if(!allowedCols.includes(k)) throw badReq("projection not allowed")
    }
  }
  const db = client.db(a.db)
  const coll = db.collection(a.collection)
  const cur = coll.find(a.filter ?? {}, { projection: a.projection }).limit(limit)
  if(a.sort) cur.sort(Object.entries(a.sort) as [string, 1 | -1][])
  const rows = await cur.toArray()
  return rows
}
