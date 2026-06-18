import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificacionesTable } from "@workspace/db";
import {
  MarcarNotificacionLeidaParams,
  ListNotificacionesResponse,
  MarcarNotificacionLeidaResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middleware/adminAuth";

const router: IRouter = Router();

router.get("/notificaciones", requireAuth, async (req, res): Promise<void> => {
  const notificaciones = await db
    .select()
    .from(notificacionesTable)
    .orderBy(notificacionesTable.fecha);
  res.json(ListNotificacionesResponse.parse(notificaciones.map(n => ({
    ...n,
    fecha: n.fecha.toISOString(),
  }))));
});

router.patch("/notificaciones/:id/leer", requireAuth, async (req, res): Promise<void> => {
  const params = MarcarNotificacionLeidaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [notif] = await db
    .update(notificacionesTable)
    .set({ leida: true })
    .where(eq(notificacionesTable.id, params.data.id))
    .returning();
  if (!notif) {
    res.status(404).json({ error: "Notificación no encontrada" });
    return;
  }
  res.json(MarcarNotificacionLeidaResponse.parse({
    ...notif,
    fecha: notif.fecha.toISOString(),
  }));
});

router.patch("/notificaciones/leer-todas", requireAuth, async (req, res): Promise<void> => {
  await db.update(notificacionesTable).set({ leida: true });
  res.json({ ok: true });
});

router.post("/notificaciones", requireAdmin, async (req, res): Promise<void> => {
  const { mensaje, tipo, usuario } = req.body;
  if (!mensaje || !tipo) {
    res.status(400).json({ error: "mensaje y tipo son requeridos" });
    return;
  }
  const [notif] = await db
    .insert(notificacionesTable)
    .values({ mensaje, tipo, usuario: usuario ?? null, leida: false })
    .returning();
  res.status(201).json({
    ...notif,
    fecha: notif.fecha.toISOString(),
  });
});

export default router;
