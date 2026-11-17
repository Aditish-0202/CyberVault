import { Router } from "express";
import { eq, count, gte, and } from "drizzle-orm";
import { db, devicesTable, alertsTable, usersTable } from "@workspace/db";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/analytics/overview
router.get("/analytics/overview", async (_req, res) => {
  const [[{ totalDevices }], [{ onlineDevices }], [{ activeThreats }], [{ criticalAlerts }], [{ activeUsers }]] = await Promise.all([
    db.select({ totalDevices: count() }).from(devicesTable),
    db.select({ onlineDevices: count() }).from(devicesTable).where(eq(devicesTable.status, "online")),
    db.select({ activeThreats: count() }).from(alertsTable).where(eq(alertsTable.status, "open")),
    db.select({ criticalAlerts: count() }).from(alertsTable).where(eq(alertsTable.severity, "critical")),
    db.select({ activeUsers: count() }).from(usersTable),
  ]);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [{ resolvedToday }] = await db.select({ resolvedToday: count() }).from(alertsTable).where(and(eq(alertsTable.status, "resolved"), gte(alertsTable.resolvedAt, today)));

  res.json({
    totalDevices,
    onlineDevices,
    activeThreats,
    criticalAlerts,
    securityScore: Math.max(0, Math.min(100, 92 - (activeThreats * 3) - (criticalAlerts * 5))),
    activeUsers,
    resolvedToday,
    blockedAttacks: Math.floor(Math.random() * 50) + 100,
    devicesChange: 5.2,
    threatsChange: activeThreats > 5 ? 12.4 : -8.1,
    scoreChange: activeThreats > 5 ? -3.2 : 2.1,
    usersChange: 2.5,
  });
});

// GET /api/analytics/network-traffic
router.get("/analytics/network-traffic", (_req, res) => {
  res.json([]);
});

// GET /api/analytics/threat-trends
router.get("/analytics/threat-trends", async (req, res) => {
  const period = req.query["period"];
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const dayMs = 86_400_000;
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const start = new Date(now.getTime() - (days - 1) * dayMs);
  const points = new Map<string, { date: string; critical: number; high: number; medium: number; low: number; total: number }>(Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * dayMs).toISOString().slice(0, 10);
    return [date, { date, critical: 0, high: 0, medium: 0, low: 0, total: 0 }] as const;
  }));
  const rows = await db.select({ severity: alertsTable.severity, date: alertsTable.createdAt })
    .from(alertsTable).where(gte(alertsTable.createdAt, start));

  for (const { severity, date } of rows) {
    const point = points.get(date.toISOString().slice(0, 10));
    if (!point) continue;
    if (severity === "critical" || severity === "high" || severity === "medium" || severity === "low") {
      point[severity]++;
    }
    point.total++;
  }

  res.json([...points.values()]);
});

// GET /api/analytics/attack-distribution
router.get("/analytics/attack-distribution", async (_req, res) => {
  const rows = await db.select({ type: alertsTable.attackType, count: count() })
    .from(alertsTable).groupBy(alertsTable.attackType);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  res.json(rows.sort((a, b) => b.count - a.count).map(row => ({
    type: row.type || "Unclassified",
    count: row.count,
    percentage: Number((row.count * 100 / total).toFixed(1)),
  })));
});

// GET /api/analytics/device-health
router.get("/analytics/device-health", async (_req, res) => {
  const [[{ healthy }], [{ warning }], [{ critical }], [{ offline }]] = await Promise.all([
    db.select({ healthy: count() }).from(devicesTable).where(eq(devicesTable.status, "online")),
    db.select({ warning: count() }).from(devicesTable).where(eq(devicesTable.status, "warning")),
    db.select({ critical: count() }).from(devicesTable).where(eq(devicesTable.status, "critical")),
    db.select({ offline: count() }).from(devicesTable).where(eq(devicesTable.status, "offline")),
  ]);

  res.json({
    healthy,
    warning,
    critical,
    offline,
    avgCpu: 38.5,
    avgMemory: 61.2,
    avgDisk: 47.8,
  });
});

// GET /api/analytics/security-score
router.get("/analytics/security-score", async (_req, res) => {
  const [[{ activeThreats }], [{ criticalAlerts }]] = await Promise.all([
    db.select({ activeThreats: count() }).from(alertsTable).where(eq(alertsTable.status, "open")),
    db.select({ criticalAlerts: count() }).from(alertsTable).where(eq(alertsTable.severity, "critical")),
  ]);
  const score = Math.max(0, Math.min(100, 92 - (activeThreats * 3) - (criticalAlerts * 5)));
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";

  res.json({
    score,
    grade,
    trend: score > 80 ? "up" : "down",
    change: 2.3,
    factors: [
      { name: "Endpoint Protection", score: 94, weight: 0.25, status: "excellent" },
      { name: "Network Security", score: 87, weight: 0.20, status: "good" },
      { name: "Access Control", score: 91, weight: 0.20, status: "excellent" },
      { name: "Patch Management", score: 78, weight: 0.15, status: "good" },
      { name: "Threat Intelligence", score: 82, weight: 0.10, status: "good" },
      { name: "Incident Response", score: 69, weight: 0.10, status: "needs-attention" },
    ],
  });
});

// GET /api/analytics/heatmap
router.get("/analytics/heatmap", async (_req, res) => {
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() - 6);
  const alerts = await db.select({ time: alertsTable.createdAt })
    .from(alertsTable).where(gte(alertsTable.createdAt, from));
  const cells = Array.from({ length: 168 }, (_, index) => ({
    day: Math.floor(index / 24), hour: index % 24, value: 0,
  }));
  for (const { time } of alerts) {
    const cell = cells[time.getUTCDay() * 24 + time.getUTCHours()];
    cell.value++;
  }
  res.json(cells);
});

// GET /api/analytics/risk-analysis
router.get("/analytics/risk-analysis", (_req, res) => {
  res.json([
    { category: "Data Exfiltration", score: 72, impact: "critical", likelihood: "medium", trend: "up" },
    { category: "Insider Threats", score: 58, impact: "high", likelihood: "low", trend: "stable" },
    { category: "Supply Chain Attacks", score: 81, impact: "critical", likelihood: "low", trend: "up" },
    { category: "Ransomware", score: 65, impact: "critical", likelihood: "medium", trend: "down" },
    { category: "Zero-Day Exploits", score: 78, impact: "critical", likelihood: "low", trend: "stable" },
    { category: "Phishing Campaigns", score: 45, impact: "high", likelihood: "high", trend: "down" },
    { category: "DDoS Attacks", score: 38, impact: "medium", likelihood: "medium", trend: "stable" },
  ]);
});

export default router;
