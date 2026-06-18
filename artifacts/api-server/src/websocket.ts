import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import { db, mensajesChatTable, usuariosTable, notificacionesTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { logger } from "./lib/logger";

const OWNER_EMAIL = "gael@jac.dev";

// INFO channels: only owner can write → triggers notification for all users
const INFO_SALAS = ["anuncios"];
// BLOQUEADAS channels: nobody can write (system/auto only)
const BLOQUEADAS_SALAS = ["bienvenidas"];

type AuthWS = WebSocket & {
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  sala: string;
  isAlive: boolean;
};

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(";").forEach(c => {
    const [k, ...v] = c.trim().split("=");
    if (k) out[k.trim()] = decodeURIComponent(v.join("=").trim());
  });
  return out;
}

function broadcast(wss: WebSocketServer, sala: string, data: object, exclude: WebSocket | null) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    const c = client as AuthWS;
    if (c !== exclude && c.sala === sala && c.readyState === WebSocket.OPEN) {
      c.send(payload);
    }
  });
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req: IncomingMessage, socket: any, head: any) => {
    if (!req.url?.startsWith("/api/ws/chat")) {
      socket.destroy();
      return;
    }

    const cookies = parseCookies(req.headers.cookie ?? "");
    const sessionId = cookies["session_usuario_id"];
    if (!sessionId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const [usuario] = await db.select().from(usuariosTable).where(eq(usuariosTable.id, parseInt(sessionId, 10)));
    if (!usuario) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const url = new URL(req.url, "http://localhost");
    const sala = url.searchParams.get("sala") ?? "general";

    wss.handleUpgrade(req, socket, head, ws => {
      const authWs = ws as AuthWS;
      authWs.usuarioId = usuario.id;
      authWs.usuarioNombre = usuario.nombre;
      authWs.usuarioEmail = usuario.email;
      authWs.sala = sala;
      authWs.isAlive = true;
      wss.emit("connection", authWs, req);
    });
  });

  const heartbeat = setInterval(() => {
    wss.clients.forEach(ws => {
      const c = ws as AuthWS;
      if (!c.isAlive) { c.terminate(); return; }
      c.isAlive = false;
      c.ping();
    });
  }, 30_000);

  wss.on("connection", (ws, _req) => {
    const authWs = ws as AuthWS;
    logger.info({ sala: authWs.sala, usuario: authWs.usuarioNombre }, "WS connected");

    broadcast(wss, authWs.sala, {
      tipo: "sistema",
      mensaje: `${authWs.usuarioNombre} se conectó`,
      sala: authWs.sala,
    }, null);

    authWs.on("pong", () => { authWs.isAlive = true; });

    authWs.on("message", async data => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.tipo !== "mensaje" || !String(msg.contenido ?? "").trim()) return;

        const sala = authWs.sala;
        const isOwner = authWs.usuarioEmail === OWNER_EMAIL;

        // Fully blocked channels (auto-only, nobody can write)
        if (BLOQUEADAS_SALAS.includes(sala)) {
          authWs.send(JSON.stringify({
            tipo: "error",
            mensaje: "Este canal es de solo lectura.",
          }));
          return;
        }

        // Info channels: only owner can write
        if (INFO_SALAS.includes(sala) && !isOwner) {
          authWs.send(JSON.stringify({
            tipo: "error",
            mensaje: "Solo el OWNER puede escribir en canales de información.",
          }));
          return;
        }

        const contenido = String(msg.contenido).slice(0, 2000).trim();
        const [saved] = await db.insert(mensajesChatTable).values({
          contenido,
          autorId: authWs.usuarioId,
          autorNombre: authWs.usuarioNombre,
          autorEmail: authWs.usuarioEmail,
          sala,
        }).returning();

        broadcast(wss, sala, {
          tipo: "mensaje",
          id: saved.id,
          contenido: saved.contenido,
          autorNombre: saved.autorNombre,
          autorEmail: saved.autorEmail,
          sala: saved.sala,
          fechaEnvio: saved.fechaEnvio.toISOString(),
        }, null);

        // Owner posts in info channel → global notification for all users
        if (isOwner && INFO_SALAS.includes(sala)) {
          const preview = contenido.length > 80 ? contenido.slice(0, 80) + "…" : contenido;
          const todos = await db
            .select({ email: usuariosTable.email })
            .from(usuariosTable)
            .where(ne(usuariosTable.email, OWNER_EMAIL));

          await Promise.all(
            todos.map(u =>
              db.insert(notificacionesTable).values({
                mensaje: `📢 Nuevo anuncio en #${sala}: "${preview}"`,
                tipo: "info",
                enlace: "/chat",
                usuario: u.email,
              })
            )
          );
          logger.info({ sala, usuarios: todos.length }, "Notificaciones de anuncio enviadas");
        }
      } catch (err) {
        logger.warn({ err }, "WS message error");
      }
    });

    authWs.on("close", () => {
      broadcast(wss, authWs.sala, {
        tipo: "sistema",
        mensaje: `${authWs.usuarioNombre} se desconectó`,
        sala: authWs.sala,
      }, null);
    });

    authWs.on("error", err => {
      logger.warn({ err }, "WS error");
    });
  });

  wss.on("close", () => clearInterval(heartbeat));
  return wss;
}
