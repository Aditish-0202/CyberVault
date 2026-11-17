import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, activitiesTable, notificationsTable } from "@workspace/db";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

import { mlRequest } from "../lib/mlClient";

const router = Router();
router.use(authMiddleware);

// GET /api/activities
router.get("/activities", async (req: AuthRequest, res) => {
  const limit = Math.min(parseInt((req.query["limit"] as string) || "20"), 100);
  const data = await db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt), desc(activitiesTable.id)).limit(limit);
  res.json(data.map(a => ({
    id: a.id, type: a.type, message: a.message, userId: a.userId,
    userName: a.userName, resourceType: a.resourceType, resourceId: a.resourceId,
    severity: a.severity, createdAt: a.createdAt.toISOString(),
  })));
});

// GET /api/activities/system-status
router.get("/activities/system-status", async (_req, res) => {
  async function check(name: string, probe: () => Promise<"operational" | "degraded" | "down">) {
    const start = performance.now();
    try {
      const status = await probe();
      return { name, status, lastCheck: new Date().toISOString(), responseTime: Math.round(performance.now() - start) };
    } catch {
      return { name, status: "down", lastCheck: new Date().toISOString(), responseTime: null };
    }
  }

  const services = await Promise.all([
    check("Application API", async () => "operational"),
    check("Database", async () => {
      await db.execute(sql`SELECT 1`);
      return "operational";
    }),
    check("Threat Detection Engine", async () => {
      const health = await mlRequest<{ status?: string; models_loaded?: boolean }>("/health");
      if (health.status !== "online") return "down";
      return health.models_loaded === true ? "operational" : "degraded";
    }),
  ]);
  res.set("Cache-Control", "no-store").json(services);
});

// GET /api/notifications
router.get("/notifications", async (req: AuthRequest, res) => {
  const unreadOnly = req.query["unreadOnly"] === "true";
  let query = db.select().from(notificationsTable).where(eq(notificationsTable.userId, req.userId!));
  const data = await query.orderBy(notificationsTable.createdAt).limit(50);
  const filtered = unreadOnly ? data.filter(n => !n.read) : data;
  res.json(filtered.map(n => ({
    id: n.id, title: n.title, message: n.message, type: n.type,
    read: n.read, severity: n.severity, linkUrl: n.linkUrl, createdAt: n.createdAt.toISOString(),
  })));
});

// PATCH /api/notifications/:id/read
router.patch("/notifications/:id/read", async (req: AuthRequest, res) => {
  const id = parseInt(String(req.params["id"]));
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id));
  res.json({ message: "Notification marked as read" });
});

export default router;
