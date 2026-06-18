import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificacionesTable = pgTable("notificaciones", {
  id: serial("id").primaryKey(),
  mensaje: text("mensaje").notNull(),
  tipo: text("tipo").notNull().default("info"),
  leida: boolean("leida").notNull().default(false),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  enlace: text("enlace"),
  usuario: text("usuario"),
});

export const insertNotificacionSchema = createInsertSchema(notificacionesTable).omit({ id: true, fecha: true });
export type InsertNotificacion = z.infer<typeof insertNotificacionSchema>;
export type Notificacion = typeof notificacionesTable.$inferSelect;
