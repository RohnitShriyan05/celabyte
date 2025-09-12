import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

const schema = z.object({ names: z.array(z.string().min(1)) });

router.post("/", async (req: any, res, next) => {
	try {
		const { names } = schema.parse(req.body);
		const created = await prisma.$transaction(
			names.map((name) =>
				prisma.allowedTable.create({
					data: {
						tenantId: req.user.tenantId,
						name,
						allowedCols: "[]"
					}
				})
			)
		);
		res.json({ ok: true, count: created.length });
	} catch (e) { next(e); }
});

export default router;


