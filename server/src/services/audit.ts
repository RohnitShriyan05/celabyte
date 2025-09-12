// src/services/audit.ts
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
export async function auditLog(input:{
  tenantId:string, userId?:string,
  tool:string, target?:string, params:any,
  rowCount?:number, durationMs:number, ok:boolean, error?:string
}){
  await prisma.queryLog.create({ data:{
    tenantId: input.tenantId,
    userId: input.userId,
    tool: input.tool,
    target: input.target,
    params: input.params,
    rowCount: input.rowCount ?? null,
    durationMs: input.durationMs,
    ok: input.ok,
    error: input.error ?? null
  }})
}
