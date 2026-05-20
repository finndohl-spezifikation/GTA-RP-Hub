import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.["session_token"] || req.headers["x-session-token"];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const now = new Date();
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, token as string), gt(sessionsTable.expiresAt, now)))
    .limit(1);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).user = user;
  next();
}
