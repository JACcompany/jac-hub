import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const timerCoffeesTable = pgTable("timer_coffees", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull(),
  en: timestamp("en", { withTimezone: true }).notNull().defaultNow(),
});

export type TimerCoffee = typeof timerCoffeesTable.$inferSelect;
