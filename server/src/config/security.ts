// src/config/security.ts
export const SECURITY = {
    maxBodyBytes: 256 * 1024,  // 256 KB
    queryTimeoutMs: 30_000,    // 30 seconds for complex queries
    defaultLimit: 50,
    maxLimit: 1000,            // Increased for data analysis
    maxQueryComplexity: 50,    // Query complexity threshold
    maxConcurrentQueries: 5,   // Per tenant
    rateLimitWindow: 60_000,   // 1 minute
    rateLimitRequests: 100     // Per window per tenant
  }
  