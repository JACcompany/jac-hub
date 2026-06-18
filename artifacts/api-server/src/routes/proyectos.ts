import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, proyectosTable } from "@workspace/db";
import {
  CreateProyectoBody,
  UpdateProyectoBody,
  UpdateProyectoParams,
  GetProyectoParams,
  DeleteProyectoParams,
  ListProyectosResponse,
  GetProyectoResponse,
  UpdateProyectoResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middleware/adminAuth";

const router: IRouter = Router();

router.get("/proyectos", requireAuth, async (req, res): Promise<void> => {
  const proyectos = await db
    .select()
    .from(proyectosTable)
    .orderBy(proyectosTable.fechaActualizacion);
  res.json(ListProyectosResponse.parse(proyectos.map(p => ({
    ...p,
    fechaCreacion: p.fechaCreacion.toISOString(),
    fechaActualizacion: p.fechaActualizacion.toISOString(),
  }))));
});

router.post("/proyectos", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProyectoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [proyecto] = await db.insert(proyectosTable).values(parsed.data).returning();
  res.status(201).json(GetProyectoResponse.parse({
    ...proyecto,
    fechaCreacion: proyecto.fechaCreacion.toISOString(),
    fechaActualizacion: proyecto.fechaActualizacion.toISOString(),
  }));
});

router.get("/proyectos/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetProyectoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [proyecto] = await db
    .select()
    .from(proyectosTable)
    .where(eq(proyectosTable.id, params.data.id));
  if (!proyecto) {
    res.status(404).json({ error: "Proyecto no encontrado" });
    return;
  }
  res.json(GetProyectoResponse.parse({
    ...proyecto,
    fechaCreacion: proyecto.fechaCreacion.toISOString(),
    fechaActualizacion: proyecto.fechaActualizacion.toISOString(),
  }));
});

router.patch("/proyectos/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProyectoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProyectoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [proyecto] = await db
    .update(proyectosTable)
    .set(parsed.data)
    .where(eq(proyectosTable.id, params.data.id))
    .returning();
  if (!proyecto) {
    res.status(404).json({ error: "Proyecto no encontrado" });
    return;
  }
  res.json(UpdateProyectoResponse.parse({
    ...proyecto,
    fechaCreacion: proyecto.fechaCreacion.toISOString(),
    fechaActualizacion: proyecto.fechaActualizacion.toISOString(),
  }));
});

router.delete("/proyectos/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProyectoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [proyecto] = await db
    .delete(proyectosTable)
    .where(eq(proyectosTable.id, params.data.id))
    .returning();
  if (!proyecto) {
    res.status(404).json({ error: "Proyecto no encontrado" });
    return;
  }
  res.sendStatus(204);
});

export default router;
