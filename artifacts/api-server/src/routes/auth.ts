import { Router, type IRouter } from "express";
import { eq, ne } from "drizzle-orm";
import { db, usuariosTable, mensajesChatTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../middleware/adminAuth";

const ADMIN_EMAIL = "gael@jac.dev";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [usuario] = await db
    .select()
    .from(usuariosTable)
    .where(eq(usuariosTable.email, email));

  if (!usuario || usuario.password !== password) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  await db
    .update(usuariosTable)
    .set({ enLinea: true })
    .where(eq(usuariosTable.id, usuario.id));

  // Primera vez — enviar mensaje de bienvenida en el canal #bienvenidas
  if (!usuario.bienvenido) {
    const welcome = `Hola ${usuario.nombre} bienvenido a este gran servidor, aquí, formas parte de JAC (Juega, aprende y crea), si, no se me ocurrio un mejor nombre, somos un equipo de desarolladores con poco presupuesto y un gran sueño, recuerda, creamos con Cødigo, curiosidad y mucha cafeina (CCC), ayudanos a cumplir este sueño!`;
    await db.insert(mensajesChatTable).values({
      contenido: welcome,
      autorNombre: "JAC Sistema",
      autorEmail: "system@jac.dev",
      sala: "bienvenidas",
    });
    await db
      .update(usuariosTable)
      .set({ bienvenido: true })
      .where(eq(usuariosTable.id, usuario.id));
  }

  res.cookie("session_usuario_id", String(usuario.id), {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
  });

  res.json({
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      avatar: usuario.avatar,
      enLinea: true,
    },
    token: `demo-token-${usuario.id}`,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const usuarioId = req.cookies?.session_usuario_id;
  if (usuarioId) {
    await db
      .update(usuariosTable)
      .set({ enLinea: false })
      .where(eq(usuariosTable.id, parseInt(usuarioId, 10)));
  }
  res.clearCookie("session_usuario_id");
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
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

  res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    avatar: usuario.avatar,
    enLinea: usuario.enLinea,
  });
});

// Gestión de usuarios — solo administrador
router.get("/auth/usuarios", requireAdmin, async (req, res): Promise<void> => {
  const usuarios = await db
    .select({
      id: usuariosTable.id,
      nombre: usuariosTable.nombre,
      email: usuariosTable.email,
      rol: usuariosTable.rol,
      enLinea: usuariosTable.enLinea,
      fechaCreacion: usuariosTable.fechaCreacion,
    })
    .from(usuariosTable)
    .orderBy(usuariosTable.nombre);

  res.json(usuarios.map(u => ({
    ...u,
    fechaCreacion: u.fechaCreacion.toISOString(),
  })));
});

router.post("/auth/usuarios", requireAdmin, async (req, res): Promise<void> => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password) {
    res.status(400).json({ error: "nombre, email y password son requeridos" });
    return;
  }

  const [existente] = await db
    .select({ id: usuariosTable.id })
    .from(usuariosTable)
    .where(eq(usuariosTable.email, email));

  if (existente) {
    res.status(409).json({ error: "Ya existe un usuario con ese correo" });
    return;
  }

  const [usuario] = await db
    .insert(usuariosTable)
    .values({ nombre, email, password, rol: rol ?? "Programador" })
    .returning({
      id: usuariosTable.id,
      nombre: usuariosTable.nombre,
      email: usuariosTable.email,
      rol: usuariosTable.rol,
      enLinea: usuariosTable.enLinea,
      fechaCreacion: usuariosTable.fechaCreacion,
    });

  res.status(201).json({
    ...usuario,
    fechaCreacion: usuario.fechaCreacion.toISOString(),
  });
});

router.delete("/auth/usuarios/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [target] = await db
    .select({ email: usuariosTable.email })
    .from(usuariosTable)
    .where(eq(usuariosTable.id, id));

  if (!target) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  if (target.email === ADMIN_EMAIL) {
    res.status(403).json({ error: "No puedes eliminar la cuenta de administrador principal" });
    return;
  }

  await db.delete(usuariosTable).where(eq(usuariosTable.id, id));
  res.sendStatus(204);
});

export default router;
