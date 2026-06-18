import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bugsTable = pgTable("bugs", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  prioridad: text("prioridad").notNull().default("Media"),
  estado: text("estado").notNull().default("Abierto"),
  proyectoId: integer("proyecto_id"),
  asignadoA: text("asignado_a"),
  reportadoPor: text("reportado_por").notNull().default("Sistema"),
  fechaReporte: timestamp("fecha_reporte", { withTimezone: true }).notNull().defaultNow(),
  fechaResolucion: timestamp("fecha_resolucion", { withTimezone: true }),
});

export const insertBugSchema = createInsertSchema(bugsTable).omit({ id: true, fechaReporte: true });
export type InsertBug = z.infer<typeof insertBugSchema>;
export type Bug = typeof bugsTable.$inferSelect;
