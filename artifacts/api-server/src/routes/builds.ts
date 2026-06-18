import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, buildsTable } from "@workspace/db";
import {
  CreateBuildBody,
  UpdateBuildBody,
  UpdateBuildParams,
  ListBuildsQueryParams,
  ListBuildsResponse,
  UpdateBuildResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middleware/adminAuth";

const router: IRouter = Router();

router.get("/builds", requireAuth, async (req, res): Promise<void> => {
  const qp = ListBuildsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }
  const builds = qp.data.proyectoId != null
    ? await db.select().from(buildsTable).where(eq(buildsTable.proyectoId, qp.data.proyectoId)).orderBy(buildsTable.fechaSubida)
    : await db.select().from(buildsTable).orderBy(buildsTable.fechaSubida);

  res.json(ListBuildsResponse.parse(builds.map(b => ({
    ...b,
    fechaSubida: b.fechaSubida.toISOString(),
  }))));
});

router.post("/builds", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateBuildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [build] = await db.insert(buildsTable).values(parsed.data).returning();
  res.status(201).json({
    ...build,
    fechaSubida: build.fechaSubida.toISOString(),
  });
});

router.patch("/builds/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateBuildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBuildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [build] = await db
    .update(buildsTable)
    .set(parsed.data)
    .where(eq(buildsTable.id, params.data.id))
    .returning();
  if (!build) {
    res.status(404).json({ error: "Build no encontrada" });
    return;
  }
  res.json(UpdateBuildResponse.parse({
    ...build,
    fechaSubida: build.fechaSubida.toISOString(),
  }));
});

export default router;
