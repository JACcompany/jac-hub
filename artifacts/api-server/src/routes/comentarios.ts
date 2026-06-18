import { Router, type IRouter } from "express";
import { db, comentariosTareaTable } from "@workspace/db";
import { eq, asc, count } from "drizzle-orm";
import { requireAuth } from "../middleware/adminAuth";

const router: IRouter = Router();

// GET /api/tareas/:id/comentarios
router.get("/tareas/:id/comentarios", requireAuth, async (req, res): Promise<void> => {
  const tareaId = parseInt(req.params["id"] as string, 10);
  if (isNaN(tareaId)) { res.status(400).json({ error: "ID inválido" }); return; }

  const comentarios = await db
    .select()
    .from(comentariosTareaTable)
    .where(eq(comentariosTareaTable.tareaId, tareaId))
    .orderBy(asc(comentariosTareaTable.fechaCreacion));

  res.json(comentarios.map(c => ({
    ...c,
    fechaCreacion: c.fechaCreacion.toISOString(),
  })));
});

// POST /api/tareas/:id/comentarios
router.post("/tareas/:id/comentarios", requireAuth, async (req, res): Promise<void> => {
  const tareaId = parseInt(req.params["id"] as string, 10);
  if (isNaN(tareaId)) { res.status(400).json({ error: "ID inválido" }); return; }

  const usuario = (req as any).usuario;
  const { contenido } = req.body;
  if (!contenido?.trim()) { res.status(400).json({ error: "El comentario no puede estar vacío" }); return; }

  const [saved] = await db
    .insert(comentariosTareaTable)
    .values({
      tareaId,
      autorId: usuario.id,
      autorNombre: usuario.nombre,
      autorEmail: usuario.email,
      contenido: String(contenido).slice(0, 1000).trim(),
    })
    .returning();

  res.status(201).json({
    ...saved,
    fechaCreacion: saved.fechaCreacion.toISOString(),
  });
});

// GET /api/tareas/conteos-comentarios — { [tareaId]: count } para todos
router.get("/tareas/conteos-comentarios", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({ tareaId: comentariosTareaTable.tareaId, total: count() })
    .from(comentariosTareaTable)
    .groupBy(comentariosTareaTable.tareaId);

  const mapa: Record<number, number> = {};
  for (const r of rows) mapa[r.tareaId] = Number(r.total);
  res.json(mapa);
});

export default router;
