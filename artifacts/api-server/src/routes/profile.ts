import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/profile
router.get("/profile", async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone,
    location: user.location,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLogin: user.lastLogin?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

// PATCH /api/profile
router.patch("/profile", async (req: AuthRequest, res) => {
  const { name, department, phone, location, bio, avatarUrl } = req.body;
  const [user] = await db.update(usersTable)
    .set({ name, department, phone, location, bio, avatarUrl, updatedAt: new Date() })
    .where(eq(usersTable.id, req.userId!)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({
    id: user.id, name: user.name, email: user.email, role: user.role,
    department: user.department, phone: user.phone, location: user.location,
    bio: user.bio, avatarUrl: user.avatarUrl, twoFactorEnabled: user.twoFactorEnabled,
    lastLogin: user.lastLogin?.toISOString() ?? null, createdAt: user.createdAt.toISOString(),
  });
});

// PATCH /api/profile/password
router.patch("/profile/password", async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, req.userId!));
  res.json({ message: "Password changed successfully" });
});

export default router;
