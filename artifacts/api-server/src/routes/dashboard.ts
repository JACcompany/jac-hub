import { Router, type IRouter } from "express";
import { eq, and, gte, count } from "drizzle-orm";
import { db, proyectosTable, tareasTable, bugsTable, miembrosTable, buildsTable } from "@workspace/db";
import { requireAuth } from "../middleware/adminAuth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - 7);

  const [
    [{ value: proyectosActivos }],
    [{ value: miembrosConectados }],
    [{ value: bugsAbiertos }],
    [{ value: totalTareas }],
    [{ value: tareasCompletadasSemana }],
    [{ value: totalBuilds }],
    proyectos,
    bugsCrudos,
  ] = await Promise.all([
    db.select({ value: count() }).from(proyectosTable).where(eq(proyectosTable.estado, "Activo")),
    db.select({ value: count() }).from(miembrosTable).where(eq(miembrosTable.enLinea, true)),
    db.select({ value: count() }).from(bugsTable).where(eq(bugsTable.estado, "Abierto")),
    db.select({ value: count() }).from(tareasTable),
    db.select({ value: count() }).from(tareasTable).where(and(eq(tareasTable.columna, "Completado"), gte(tareasTable.fechaCreacion, inicioSemana))),
    db.select({ value: count() }).from(buildsTable),
    db.select({ nombre: proyectosTable.nombre, progreso: proyectosTable.progreso }).from(proyectosTable).where(eq(proyectosTable.estado, "Activo")),
    db.select({ prioridad: bugsTable.prioridad }).from(bugsTable),
  ]);

  const prioridadMap: Record<string, number> = { "Crítica": 0, "Alta": 0, "Media": 0, "Baja": 0 };
  for (const { prioridad } of bugsCrudos) {
    if (prioridad in prioridadMap) prioridadMap[prioridad]++;
  }
  const bugsPorPrioridad = Object.entries(prioridadMap).map(([prioridad, cantidad]) => ({ prioridad, cantidad }));

  res.json({
    proyectosActivos: Number(proyectosActivos),
    miembrosConectados: Number(miembrosConectados),
    bugsAbiertos: Number(bugsAbiertos),
    tareasCompletadasSemana: Number(tareasCompletadasSemana),
    totalTareas: Number(totalTareas),
    totalBuilds: Number(totalBuilds),
    progresoPorProyecto: proyectos,
    bugsPorPrioridad,
  });
});

export default router;
