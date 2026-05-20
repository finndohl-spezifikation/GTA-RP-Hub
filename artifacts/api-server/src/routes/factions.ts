import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { factionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/factions", requireAuth, async (_req, res) => {
  try {
    const factions = await db.select().from(factionsTable);
    res.json(factions);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
