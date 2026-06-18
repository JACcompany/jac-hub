import { Router, type IRouter } from "express";
import webpush from "web-push";
import { db, pushSubscriptionsTable, notificacionesTable, usuariosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/adminAuth";

const router: IRouter = Router();

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:gael@jac.dev",
  process.env.VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

// GET /push/vapid-public-key — return public key for frontend subscription
router.get("/push/vapid-public-key", requireAuth, (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? "" });
});

// POST /push/subscribe — save a push subscription for the current user
router.post("/push/subscribe", requireAuth, async (req, res): Promise<void> => {
  const { endpoint, keys } = req.body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Suscripción incompleta" });
    return;
  }

  const usuarioId = (req as any).usuario?.id as number | undefined;
  if (!usuarioId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  // Upsert: update if endpoint exists, insert if not
  const existing = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.endpoint, endpoint));

  if (existing.length > 0) {
    await db
      .update(pushSubscriptionsTable)
      .set({ p256dh: keys.p256dh, auth: keys.auth, usuarioId })
      .where(eq(pushSubscriptionsTable.endpoint, endpoint));
  } else {
    await db.insert(pushSubscriptionsTable).values({
      usuarioId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });
  }

  res.status(201).json({ ok: true });
});

// DELETE /push/unsubscribe — remove subscription
router.delete("/push/unsubscribe", requireAuth, async (req, res): Promise<void> => {
  const { endpoint } = req.body as { endpoint: string };
  if (!endpoint) {
    res.status(400).json({ error: "endpoint requerido" });
    return;
  }
  await db
    .delete(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.endpoint, endpoint));
  res.json({ ok: true });
});

// POST /push/broadcast — admin sends push to all subscribed users
router.post("/push/broadcast", requireAdmin, async (req, res): Promise<void> => {
  const { titulo, mensaje, url } = req.body as {
    titulo: string;
    mensaje: string;
    url?: string;
  };

  if (!titulo || !mensaje) {
    res.status(400).json({ error: "titulo y mensaje son requeridos" });
    return;
  }

  const subs = await db.select().from(pushSubscriptionsTable);

  const payload = JSON.stringify({
    title: titulo,
    body: mensaje,
    url: url ?? "/",
    icon: "/icon-192.svg",
    badge: "/favicon.svg",
  });

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const sent = results.filter(r => r.status === "fulfilled").length;
  const failed = results.filter(r => r.status === "rejected").length;

  res.json({ sent, failed, total: subs.length });
});

// Internal: send push to a specific user by email (used from websocket.ts)
export async function sendPushToUser(email: string, titulo: string, mensaje: string, url?: string) {
  const [usuario] = await db
    .select()
    .from(usuariosTable)
    .where(eq(usuariosTable.email, email));
  if (!usuario) return;

  const subs = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.usuarioId, usuario.id));

  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: titulo,
    body: mensaje,
    url: url ?? "/",
    icon: "/icon-192.svg",
    badge: "/favicon.svg",
  });

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );
}

export default router;
