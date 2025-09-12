// src/routes/health.ts
import express from "express";

const router = express.Router();

router.get("/", (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
