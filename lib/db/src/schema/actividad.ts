import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const actividadTable = pgTable("actividad", {
  id: serial("id").primaryKey(),
  mensaje: text("mensaje").notNull(),
  tipo: text("tipo").notNull().default("info"),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  usuario: text("usuario").notNull().default("Sistema"),
  avatar: text("avatar"),
});

export const insertActividadSchema = createInsertSchema(actividadTable).omit({ id: true, fecha: true });
export type InsertActividad = z.infer<typeof insertActividadSchema>;
export type Actividad = typeof actividadTable.$inferSelect;
