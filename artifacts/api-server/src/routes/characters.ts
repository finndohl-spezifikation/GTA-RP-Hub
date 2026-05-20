import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { charactersTable, factionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function formatCharacter(char: any) {
  let faction = null;
  if (char.factionId) {
    const [f] = await db.select().from(factionsTable).where(eq(factionsTable.id, char.factionId)).limit(1);
    faction = f || null;
  }
  return { ...char, createdAt: char.createdAt?.toISOString(), faction };
}

router.get("/characters", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id));
    const formatted = await Promise.all(chars.map(formatCharacter));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/characters", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, age, occupation, backstory, factionId, imageUrl } = req.body;
    const [char] = await db.insert(charactersTable).values({
      userId: user.id,
      name,
      age,
      occupation,
      backstory,
      factionId: factionId || null,
      imageUrl,
      isActive: false,
    }).returning();
    res.status(201).json(await formatCharacter(char));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/characters/:characterId", requireAuth, async (req, res) => {
  try {
    const characterId = parseInt(req.params.characterId);
    const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId)).limit(1);
    if (!char) return res.status(404).json({ error: "Character not found" });
    res.json(await formatCharacter(char));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/characters/:characterId", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const characterId = parseInt(req.params.characterId);
    const [existing] = await db.select().from(charactersTable)
      .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, user.id))).limit(1);
    if (!existing) return res.status(404).json({ error: "Character not found" });
    const { name, age, occupation, backstory, factionId, imageUrl, isActive } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (age !== undefined) updates.age = age;
    if (occupation !== undefined) updates.occupation = occupation;
    if (backstory !== undefined) updates.backstory = backstory;
    if (factionId !== undefined) updates.factionId = factionId;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (isActive !== undefined) updates.isActive = isActive;
    const [updated] = await db.update(charactersTable).set(updates)
      .where(eq(charactersTable.id, characterId)).returning();
    res.json(await formatCharacter(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/characters/:characterId", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const characterId = parseInt(req.params.characterId);
    await db.delete(charactersTable)
      .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, user.id)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
