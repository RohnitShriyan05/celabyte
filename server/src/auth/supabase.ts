// src/auth/supabase.ts
import { jwtVerify } from "jose";
import { env } from "../config/env";
import { HttpError } from "../utils/errors";
import { logger } from "../utils/logger";

// Supabase JWT validation
export async function validateSupabaseJWT(token: string) {
  try {
    // For Supabase, we need to verify the JWT using the Supabase JWT secret
    // In production, you'd get this from your Supabase project settings
    const supabaseJwtSecret =
      process.env.SUPABASE_JWT_SECRET || env.jwt.hs256Secret;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(supabaseJwtSecret)
    );

    // Supabase JWT structure
    return {
      id: payload.sub as string,
      email: payload.email as string,
      tenantId: payload.sub as string, // Use user ID as tenant ID
      role: (payload.user_metadata as any)?.role || "USER",
      aud: payload.aud,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch (error) {
    logger.warn(
      { error: (error as Error).message },
      "Supabase JWT validation failed"
    );
    throw new HttpError(401, "invalid supabase token");
  }
}

// Enhanced auth middleware for Supabase
export async function supabaseAuthMiddleware(req: any, _res: any, next: any) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;

  if (!token) {
    logger.warn({ path: req.path }, "Request without token");
    return next(new HttpError(401, "missing token"));
  }

  try {
    const user = await validateSupabaseJWT(token);
    req.user = user;
    logger.debug(
      { userId: user.id, tenantId: user.tenantId },
      "User authenticated via Supabase"
    );
    next();
  } catch (error) {
    next(error);
  }
}
