import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, miembrosTable } from "@workspace/db";
import {
  CreateMiembroBody,
  UpdateMiembroBody,
  UpdateMiembroParams,
  ListEquipoResponse,
  UpdateMiembroResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middleware/adminAuth";

const router: IRouter = Router();

router.get("/equipo", requireAuth, async (req, res): Promise<void> => {
  const miembros = await db
    .select()
    .from(miembrosTable)
    .orderBy(miembrosTable.nombre);
  res.json(ListEquipoResponse.parse(miembros.map(m => ({
    ...m,
    fechaUnion: m.fechaUnion.toISOString(),
  }))));
});

router.post("/equipo", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateMiembroBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [miembro] = await db.insert(miembrosTable).values(parsed.data).returning();
  res.status(201).json({
    ...miembro,
    fechaUnion: miembro.fechaUnion.toISOString(),
  });
});

router.patch("/equipo/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateMiembroParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMiembroBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [miembro] = await db
    .update(miembrosTable)
    .set(parsed.data)
    .where(eq(miembrosTable.id, params.data.id))
    .returning();
  if (!miembro) {
    res.status(404).json({ error: "Miembro no encontrado" });
    return;
  }
  res.json(UpdateMiembroResponse.parse({
    ...miembro,
    fechaUnion: miembro.fechaUnion.toISOString(),
  }));
});

export default router;
