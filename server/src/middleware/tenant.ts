// src/middleware/tenant.ts
import { PrismaClient } from "@prisma/client"
import { HttpError } from "../utils/errors"
const prisma = new PrismaClient()

export async function tenantContext(req:any,_res:any,next:any){
  try {
    const tenantId = req.user?.tenantId
    const membership = await prisma.userTenant.findFirst({
      where:{ tenantId, userId: req.user.id },
      include:{ Tenant:true }
    })
    if(!membership) throw new HttpError(403,"not a member of tenants")
    req.tenant = membership.Tenant
    req.role = membership.role
    next()
  } catch(e){ next(e) }
}
