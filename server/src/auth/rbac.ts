// src/auth/rbac.ts
import { HttpError } from "../utils/errors"
export function requireRole(min:"VIEWER"|"ANALYST"|"ADMIN"|"OWNER"){
  const rank = { VIEWER:0, ANALYST:1, ADMIN:2, OWNER:3 }
  return (req:any,_res:any,next:any)=>{
    const r: keyof typeof rank = req.role || req.user?.role || "VIEWER"
    if(rank[r] < rank[min]) return next(new HttpError(403,"insufficient role"))
    next()
  }
}
