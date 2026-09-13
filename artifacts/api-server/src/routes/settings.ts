import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, settingsTable } from "@workspace/db";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

function formatSettings(s: typeof settingsTable.$inferSelect) {
  return {
    id: s.id,
    userId: s.userId,
    theme: s.theme,
    emailNotifications: s.emailNotifications,
    pushNotifications: s.pushNotifications,
    criticalAlertEmail: s.criticalAlertEmail,
    weeklyReport: s.weeklyReport,
    sessionTimeout: s.sessionTimeout,
    twoFactorEnabled: s.twoFactorEnabled,
    language: s.language,
    timezone: s.timezone,
    apiKey: s.apiKey,
    createdAt: s.createdAt.toISOString(),
  };
}

// GET /api/settings
router.get("/settings", async (req: AuthRequest, res) => {
  let [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, req.userId!)).limit(1);
  if (!settings) {
    const apiKey = `cs-${randomBytes(16).toString("hex")}`;
    [settings] = await db.insert(settingsTable).values({ userId: req.userId!, apiKey }).returning();
  }
  res.json(formatSettings(settings));
});

// PATCH /api/settings
router.patch("/settings", async (req: AuthRequest, res) => {
  const { theme, emailNotifications, pushNotifications, criticalAlertEmail, weeklyReport, sessionTimeout, twoFactorEnabled, language, timezone } = req.body;
  const [settings] = await db.update(settingsTable)
    .set({ theme, emailNotifications, pushNotifications, criticalAlertEmail, weeklyReport, sessionTimeout, twoFactorEnabled, language, timezone, updatedAt: new Date() })
    .where(eq(settingsTable.userId, req.userId!)).returning();
  if (!settings) { res.status(404).json({ error: "Settings not found" }); return; }
  res.json(formatSettings(settings));
});

export default router;
