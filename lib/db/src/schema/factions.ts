import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const factionsTable = pgTable("factions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("other"),
  color: text("color").notNull().default("#888888"),
  description: text("description"),
  iconUrl: text("icon_url"),
});

export const insertFactionSchema = createInsertSchema(factionsTable).omit({ id: true });
export type InsertFaction = z.infer<typeof insertFactionSchema>;
export type Faction = typeof factionsTable.$inferSelect;
