// src/auth/jwt.ts
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env";
import { HttpError } from "../utils/errors";
import { logger } from "../utils/logger";

const jwks = env.jwt.jwksUrl
  ? createRemoteJWKSet(new URL(env.jwt.jwksUrl))
  : null;

export async function authMiddleware(req: any, _res: any, next: any) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;

  if (!token) {
    logger.warn({ path: req.path }, "Request without token");
    return next(new HttpError(401, "missing token"));
  }

  try {
    let payload: any;

    if (jwks) {
      // Use JWKS for production
      const { payload: p } = await jwtVerify(token, jwks, {
        issuer: env.jwt.issuer,
        audience: env.jwt.audience,
      });
      payload = p;
    } else {
      // Use HS256 for development/testing
      const { payload: p } = await jwtVerify(
        token,
        new TextEncoder().encode(env.jwt.hs256Secret),
        {
          issuer: env.jwt.issuer,
          audience: env.jwt.audience,
        }
      );
      payload = p;
    }

    // Extract user information from JWT payload
    req.user = {
      id: payload.sub || payload.user_id || payload.id,
      email: payload.email,
      tenantId:
        payload["org_id"] ||
        payload["tenant_id"] ||
        payload["tenantId"] ||
        payload.sub,
      role: payload["role"] || payload["user_role"] || "USER",
    };

    if (!req.user.id) {
      throw new Error("no user id in token");
    }

    if (!req.user.tenantId) {
      // Use user ID as tenant ID for single-tenant setup
      req.user.tenantId = req.user.id;
    }

    logger.debug(
      { userId: req.user.id, tenantId: req.user.tenantId },
      "User authenticated"
    );
    next();
  } catch (e: any) {
    logger.warn(
      { error: e.message, path: req.path },
      "Token verification failed"
    );
    next(new HttpError(401, "invalid token"));
  }
}
