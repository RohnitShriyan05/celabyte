// src/ai/tools.ts
import { z } from "zod";

export const sqlSchema = z
  .object({
    dialect: z.enum(["postgres", "mysql"]),
    table: z.string().min(1, "Table name cannot be empty"),
    columns: z.array(z.string().min(1)).default(["*"]),
    where: z.record(z.any()).default({}),
    orderBy: z.string().optional(),
    limit: z.number().min(1).max(200).default(50),
  })
  .refine((data) => {
    // Validate table name format
    if (!/^[a-zA-Z0-9_]+$/.test(data.table)) {
      throw new Error(
        "Table name must contain only letters, numbers, and underscores"
      );
    }
    return true;
  });

export const mongoSchema = z
  .object({
    db: z.string().min(1, "Database name cannot be empty"),
    collection: z.string().min(1, "Collection name cannot be empty"),
    filter: z.record(z.any()).default({}),
    projection: z.record(z.number().min(0).max(1)).default({}),
    sort: z
      .record(
        z
          .number()
          .refine(
            (val) => val === 1 || val === -1,
            "Sort values must be 1 or -1"
          )
      )
      .optional(),
    limit: z.number().min(1).max(200).default(50),
  })
  .refine((data) => {
    // Validate database and collection names
    if (!/^[a-zA-Z0-9_]+$/.test(data.db)) {
      throw new Error(
        "Database name must contain only letters, numbers, and underscores"
      );
    }
    if (!/^[a-zA-Z0-9_]+$/.test(data.collection)) {
      throw new Error(
        "Collection name must contain only letters, numbers, and underscores"
      );
    }
    return true;
  });

export const sheetSchema = z
  .object({
    path: z.string().min(1, "Sheet path cannot be empty"),
    sheet: z.string().min(1, "Sheet name cannot be empty"),
    filter: z.record(z.any()).default({}),
    select: z.array(z.string().min(1)).default([]),
    limit: z.number().min(1).max(200).default(50),
  })
  .refine((data) => {
    // Validate sheet path format (Google Sheets ID or URL)
    const isGoogleSheetsId = /^[a-zA-Z0-9-_]+$/.test(data.path);
    const isGoogleSheetsUrl = data.path.includes(
      "docs.google.com/spreadsheets"
    );
    const isLocalPath = data.path.includes("/") || data.path.includes("\\");

    if (!isGoogleSheetsId && !isGoogleSheetsUrl && !isLocalPath) {
      throw new Error("Invalid sheet path format");
    }
    return true;
  });

// Enhanced validation functions
export function validateSqlQuery(query: any): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  try {
    sqlSchema.parse(query);
  } catch (error: any) {
    if (error.errors) {
      errors.push(...error.errors.map((e: any) => e.message));
    } else {
      errors.push(error.message);
    }
  }

  // Additional validation and suggestions
  if (query.columns && query.columns.length > 10) {
    suggestions.push("Consider selecting fewer columns for better performance");
  }

  if (query.limit && query.limit > 100) {
    suggestions.push(
      "Large limit values may cause slow queries. Consider using pagination."
    );
  }

  if (query.where && Object.keys(query.where).length > 5) {
    suggestions.push(
      "Complex WHERE clauses may be slow. Consider simplifying filters."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
  };
}

export function validateMongoQuery(query: any): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  try {
    mongoSchema.parse(query);
  } catch (error: any) {
    if (error.errors) {
      errors.push(...error.errors.map((e: any) => e.message));
    } else {
      errors.push(error.message);
    }
  }

  // Additional validation and suggestions
  if (query.projection && Object.keys(query.projection).length > 10) {
    suggestions.push("Consider projecting fewer fields for better performance");
  }

  if (query.filter && typeof query.filter === "object") {
    const filterDepth = JSON.stringify(query.filter).length;
    if (filterDepth > 500) {
      suggestions.push(
        "Complex filters may be slow. Consider simplifying your query."
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
  };
}

export function validateSheetQuery(query: any): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  try {
    sheetSchema.parse(query);
  } catch (error: any) {
    if (error.errors) {
      errors.push(...error.errors.map((e: any) => e.message));
    } else {
      errors.push(error.message);
    }
  }

  // Additional validation and suggestions
  if (query.select && query.select.length > 20) {
    suggestions.push(
      "Selecting many columns from sheets may be slow. Consider fewer columns."
    );
  }

  if (query.filter && Object.keys(query.filter).length > 3) {
    suggestions.push(
      "Multiple filters on sheets may be slow. Consider server-side filtering if available."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
  };
}
