"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const password_1 = require("../auth/password");
const token_1 = require("../auth/token");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const credsSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(8).max(128) });
router.post("/register", async (req, res, next) => {
    try {
        const { email, password } = credsSchema.parse(req.body);
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists)
            return res.status(409).json({ error: "Email already registered" });
        const passwordHash = await (0, password_1.hashPassword)(password);
        const user = await prisma.user.create({ data: { email, passwordHash } });
        // Create a default tenant and membership so protected routes work in dev
        const slugBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const tenant = await prisma.tenant.create({ data: { name: `${slugBase}-tenant`, slug: `${slugBase}-${user.id.slice(0, 6)}` } });
        await prisma.userTenant.create({ data: { userId: user.id, tenantId: tenant.id, role: "OWNER" } });
        const token = (0, token_1.signUserToken)({ id: user.id, email: user.email, tenantId: tenant.id });
        res.json({ token });
    }
    catch (e) {
        next(e);
    }
});
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = credsSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ error: "Invalid credentials" });
        const ok = await (0, password_1.verifyPassword)(password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ error: "Invalid credentials" });
        let membership = await prisma.userTenant.findFirst({ where: { userId: user.id } });
        if (!membership) {
            const slugBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const tenant = await prisma.tenant.create({ data: { name: `${slugBase}-tenant`, slug: `${slugBase}-${user.id.slice(0, 6)}` } });
            membership = await prisma.userTenant.create({ data: { userId: user.id, tenantId: tenant.id, role: "OWNER" } });
        }
        const token = (0, token_1.signUserToken)({ id: user.id, email: user.email, tenantId: membership.tenantId });
        res.json({ token });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
