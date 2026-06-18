import { db, usuariosTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { logger } from "./logger";

const ADMIN = {
  nombre: "Gael",
  email: "gael@jac.dev",
  password: "jac2024",
  rol: "Admin",
  avatar: null,
} as const;

export async function seedAdminIfNeeded(): Promise<void> {
  try {
    const [{ value }] = await db.select({ value: count() }).from(usuariosTable);
    if (Number(value) > 0) return;

    await db.insert(usuariosTable).values(ADMIN);
    logger.info({ email: ADMIN.email }, "Admin user seeded");
  } catch (err) {
    logger.error({ err }, "Failed to seed admin user");
  }
}
