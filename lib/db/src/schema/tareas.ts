import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tareasTable = pgTable("tareas", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  columna: text("columna").notNull().default("Pendiente"),
  prioridad: text("prioridad").notNull().default("Media"),
  proyectoId: integer("proyecto_id"),
  asignadoA: text("asignado_a"),
  creadoPor: text("creado_por"),
  etiquetas: text("etiquetas").array().notNull().default([]),
  fechaCreacion: timestamp("fecha_creacion", { withTimezone: true }).notNull().defaultNow(),
  fechaLimite: timestamp("fecha_limite", { withTimezone: true }),
});

export const insertTareaSchema = createInsertSchema(tareasTable).omit({ id: true, fechaCreacion: true });
export type InsertTarea = z.infer<typeof insertTareaSchema>;
export type Tarea = typeof tareasTable.$inferSelect;
