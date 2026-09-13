import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  theme: text("theme").notNull().default("dark"),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  criticalAlertEmail: boolean("critical_alert_email").notNull().default(true),
  weeklyReport: boolean("weekly_report").notNull().default(false),
  sessionTimeout: integer("session_timeout").notNull().default(30),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("UTC"),
  apiKey: text("api_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
