import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const buildsTable = pgTable("builds", {
  id: serial("id").primaryKey(),
  version: text("version").notNull(),
  estado: text("estado").notNull().default("Beta"),
  descripcion: text("descripcion"),
  changelog: text("changelog"),
  proyectoId: integer("proyecto_id"),
  subidoPor: text("subido_por").notNull().default("Sistema"),
  fechaSubida: timestamp("fecha_subida", { withTimezone: true }).notNull().defaultNow(),
  tamano: text("tamano").notNull().default("0 MB"),
  plataforma: text("plataforma").notNull().default("PC"),
  descargas: integer("descargas").notNull().default(0),
});

export const insertBuildSchema = createInsertSchema(buildsTable).omit({ id: true, fechaSubida: true });
export type InsertBuild = z.infer<typeof insertBuildSchema>;
export type Build = typeof buildsTable.$inferSelect;
