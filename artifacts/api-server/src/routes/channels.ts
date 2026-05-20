import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { channelsTable, serversTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/servers/:serverId/channels", requireAuth, async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const channels = await db.select().from(channelsTable)
      .where(eq(channelsTable.serverId, serverId));
    res.json(channels.map((c) => ({ ...c, createdAt: c.createdAt?.toISOString() })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/servers/:serverId/channels", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const serverId = parseInt(req.params.serverId);
    const [server] = await db.select().from(serversTable).where(eq(serversTable.id, serverId)).limit(1);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
    const { name, type, topic, position, parentId } = req.body;
    const [channel] = await db.insert(channelsTable).values({
      serverId,
      name,
      type: type || "text",
      topic,
      position: position ?? 0,
      parentId: parentId || null,
    }).returning();
    res.status(201).json({ ...channel, createdAt: channel.createdAt?.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/servers/:serverId/channels/:channelId", requireAuth, async (req, res) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const serverId = parseInt(req.params.serverId);
    const [channel] = await db.select().from(channelsTable)
      .where(and(eq(channelsTable.id, channelId), eq(channelsTable.serverId, serverId))).limit(1);
    if (!channel) return res.status(404).json({ error: "Channel not found" });
    res.json({ ...channel, createdAt: channel.createdAt?.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/servers/:serverId/channels/:channelId", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const channelId = parseInt(req.params.channelId);
    const serverId = parseInt(req.params.serverId);
    const [server] = await db.select().from(serversTable).where(eq(serversTable.id, serverId)).limit(1);
    if (!server || server.ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
    await db.delete(channelsTable).where(and(eq(channelsTable.id, channelId), eq(channelsTable.serverId, serverId)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
