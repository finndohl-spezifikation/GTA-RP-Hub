import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const channelsTable = pgTable("channels", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("text"),
  topic: text("topic"),
  position: integer("position").notNull().default(0),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChannelSchema = createInsertSchema(channelsTable).omit({ id: true, createdAt: true });
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channelsTable.$inferSelect;
