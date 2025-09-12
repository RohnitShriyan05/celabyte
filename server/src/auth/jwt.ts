// src/auth/jwt.ts
import { createRemoteJWKSet, jwtVerify } from "jose"
import { env } from "../config/env"
import { HttpError } from "../utils/errors"

const jwks = env.jwt.jwksUrl ? createRemoteJWKSet(new URL(env.jwt.jwksUrl)) : null

export async function authMiddleware(req:any, _res:any, next:any){
  const h = req.headers.authorization || ""
  const token = h.startsWith("Bearer ") ? h.slice(7) : null
  
  // Development bypass - if no token provided or dev-token, create a default user
  if(!token || token === 'dev-token') {
    if (process.env.NODE_ENV === 'development' || !env.jwt.hs256Secret) {
      req.user = {
        id: "dev-user-1",
        email: "dev@example.com",
        tenantId: "dev-tenant-1",
        role: "ADMIN"
      }
      return next()
    }
    return next(new HttpError(401,"missing token"))
  }

  try {
    let payload:any
    if(jwks){
      const { payload: p } = await jwtVerify(token, jwks, { issuer: env.jwt.issuer, audience: env.jwt.audience })
      payload = p
    } else {
      // HS256 fallback for dev
      const { payload: p } = await (await import("jose")).jwtVerify(token, new TextEncoder().encode(env.jwt.hs256Secret))
      payload = p
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      // expected custom claims:
      tenantId: payload["org_id"] || payload["tenant_id"] || payload["tenantId"],
      role: payload["role"] || "VIEWER"
    }
    if(!req.user.tenantId) throw new Error("no tenant")
    next()
  } catch(e:any){
    next(new HttpError(401, "invalid token"))
  }
}
