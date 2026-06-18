import type { Request, Response, NextFunction } from "express";
import { db, usuariosTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "gael@jac.dev";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const usuarioId = req.cookies?.session_usuario_id;
  if (!usuarioId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const [usuario] = await db
    .select()
    .from(usuariosTable)
    .where(eq(usuariosTable.id, parseInt(usuarioId, 10)));

  if (!usuario) {
    res.clearCookie("session_usuario_id");
    res.status(401).json({ error: "Sesión expirada" });
    return;
  }

  (req as any).usuario = usuario;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const usuarioId = req.cookies?.session_usuario_id;
  if (!usuarioId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const [usuario] = await db
    .select()
    .from(usuariosTable)
    .where(eq(usuariosTable.id, parseInt(usuarioId, 10)));

  if (!usuario) {
    res.clearCookie("session_usuario_id");
    res.status(401).json({ error: "Sesión expirada" });
    return;
  }

  if (usuario.email !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Acceso denegado. Solo el administrador puede realizar esta acción." });
    return;
  }

  (req as any).usuario = usuario;
  next();
}
