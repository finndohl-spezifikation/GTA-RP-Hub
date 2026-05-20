import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serversTable = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  bannerUrl: text("banner_url"),
  ownerId: integer("owner_id").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServerSchema = createInsertSchema(serversTable).omit({ id: true, createdAt: true });
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof serversTable.$inferSelect;
