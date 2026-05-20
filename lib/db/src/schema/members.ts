import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serverId: integer("server_id").notNull(),
  role: text("role").notNull().default("member"),
  nickname: text("nickname"),
  factionTag: text("faction_tag"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ id: true, joinedAt: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
