import { Router, type IRouter } from "express";
import { db, mensajesChatTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/adminAuth";

const router: IRouter = Router();

router.get("/chat/mensajes", requireAuth, async (req, res): Promise<void> => {
  const sala = String(req.query.sala ?? "general");
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const mensajes = await db
    .select()
    .from(mensajesChatTable)
    .where(eq(mensajesChatTable.sala, sala))
    .orderBy(desc(mensajesChatTable.fechaEnvio))
    .limit(limit);

  res.json(mensajes.reverse().map(m => ({
    ...m,
    fechaEnvio: m.fechaEnvio.toISOString(),
  })));
});

export default router;
