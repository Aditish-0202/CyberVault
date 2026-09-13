import { Router } from "express";
import { eq, ilike, and, asc, desc, count } from "drizzle-orm";
import { db, devicesTable } from "@workspace/db";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

function formatDevice(d: typeof devicesTable.$inferSelect) {
  return {
    id: d.id,
    name: d.name,
    ipAddress: d.ipAddress,
    type: d.type,
    os: d.os,
    status: d.status,
    cpuUsage: d.cpuUsage,
    memoryUsage: d.memoryUsage,
    diskUsage: d.diskUsage,
    location: d.location,
    assignedUser: d.assignedUser,
    riskScore: d.riskScore,
    openAlerts: d.openAlerts,
    lastSeen: d.lastSeen.toISOString(),
    createdAt: d.createdAt.toISOString(),
  };
}

// GET /api/devices
router.get("/devices", async (req: AuthRequest, res) => {
  const { search, status, type, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 10, 100);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (search) conditions.push(ilike(devicesTable.name, `%${search}%`));
  if (status) conditions.push(eq(devicesTable.status, status));
  if (type) conditions.push(eq(devicesTable.type, type));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allowedSortCols: Record<string, typeof devicesTable.createdAt | typeof devicesTable.name | typeof devicesTable.status | typeof devicesTable.cpuUsage | typeof devicesTable.lastSeen> = {
    name: devicesTable.name,
    status: devicesTable.status,
    cpuUsage: devicesTable.cpuUsage,
    lastSeen: devicesTable.lastSeen,
    createdAt: devicesTable.createdAt,
  };
  const sortCol = allowedSortCols[sortBy] ?? devicesTable.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(devicesTable).where(whereClause).orderBy(orderFn(sortCol)).limit(limitNum).offset(offset),
    db.select({ total: count() }).from(devicesTable).where(whereClause),
  ]);

  res.json({
    data: data.map(formatDevice),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// POST /api/devices
router.post("/devices", async (req: AuthRequest, res) => {
  const { name, ipAddress, type, os, location, assignedUser } = req.body;
  if (!name || !ipAddress || !type) {
    res.status(400).json({ error: "name, ipAddress, type required" });
    return;
  }
  const [device] = await db.insert(devicesTable).values({
    name, ipAddress, type, os, location, assignedUser,
    status: "online",
    cpuUsage: Math.random() * 40 + 10,
    memoryUsage: Math.random() * 50 + 20,
    diskUsage: Math.random() * 60 + 10,
    riskScore: Math.random() * 30,
  }).returning();
  res.status(201).json(formatDevice(device));
});

// GET /api/devices/:id
router.get("/devices/:id", async (req: AuthRequest, res) => {
  const id = parseInt(String(req.params["id"]));
  const [device] = await db.select().from(devicesTable).where(eq(devicesTable.id, id)).limit(1);
  if (!device) { res.status(404).json({ error: "Device not found" }); return; }
  res.json(formatDevice(device));
});

// PATCH /api/devices/:id
router.patch("/devices/:id", async (req: AuthRequest, res) => {
  const id = parseInt(String(req.params["id"]));
  const { name, ipAddress, type, status, os, location, assignedUser, cpuUsage, memoryUsage, diskUsage } = req.body;
  const [device] = await db.update(devicesTable)
    .set({ name, ipAddress, type, status, os, location, assignedUser, cpuUsage, memoryUsage, diskUsage, updatedAt: new Date() })
    .where(eq(devicesTable.id, id)).returning();
  if (!device) { res.status(404).json({ error: "Device not found" }); return; }
  res.json(formatDevice(device));
});

// DELETE /api/devices/:id
router.delete("/devices/:id", async (req: AuthRequest, res) => {
  const id = parseInt(String(req.params["id"]));
  await db.delete(devicesTable).where(eq(devicesTable.id, id));
  res.json({ message: "Device deleted" });
});

export default router;
