import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const mensajesChatTable = pgTable("mensajes_chat", {
  id: serial("id").primaryKey(),
  contenido: text("contenido").notNull(),
  autorId: integer("autor_id"),
  autorNombre: text("autor_nombre").notNull(),
  autorEmail: text("autor_email").notNull(),
  sala: text("sala").notNull().default("general"),
  fechaEnvio: timestamp("fecha_envio", { withTimezone: true }).notNull().defaultNow(),
});

export type MensajeChat = typeof mensajesChatTable.$inferSelect;
