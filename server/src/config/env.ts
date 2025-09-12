// src/config/env.ts
import "dotenv/config"
export const env = {
  node: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 9090),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  dbUrl: process.env.DATABASE_URL!,
  openaiKey: process.env.OPENAI_API_KEY,
  geminiKey: process.env.GEMINI_API_KEY!,
  jwt: {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    jwksUrl: process.env.JWT_JWKS_URL,
    hs256Secret: process.env.JWT_HS256_SECRET || process.env.JWT_SECRET || "changeme"
  },
  secretsBackend: process.env.SECRETS_BACKEND ?? "env"
}
