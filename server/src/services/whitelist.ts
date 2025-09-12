// src/services/whitelist.ts
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function getAllowedTables(tenantId:string){
  const list = await prisma.allowedTable.findMany({ where:{ tenantId } })
  // Map name => allowedCols (empty means all)
  const map = new Map<string,string[]>()
  for(const r of list){
    const raw = (r as any).allowedCols
    let cols: string[] = []
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw)
        cols = Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string") : []
      } catch {
        cols = []
      }
    } else if (Array.isArray(raw)) {
      cols = raw.filter((c) => typeof c === "string")
    } else {
      cols = []
    }
    map.set(r.name, cols)
  }
  return map
}
