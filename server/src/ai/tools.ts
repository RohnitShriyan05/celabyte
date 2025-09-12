// src/ai/tools.ts
import { z } from "zod"

export const sqlSchema = z.object({
  dialect: z.enum(["postgres","mysql"]),
  table: z.string(),
  columns: z.array(z.string()).default(["*"]),
  where: z.record(z.any()).default({}),
  orderBy: z.string().optional(),
  limit: z.number().min(1).max(200).default(50)
})

export const mongoSchema = z.object({
  db: z.string(),
  collection: z.string(),
  filter: z.record(z.any()).default({}),
  projection: z.record(z.number()).default({}),
  sort: z.record(z.number()).optional(),
  limit: z.number().min(1).max(200).default(50)
})

export const sheetSchema = z.object({
  path: z.string(),
  sheet: z.string(),
  filter: z.record(z.any()).default({}),
  select: z.array(z.string()).default([]),
  limit: z.number().min(1).max(200).default(50)
})
