import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const comentariosTareaTable = pgTable("comentarios_tarea", {
  id: serial("id").primaryKey(),
  tareaId: integer("tarea_id").notNull(),
  autorId: integer("autor_id"),
  autorNombre: text("autor_nombre").notNull(),
  autorEmail: text("autor_email").notNull(),
  contenido: text("contenido").notNull(),
  fechaCreacion: timestamp("fecha_creacion", { withTimezone: true }).notNull().defaultNow(),
});

export type ComentarioTarea = typeof comentariosTareaTable.$inferSelect;
