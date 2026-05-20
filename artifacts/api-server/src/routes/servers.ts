import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { serversTable, channelsTable, membersTable, messagesTable, usersTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatServer(server: any, memberCount = 0) {
  return {
    ...server,
    memberCount,
    createdAt: server.createdAt?.toISOString(),
  };
}

async function getServerMemberCount(serverId: number): Promise<number> {
  const [result] = await db.select({ count: count() }).from(membersTable).where(eq(membersTable.serverId, serverId));
  return result?.count ?? 0;
}

router.get("/servers", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const userMembers = await db.select().from(membersTable).where(eq(membersTable.userId, user.id));
    const serverIds = userMembers.map((m) => m.serverId);
    if (serverIds.length === 0) return res.json([]);
    const servers = await db.select().from(serversTable)
      .where(sql`${serversTable.id} = ANY(${sql.raw(`ARRAY[${serverIds.join(",")}]::int[]`)})`);
    const result = await Promise.all(servers.map(async (s) => formatServer(s, await getServerMemberCount(s.id))));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/servers", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, description, iconUrl, isPublic, category } = req.body;
    const [server] = await db.insert(serversTable).values({
      name,
      description,
      iconUrl,
      ownerId: user.id,
      isPublic: isPublic !== false,
      category,
    }).returning();
    await db.insert(membersTable).values({ userId: user.id, serverId: server.id, role: "owner" });
    const [general] = await db.insert(channelsTable).values({ serverId: server.id, name: "allgemein", type: "text", position: 0 }).returning();
    await db.insert(messagesTable).values({
      content: `Willkommen auf ${server.name}! Dies ist der Beginn eurer Geschichte.`,
      authorId: user.id,
      channelId: general.id,
      isSystem: true,
    });
    res.status(201).json(formatServer(server, 1));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/servers/discover", requireAuth, async (_req, res) => {
  try {
    const servers = await db.select().from(serversTable).where(eq(serversTable.isPublic, true)).limit(50);
    const result = await Promise.all(servers.map(async (s) => formatServer(s, await getServerMemberCount(s.id))));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/servers/:serverId", requireAuth, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const [server] = await db.select().from(serversTable).where(eq(serversTable.id, serverId)).limit(1);
    if (!server) return res.status(404).json({ error: "Server not found" });
    const channels = await db.select().from(channelsTable).where(eq(channelsTable.serverId, serverId));
    const memberRows = await db.select().from(membersTable).where(eq(membersTable.serverId, serverId));
    const membersWithUsers = await Promise.all(memberRows.map(async (m) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, m.userId)).limit(1);
      const { passwordHash, ...userSafe } = u || ({} as any);
      return { ...m, joinedAt: m.joinedAt?.toISOString(), user: { ...userSafe, createdAt: userSafe.createdAt?.toISOString() } };
    }));
    res.json({
      ...formatServer(server, memberRows.length),
      channels: channels.map((c) => ({ ...c, createdAt: c.createdAt?.toISOString() })),
      members: membersWithUsers,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/servers/:serverId", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const serverId = parseInt(req.params.serverId);
    const [server] = await db.select().from(serversTable).where(eq(serversTable.id, serverId)).limit(1);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
    const { name, description, iconUrl, bannerUrl, isPublic, category } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (iconUrl !== undefined) updates.iconUrl = iconUrl;
    if (bannerUrl !== undefined) updates.bannerUrl = bannerUrl;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (category !== undefined) updates.category = category;
    const [updated] = await db.update(serversTable).set(updates).where(eq(serversTable.id, serverId)).returning();
    res.json(formatServer(updated, await getServerMemberCount(serverId)));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/servers/:serverId", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const serverId = parseInt(req.params.serverId);
    const [server] = await db.select().from(serversTable).where(eq(serversTable.id, serverId)).limit(1);
    if (!server || server.ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
    await db.delete(serversTable).where(eq(serversTable.id, serverId));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/servers/:serverId/join", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const serverId = parseInt(req.params.serverId);
    const existing = await db.select().from(membersTable)
      .where(and(eq(membersTable.userId, user.id), eq(membersTable.serverId, serverId))).limit(1);
    if (existing.length > 0) return res.json(existing[0]);
    const [member] = await db.insert(membersTable).values({ userId: user.id, serverId, role: "member" }).returning();
    res.json({ ...member, joinedAt: member.joinedAt?.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/servers/:serverId/leave", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const serverId = parseInt(req.params.serverId);
    await db.delete(membersTable).where(and(eq(membersTable.userId, user.id), eq(membersTable.serverId, serverId)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/servers/:serverId/stats", requireAuth, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const memberRows = await db.select().from(membersTable).where(eq(membersTable.serverId, serverId));
    const memberIds = memberRows.map((m) => m.userId);
    let onlineCount = 0;
    if (memberIds.length > 0) {
      const onlineUsers = await db.select().from(usersTable)
        .where(sql`${usersTable.id} = ANY(${sql.raw(`ARRAY[${memberIds.join(",")}]::int[]`)}) AND ${usersTable.status} != 'offline'`);
      onlineCount = onlineUsers.length;
    }
    const channels = await db.select().from(channelsTable).where(eq(channelsTable.serverId, serverId));
    const channelIds = channels.filter((c) => c.type === "text").map((c) => c.id);
    let messagesTotal = 0;
    let topChannels: any[] = [];
    if (channelIds.length > 0) {
      const msgCounts = await Promise.all(channelIds.map(async (cid) => {
        const [r] = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.channelId, cid));
        const ch = channels.find((c) => c.id === cid)!;
        return { channelId: cid, channelName: ch.name, messageCount: r?.count ?? 0 };
      }));
      messagesTotal = msgCounts.reduce((s, c) => s + c.messageCount, 0);
      topChannels = msgCounts.sort((a, b) => b.messageCount - a.messageCount).slice(0, 5);
    }
    res.json({ membersTotal: memberRows.length, membersOnline: onlineCount, channelsCount: channels.length, messagesTotal, topChannels });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/servers/:serverId/members", requireAuth, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const memberRows = await db.select().from(membersTable).where(eq(membersTable.serverId, serverId));
    const result = await Promise.all(memberRows.map(async (m) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, m.userId)).limit(1);
      const { passwordHash, ...userSafe } = u || ({} as any);
      return { ...m, joinedAt: m.joinedAt?.toISOString(), user: { ...userSafe, createdAt: userSafe.createdAt?.toISOString() } };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/servers/:serverId/members/:memberId", requireAuth, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const memberId = parseInt(req.params.memberId);
    const { role, nickname, factionTag } = req.body;
    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (nickname !== undefined) updates.nickname = nickname;
    if (factionTag !== undefined) updates.factionTag = factionTag;
    const [updated] = await db.update(membersTable).set(updates)
      .where(and(eq(membersTable.id, memberId), eq(membersTable.serverId, serverId))).returning();
    if (!updated) return res.status(404).json({ error: "Member not found" });
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);
    const { passwordHash, ...userSafe } = u || ({} as any);
    res.json({ ...updated, joinedAt: updated.joinedAt?.toISOString(), user: { ...userSafe, createdAt: userSafe.createdAt?.toISOString() } });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
