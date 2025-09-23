// src/db/mongoRunner.ts
import type { MongoClient } from "mongodb";
import { SECURITY } from "../config/security";
import { badReq } from "../utils/errors";

export type MongoArgs = {
  db: string;
  collection: string;
  filter?: Record<string, any>;
  projection?: Record<string, number>;
  sort?: Record<string, number>;
  limit?: number;
};

import { schemaCache } from "../utils/cache";

export async function getMongoSchema(
  client: MongoClient,
  dbName: string,
  collectionName: string
): Promise<{ columns: string[]; sampleData: any[] }> {
  // Check cache first
  const cacheKey = `mongo_${dbName}.${collectionName}`;
  const cached = schemaCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Optimized existence check - skip expensive listCollections
    let docCount: number;
    try {
      docCount = await Promise.race([
        collection.countDocuments({}, { limit: 1 }),
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        ),
      ]);

      if (docCount === 0) {
        console.warn(`Collection '${collectionName}' is empty`);
        return { columns: [], sampleData: [] };
      }
    } catch (error) {
      // If count fails, try to get one document to check existence
      const hasDoc = await collection.findOne({});
      if (!hasDoc) {
        throw new Error(
          `Collection '${collectionName}' does not exist in database '${dbName}'`
        );
      }
    }

    // Get sample data with timeout - only 2 documents for speed
    const sampleData = await Promise.race([
      collection.find().limit(2).toArray(),
      new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 2000)
      ),
    ]);

    // Infer schema from sample data with better type detection
    const columns = new Set<string>();
    const fieldTypes = new Map<string, Set<string>>();

    sampleData.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        if (key !== "_id") {
          const value = doc[key];
          const type = Array.isArray(value) ? "array" : typeof value;

          if (!fieldTypes.has(key)) {
            fieldTypes.set(key, new Set());
          }
          fieldTypes.get(key)!.add(type);
        }
      });
    });

    // Create column descriptions with all observed types
    fieldTypes.forEach((types, key) => {
      const typeList = Array.from(types).join("|");
      columns.add(`${key} (${typeList})`);
    });

    const result = { columns: Array.from(columns), sampleData };

    // Cache the result
    schemaCache.set(cacheKey, result);

    return result;
  } catch (error: any) {
    console.error(
      `MongoDB schema fetch error for ${dbName}.${collectionName}:`,
      error.message
    );

    if (error.message.includes("not authorized")) {
      throw new Error(
        `Access denied to collection '${collectionName}' in database '${dbName}'. Check your database permissions.`
      );
    } else if (error.message.includes("does not exist")) {
      throw error; // Re-throw our custom collection not found error
    }

    // Return empty schema for other errors to allow system to continue
    return { columns: [], sampleData: [] };
  }
}

export async function runMongo(
  client: MongoClient,
  allowedCols: string[] | undefined,
  a: MongoArgs
) {
  try {
    // Optimize limit - use smaller default for faster queries
    const limit = Math.min(
      a.limit ?? Math.min(SECURITY.defaultLimit, 50),
      SECURITY.maxLimit
    );

    // Pre-validate projection fields with Set for O(1) lookup
    if (a.projection && Object.keys(a.projection).length) {
      if (allowedCols && allowedCols.length) {
        const allowedSet = new Set(allowedCols);
        for (const k of Object.keys(a.projection)) {
          if (!allowedSet.has(k)) {
            throw badReq(
              `Field '${k}' not allowed. Available fields: ${allowedCols.join(
                ", "
              )}`
            );
          }
        }
      }
    }

    const db = client.db(a.db);

    // Skip expensive database existence check - let the query fail if DB doesn't exist
    // This saves ~100-200ms per query

    const coll = db.collection(a.collection);

    // Skip expensive collection existence check - let the query fail if collection doesn't exist
    // This saves ~50-100ms per query

    const cur = coll
      .find(a.filter ?? {}, { projection: a.projection })
      .limit(limit);
    if (a.sort) {
      try {
        cur.sort(Object.entries(a.sort) as [string, 1 | -1][]);
      } catch (sortError: any) {
        console.warn(
          `Sort operation failed: ${sortError.message}. Continuing without sort.`
        );
      }
    }

    const rows = await cur.toArray();
    return rows;
  } catch (error: any) {
    if (
      error.message.includes("Field") &&
      error.message.includes("not allowed")
    ) {
      throw error; // Re-throw our custom field permission errors
    } else if (error.message.includes("not authorized")) {
      throw new Error(
        `Access denied to MongoDB resource. Check your database permissions.`
      );
    } else if (error.message.includes("does not exist")) {
      throw error; // Re-throw our custom collection/database not found errors
    }
    throw new Error(`MongoDB query execution failed: ${error.message}`);
  }
}
