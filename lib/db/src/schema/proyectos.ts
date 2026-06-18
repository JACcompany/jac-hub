import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const proyectosTable = pgTable("proyectos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  estado: text("estado").notNull().default("Activo"),
  progreso: integer("progreso").notNull().default(0),
  descripcion: text("descripcion").notNull().default(""),
  miembros: text("miembros").array().notNull().default([]),
  tecnologias: text("tecnologias").array().notNull().default([]),
  fechaCreacion: timestamp("fecha_creacion", { withTimezone: true }).notNull().defaultNow(),
  fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProyectoSchema = createInsertSchema(proyectosTable).omit({ id: true, fechaCreacion: true, fechaActualizacion: true });
export type InsertProyecto = z.infer<typeof insertProyectoSchema>;
export type Proyecto = typeof proyectosTable.$inferSelect;
