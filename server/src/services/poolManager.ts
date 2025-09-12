// src/services/poolManager.ts
import { PrismaClient } from "@prisma/client"

type ConnKind = "POSTGRES" | "MYSQL" | "MONGODB" | "EXCEL"
import { decryptConnection } from "./secretStore"
import { MongoClient } from "mongodb"
import { Pool as PgPool } from "pg"
import mysql from "mysql2/promise"

type Conn = { kind: ConnKind, key: string, client: any }

const prisma = new PrismaClient()
const cache = new Map<string, Conn>()

export async function getTenantConnection(tenantId:string, preferred?:ConnKind){
  const conn = await prisma.connection.findFirst({
    where: { tenantId, ...(preferred ? { kind: preferred } : {}) },
    orderBy: { createdAt: "asc" }
  })
  if(!conn) throw new Error("no connection configured")

  const key = `${conn.id}`
  if(cache.has(key)) return cache.get(key)!

  const { uri } = await decryptConnection(conn.encUri, conn.encMeta)

  let client:any
  if(conn.kind==="POSTGRES"){
    client = new PgPool({ connectionString: uri, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 })
  } else if(conn.kind==="MYSQL"){
    client = mysql.createPool({ uri, connectionLimit: 5, connectTimeout: 5_000, waitForConnections: true })
  } else if(conn.kind==="MONGODB"){
    const c = new MongoClient(uri, { maxPoolSize: 5 })
    await c.connect()
    client = c
  } else if(conn.kind==="EXCEL"){
    client = { path: uri } // "uri" can be a signed URL or storage path
  } else {
    throw new Error(`unsupported connection kind: ${conn.kind}`)
  }

  const wrapper = { kind: conn.kind, key, client }
  cache.set(key, wrapper)
  return wrapper
}
