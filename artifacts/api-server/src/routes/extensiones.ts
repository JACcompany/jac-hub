import { Router, type IRouter } from "express";
import { db, timerSessionsTable, timerCoffeesTable, usuariosTable } from "@workspace/db";
import { eq, desc, gte, and } from "drizzle-orm";
import { requireAuth } from "../middleware/adminAuth";

const router: IRouter = Router();

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildWeekKeys(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

function calcStreak(daysWithSessions: Set<string>): number {
  let streak = 0;
  const d = new Date();
  if (!daysWithSessions.has(dayKey(d))) {
    d.setDate(d.getDate() - 1);
    if (!daysWithSessions.has(dayKey(d))) return 0;
  }
  while (daysWithSessions.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// GET /api/extensiones/ccc-timer/stats — stats for the current user
router.get("/extensiones/ccc-timer/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).usuario.id as number;

  const [allSessions, recentSessions, coffees7d] = await Promise.all([
    db.select().from(timerSessionsTable).where(eq(timerSessionsTable.usuarioId, userId)),
    db.select().from(timerSessionsTable).where(eq(timerSessionsTable.usuarioId, userId)).orderBy(desc(timerSessionsTable.iniciadaEn)).limit(10),
    db.select().from(timerCoffeesTable).where(
      and(eq(timerCoffeesTable.usuarioId, userId), gte(timerCoffeesTable.en, new Date(Date.now() - 7 * 86400_000)))
    ),
  ]);

  const weekKeys = buildWeekKeys();
  const weeklyMap = new Map(weekKeys.map(k => [k, 0]));
  const dayHasSession = new Set<string>();

  for (const s of allSessions) {
    const k = dayKey(new Date(s.iniciadaEn));
    dayHasSession.add(k);
    if (weeklyMap.has(k)) weeklyMap.set(k, (weeklyMap.get(k) ?? 0) + s.minutos);
  }

  const coffeesMap = new Map(weekKeys.map(k => [k, 0]));
  for (const c of coffees7d) {
    const k = dayKey(new Date(c.en));
    if (coffeesMap.has(k)) coffeesMap.set(k, (coffeesMap.get(k) ?? 0) + 1);
  }

  res.json({
    sessions: allSessions.length,
    minutesCoded: allSessions.reduce((a: number, s: { minutos: number }) => a + s.minutos, 0),
    streak: calcStreak(dayHasSession),
    weekly: weekKeys.map(k => weeklyMap.get(k) ?? 0),
    coffees: weekKeys.map(k => coffeesMap.get(k) ?? 0),
    recent: recentSessions.map(s => ({
      id: String(s.id),
      mode: s.modo,
      minutes: s.minutos,
      at: s.iniciadaEn.toISOString(),
    })),
    loading: false,
  });
});

// POST /api/extensiones/ccc-timer/sesiones — save a completed session
router.post("/extensiones/ccc-timer/sesiones", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).usuario.id as number;
  const { minutos, modo } = req.body as { minutos?: unknown; modo?: unknown };

  if (typeof minutos !== "number" || minutos < 1) {
    res.status(400).json({ error: "minutos inválido" });
    return;
  }

  const [saved] = await db.insert(timerSessionsTable).values({
    usuarioId: userId,
    minutos: Math.round(minutos),
    modo: String(modo ?? "Sesión"),
  }).returning();

  res.status(201).json({ ...saved, iniciadaEn: saved.iniciadaEn.toISOString() });
});

// POST /api/extensiones/ccc-timer/cafes — log a coffee
router.post("/extensiones/ccc-timer/cafes", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).usuario.id as number;
  const [saved] = await db.insert(timerCoffeesTable).values({ usuarioId: userId }).returning();
  res.status(201).json({ ...saved, en: saved.en.toISOString() });
});

// DELETE /api/extensiones/ccc-timer/reset — reset own data
router.delete("/extensiones/ccc-timer/reset", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).usuario.id as number;
  await Promise.all([
    db.delete(timerSessionsTable).where(eq(timerSessionsTable.usuarioId, userId)),
    db.delete(timerCoffeesTable).where(eq(timerCoffeesTable.usuarioId, userId)),
  ]);
  res.json({ ok: true });
});

// GET /api/extensiones/ccc-timer/ranking — all users leaderboard
router.get("/extensiones/ccc-timer/ranking", requireAuth, async (req, res): Promise<void> => {
  const usuarios = await db.select().from(usuariosTable);

  const allSessions = await db.select().from(timerSessionsTable);

  const statsMap = new Map<number, { sessionCount: number; totalMinutes: number; lastAt: string | null }>();
  for (const s of allSessions) {
    const prev = statsMap.get(s.usuarioId) ?? { sessionCount: 0, totalMinutes: 0, lastAt: null };
    const at = s.iniciadaEn.toISOString();
    statsMap.set(s.usuarioId, {
      sessionCount: prev.sessionCount + 1,
      totalMinutes: prev.totalMinutes + s.minutos,
      lastAt: !prev.lastAt || at > prev.lastAt ? at : prev.lastAt,
    });
  }

  const members = usuarios.map(u => ({
    id: u.id,
    username: u.nombre,
    email: u.email,
    sessionCount: statsMap.get(u.id)?.sessionCount ?? 0,
    totalMinutes: statsMap.get(u.id)?.totalMinutes ?? 0,
    lastSignInAt: statsMap.get(u.id)?.lastAt ?? null,
  }));

  res.json({ members });
});

export default router;
