import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const timerSessionsTable = pgTable("timer_sessions", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull(),
  modo: text("modo").notNull().default("Pomodoro"),
  minutos: integer("minutos").notNull(),
  iniciadaEn: timestamp("iniciada_en", { withTimezone: true }).notNull().defaultNow(),
});

export type TimerSession = typeof timerSessionsTable.$inferSelect;
