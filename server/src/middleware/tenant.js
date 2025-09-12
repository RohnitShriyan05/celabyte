"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantContext = tenantContext;
// src/middleware/tenant.ts
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
async function tenantContext(req, _res, next) {
    try {
        const tenantId = req.user?.tenantId;
        const membership = await prisma.userTenant.findFirst({
            where: { tenantId, userId: req.user.id },
            include: { Tenant: true }
        });
        if (!membership)
            throw new errors_1.HttpError(403, "not a member of tenants");
        req.tenant = membership.Tenant;
        req.role = membership.role;
        next();
    }
    catch (e) {
        next(e);
    }
}
