import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable, usersTable } from "@workspace/db";
import { eq, and, or, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function formatMessage(msg: any) {
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, msg.authorId)).limit(1);
  const { passwordHash, ...userSafe } = u || ({} as any);
  return {
    ...msg,
    createdAt: msg.createdAt?.toISOString(),
    author: { ...userSafe, createdAt: userSafe.createdAt?.toISOString() },
  };
}

router.get("/channels/:channelId/messages", requireAuth, async (req, res) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.channelId, channelId))
      .orderBy(desc(messagesTable.createdAt))
      .limit(50);
    const formatted = await Promise.all(msgs.reverse().map(formatMessage));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/channels/:channelId/messages", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const channelId = parseInt(req.params.channelId);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Content required" });
    const [msg] = await db.insert(messagesTable).values({
      content: content.trim(),
      authorId: user.id,
      channelId,
      isSystem: false,
    }).returning();
    res.status(201).json(await formatMessage(msg));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/messages/:messageId", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const messageId = parseInt(req.params.messageId);
    await db.delete(messagesTable)
      .where(and(eq(messagesTable.id, messageId), eq(messagesTable.authorId, user.id)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dm/:userId", requireAuth, async (req, res) => {
  try {
    const me = (req as any).user;
    const otherUserId = parseInt(req.params.userId);
    const msgs = await db.select().from(messagesTable)
      .where(
        or(
          and(eq(messagesTable.authorId, me.id), eq(messagesTable.dmRecipientId, otherUserId)),
          and(eq(messagesTable.authorId, otherUserId), eq(messagesTable.dmRecipientId, me.id))
        )
      )
      .orderBy(desc(messagesTable.createdAt))
      .limit(50);
    const formatted = await Promise.all(msgs.reverse().map(formatMessage));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/dm/:userId", requireAuth, async (req, res) => {
  try {
    const me = (req as any).user;
    const recipientId = parseInt(req.params.userId);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Content required" });
    const [msg] = await db.insert(messagesTable).values({
      content: content.trim(),
      authorId: me.id,
      dmRecipientId: recipientId,
      isSystem: false,
    }).returning();
    res.status(201).json(await formatMessage(msg));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dm/conversations", requireAuth, async (req, res) => {
  try {
    const me = (req as any).user;
    const sentMsgs = await db.select().from(messagesTable)
      .where(and(eq(messagesTable.authorId, me.id)));
    const receivedMsgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.dmRecipientId, me.id));
    const allDms = [...sentMsgs, ...receivedMsgs].filter((m) => m.dmRecipientId !== null);
    const partnerIds = new Set<number>();
    for (const m of allDms) {
      if (m.authorId === me.id && m.dmRecipientId) partnerIds.add(m.dmRecipientId);
      else if (m.dmRecipientId === me.id) partnerIds.add(m.authorId);
    }
    const conversations = await Promise.all(Array.from(partnerIds).map(async (userId) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      if (!u) return null;
      const { passwordHash, ...userSafe } = u;
      const partnerMsgs = allDms.filter((m) =>
        (m.authorId === me.id && m.dmRecipientId === userId) ||
        (m.authorId === userId && m.dmRecipientId === me.id)
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastMsg = partnerMsgs[0];
      const lastMsgFormatted = lastMsg ? await formatMessage(lastMsg) : null;
      return { userId, user: { ...userSafe, createdAt: userSafe.createdAt?.toISOString() }, lastMessage: lastMsgFormatted, unreadCount: 0 };
    }));
    res.json(conversations.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
