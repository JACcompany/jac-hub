import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.BASE_URL ?? "/";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export type PushState = "unsupported" | "default" | "subscribed" | "denied" | "loading";

export function useWebPush() {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);

  // Check current state on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        if (sub) {
          setState("subscribed");
        } else {
          const perm = Notification.permission;
          if (perm === "denied") setState("denied");
          else setState("default");
        }
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      // Get VAPID public key from API
      const keyRes = await fetch(`${BASE}api/push/vapid-public-key`);
      if (!keyRes.ok) throw new Error("No se pudo obtener la clave VAPID");
      const { publicKey } = await keyRes.json() as { publicKey: string };

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const saveRes = await fetch(`${BASE}api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });
      if (!saveRes.ok) throw new Error("Error al guardar suscripción");

      setState("subscribed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      const perm = Notification.permission;
      setState(perm === "denied" ? "denied" : "default");
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) { setState("default"); return; }

      await fetch(`${BASE}api/push/unsubscribe`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      setState("default");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al desuscribir";
      setError(msg);
      setState("subscribed");
    }
  }, []);

  return { state, error, subscribe, unsubscribe };
}
