import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const miembrosTable = pgTable("miembros", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  rol: text("rol").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  enLinea: boolean("en_linea").notNull().default(false),
  habilidades: text("habilidades").array().notNull().default([]),
  fechaUnion: timestamp("fecha_union", { withTimezone: true }).notNull().defaultNow(),
  proyectosActivos: integer("proyectos_activos").notNull().default(0),
});

export const insertMiembroSchema = createInsertSchema(miembrosTable).omit({ id: true, fechaUnion: true });
export type InsertMiembro = z.infer<typeof insertMiembroSchema>;
export type Miembro = typeof miembrosTable.$inferSelect;
