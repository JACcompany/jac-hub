import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, tareasTable } from "@workspace/db";
import {
  CreateTareaBody,
  UpdateTareaBody,
  UpdateTareaParams,
  DeleteTareaParams,
  ListTareasQueryParams,
  ListTareasResponse,
  UpdateTareaResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middleware/adminAuth";

const OWNER_EMAIL = "gael@jac.dev";

const router: IRouter = Router();

router.get("/tareas", requireAuth, async (req, res): Promise<void> => {
  const qp = ListTareasQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }
  const conditions = [];
  if (qp.data.proyectoId != null) conditions.push(eq(tareasTable.proyectoId, qp.data.proyectoId));
  if (qp.data.columna) conditions.push(eq(tareasTable.columna, qp.data.columna));

  const tareas = conditions.length > 0
    ? await db.select().from(tareasTable).where(and(...conditions)).orderBy(tareasTable.fechaCreacion)
    : await db.select().from(tareasTable).orderBy(tareasTable.fechaCreacion);

  res.json(ListTareasResponse.parse(tareas.map(t => ({
    ...t,
    fechaCreacion: t.fechaCreacion.toISOString(),
    fechaLimite: t.fechaLimite ? t.fechaLimite.toISOString() : null,
  }))));
});

router.post("/tareas", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTareaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const usuario = (req as any).usuario;
  const { fechaLimite, creadoPor: _ignore, ...rest } = parsed.data;
  const [tarea] = await db.insert(tareasTable).values({
    ...rest,
    creadoPor: usuario.email,
    ...(fechaLimite ? { fechaLimite: new Date(fechaLimite) } : {}),
  }).returning();
  res.status(201).json({
    ...tarea,
    fechaCreacion: tarea.fechaCreacion.toISOString(),
    fechaLimite: tarea.fechaLimite ? tarea.fechaLimite.toISOString() : null,
  });
});

router.patch("/tareas/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTareaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTareaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { fechaLimite: fl, ...restUpdate } = parsed.data;
  const [tarea] = await db
    .update(tareasTable)
    .set({ ...restUpdate, ...(fl ? { fechaLimite: new Date(fl) } : {}) })
    .where(eq(tareasTable.id, params.data.id))
    .returning();
  if (!tarea) {
    res.status(404).json({ error: "Tarea no encontrada" });
    return;
  }
  res.json(UpdateTareaResponse.parse({
    ...tarea,
    fechaCreacion: tarea.fechaCreacion.toISOString(),
    fechaLimite: tarea.fechaLimite ? tarea.fechaLimite.toISOString() : null,
  }));
});

router.delete("/tareas/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTareaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const usuario = (req as any).usuario;
  const [existingTarea] = await db.select().from(tareasTable).where(eq(tareasTable.id, params.data.id));
  if (!existingTarea) {
    res.status(404).json({ error: "Tarea no encontrada" });
    return;
  }
  if (existingTarea.creadoPor !== usuario.email && usuario.email !== OWNER_EMAIL) {
    res.status(403).json({ error: "Solo puedes eliminar tus propias tareas." });
    return;
  }
  await db.delete(tareasTable).where(eq(tareasTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
