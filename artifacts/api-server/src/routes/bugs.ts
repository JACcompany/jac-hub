import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, bugsTable } from "@workspace/db";
import {
  CreateBugBody,
  UpdateBugBody,
  UpdateBugParams,
  DeleteBugParams,
  ListBugsQueryParams,
  ListBugsResponse,
  UpdateBugResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middleware/adminAuth";

const router: IRouter = Router();

router.get("/bugs", requireAuth, async (req, res): Promise<void> => {
  const qp = ListBugsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }
  const conditions = [];
  if (qp.data.proyectoId != null) conditions.push(eq(bugsTable.proyectoId, qp.data.proyectoId));
  if (qp.data.prioridad) conditions.push(eq(bugsTable.prioridad, qp.data.prioridad));
  if (qp.data.estado) conditions.push(eq(bugsTable.estado, qp.data.estado));

  const bugs = conditions.length > 0
    ? await db.select().from(bugsTable).where(and(...conditions)).orderBy(bugsTable.fechaReporte)
    : await db.select().from(bugsTable).orderBy(bugsTable.fechaReporte);

  res.json(ListBugsResponse.parse(bugs.map(b => ({
    ...b,
    fechaReporte: b.fechaReporte.toISOString(),
    fechaResolucion: b.fechaResolucion ? b.fechaResolucion.toISOString() : null,
  }))));
});

router.post("/bugs", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateBugBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [bug] = await db.insert(bugsTable).values(parsed.data).returning();
  res.status(201).json({
    ...bug,
    fechaReporte: bug.fechaReporte.toISOString(),
    fechaResolucion: bug.fechaResolucion ? bug.fechaResolucion.toISOString() : null,
  });
});

router.patch("/bugs/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateBugParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBugBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { fechaResolucion: fr, ...restBugUpdate } = parsed.data;
  const [bug] = await db
    .update(bugsTable)
    .set({ ...restBugUpdate, ...(fr ? { fechaResolucion: new Date(fr) } : {}) })
    .where(eq(bugsTable.id, params.data.id))
    .returning();
  if (!bug) {
    res.status(404).json({ error: "Bug no encontrado" });
    return;
  }
  res.json(UpdateBugResponse.parse({
    ...bug,
    fechaReporte: bug.fechaReporte.toISOString(),
    fechaResolucion: bug.fechaResolucion ? bug.fechaResolucion.toISOString() : null,
  }));
});

router.delete("/bugs/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteBugParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [bug] = await db
    .delete(bugsTable)
    .where(eq(bugsTable.id, params.data.id))
    .returning();
  if (!bug) {
    res.status(404).json({ error: "Bug no encontrado" });
    return;
  }
  res.sendStatus(204);
});

export default router;
