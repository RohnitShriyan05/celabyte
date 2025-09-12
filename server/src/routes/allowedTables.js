"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const schema = zod_1.z.object({ names: zod_1.z.array(zod_1.z.string().min(1)) });
router.post("/", async (req, res, next) => {
    try {
        const { names } = schema.parse(req.body);
        const created = await prisma.$transaction(names.map((name) => prisma.allowedTable.create({
            data: {
                tenantId: req.user.tenantId,
                name,
                allowedCols: "[]"
            }
        })));
        res.json({ ok: true, count: created.length });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
