import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "gta_rp_salt").digest("hex");
}

function formatUser(user: any) {
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    createdAt: rest.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

router.post("/users/register", async (req, res) => {
  try {
    const { username, displayName, password } = req.body;
    if (!username || !displayName || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }
    const [user] = await db.insert(usersTable).values({
      username,
      displayName,
      passwordHash: hashPassword(password),
      status: "online",
    }).returning();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });
    res.cookie("session_token", token, { httpOnly: true, sameSite: "lax", expires: expiresAt });
    res.status(201).json(formatUser(user));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    await db.update(usersTable).set({ status: "online" }).where(eq(usersTable.id, user.id));
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });
    res.cookie("session_token", token, { httpOnly: true, sameSite: "lax", expires: expiresAt });
    res.json(formatUser({ ...user, status: "online" }));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/logout", requireAuth, async (req, res) => {
  try {
    const token = req.cookies?.["session_token"] || req.headers["x-session-token"];
    if (token) {
      await db.delete(sessionsTable).where(eq(sessionsTable.token, token as string));
    }
    const user = (req as any).user;
    await db.update(usersTable).set({ status: "offline" }).where(eq(usersTable.id, user.id));
    res.clearCookie("session_token");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/me", requireAuth, async (req, res) => {
  res.json(formatUser((req as any).user));
});

router.patch("/users/me", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { displayName, bio, avatarUrl, status, rpStatus, activeCharacterId } = req.body;
    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (status !== undefined) updates.status = status;
    if (rpStatus !== undefined) updates.rpStatus = rpStatus;
    if (activeCharacterId !== undefined) updates.activeCharacterId = activeCharacterId;
    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning();
    res.json(formatUser(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:userId", requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
