// src/routes/auth.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../auth/password";
import { signUserToken } from "../auth/token";

const prisma = new PrismaClient();
const router = Router();

const credsSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = credsSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email already registered" });
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    // Create a default tenant and membership so protected routes work in dev
    const slugBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const tenant = await prisma.tenant.create({ data: { name: `${slugBase}-tenant`, slug: `${slugBase}-${user.id.slice(0,6)}` } });
    await prisma.userTenant.create({ data: { userId: user.id, tenantId: tenant.id, role: "OWNER" } });
    const token = signUserToken({ id: user.id, email: user.email, tenantId: tenant.id });
    res.json({ token });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = credsSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    let membership = await prisma.userTenant.findFirst({ where: { userId: user.id } });
    if (!membership) {
      const slugBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const tenant = await prisma.tenant.create({ data: { name: `${slugBase}-tenant`, slug: `${slugBase}-${user.id.slice(0,6)}` } });
      membership = await prisma.userTenant.create({ data: { userId: user.id, tenantId: tenant.id, role: "OWNER" } });
    }
    const token = signUserToken({ id: user.id, email: user.email, tenantId: membership.tenantId });
    res.json({ token });
  } catch (e) { next(e); }
});

export default router;
