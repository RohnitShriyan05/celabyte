// src/middleware/security.ts
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "../utils/logger";
import { SECURITY } from "../config/security";

// Rate limiting per tenant
const tenantRateLimits = new Map<string, { count: number; resetTime: number }>();

export const tenantRateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: any, res: Response, next: NextFunction) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return next();

    const now = Date.now();
    const tenantLimit = tenantRateLimits.get(tenantId);

    if (!tenantLimit || now > tenantLimit.resetTime) {
      tenantRateLimits.set(tenantId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (tenantLimit.count >= maxRequests) {
      logger.warn({ tenantId, count: tenantLimit.count }, "Tenant rate limit exceeded");
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((tenantLimit.resetTime - now) / 1000)
      });
    }
    tenantLimit.count++;
    next();
  };
};

// Query complexity analysis
export const analyzeQueryComplexity = (query: string): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 0;

  // Check for dangerous patterns
  const dangerousPatterns = [
    { pattern: /DELETE\s+FROM/i, score: 50, issue: "DELETE operation detected" },
    { pattern: /DROP\s+(TABLE|DATABASE|SCHEMA)/i, score: 100, issue: "DROP operation detected" },
    { pattern: /TRUNCATE/i, score: 40, issue: "TRUNCATE operation detected" },
    { pattern: /UPDATE.*SET/i, score: 30, issue: "UPDATE operation detected" },
    { pattern: /INSERT\s+INTO/i, score: 20, issue: "INSERT operation detected" },
    { pattern: /CREATE\s+(TABLE|DATABASE|SCHEMA)/i, score: 30, issue: "CREATE operation detected" },
    { pattern: /ALTER\s+TABLE/i, score: 25, issue: "ALTER operation detected" },
    { pattern: /UNION\s+ALL/i, score: 15, issue: "UNION ALL detected" },
    { pattern: /;\s*--/i, score: 20, issue: "SQL comment after statement" },
    { pattern: /\/\*.*\*\//i, score: 10, issue: "Block comment detected" },
  ];

  dangerousPatterns.forEach(({ pattern, score: patternScore, issue }) => {
    if (pattern.test(query)) {
      score += patternScore;
      issues.push(issue);
    }
  });

  // Check query length
  if (query.length > 1000) {
    score += 10;
    issues.push("Very long query");
  }

  // Check for multiple statements
  const statements = query.split(';').filter(s => s.trim());
  if (statements.length > 1) {
    score += statements.length * 5;
    issues.push("Multiple SQL statements");
  }

  return { score, issues };
};

// Query validation middleware
export const validateQuery = (req: any, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Invalid query message" });
    }

    // Analyze complexity
    const complexity = analyzeQueryComplexity(message);
    
    if (complexity.score > SECURITY.maxQueryComplexity) {
      logger.warn({ 
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
        complexity: complexity.score,
        issues: complexity.issues,
        query: message.substring(0, 100)
      }, "Query blocked due to high complexity");

      return res.status(400).json({
        error: "Query complexity too high",
        issues: complexity.issues,
        score: complexity.score,
        maxAllowed: SECURITY.maxQueryComplexity
      });
    }

    // Log high complexity queries
    if (complexity.score > 20) {
      logger.info({
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
        complexity: complexity.score,
        issues: complexity.issues
      }, "High complexity query detected");
    }

    req.queryComplexity = complexity;
    next();

  } catch (error: any) {
    logger.error({ error: error.message }, "Query validation failed");
    res.status(500).json({ error: "Query validation failed" });
  }
};

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// Request timeout middleware
export const requestTimeout = (timeoutMs: number = SECURITY.queryTimeoutMs) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn({ 
          url: req.url, 
          method: req.method,
          timeout: timeoutMs 
        }, "Request timeout");
        
        res.status(408).json({ 
          error: "Request timeout",
          timeout: timeoutMs 
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

// Schema validation middleware factory
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};
