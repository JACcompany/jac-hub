import { useEffect, useRef } from "react";

/**
 * Polls the notifications API every 30 s and fires native OS popups
 * via window.electronAPI when the app is running inside Electron and
 * the window is not focused.
 *
 * Runs globally from AppLayout so every page benefits automatically.
 */
export function useDesktopNotifications() {
  const knownIdsRef = useRef<Set<number>>(new Set());
  const readyRef = useRef(false);

  const checkNotifications = async () => {
    if (!window.electronAPI) return;

    try {
      const res = await fetch("/api/notificaciones");
      if (!res.ok) return;
      const data: Array<{ id: number; leida: boolean; mensaje: string }> = await res.json();

      const unread = data.filter(n => !n.leida);

      // First load: snapshot without popping
      if (!readyRef.current) {
        unread.forEach(n => knownIdsRef.current.add(n.id));
        readyRef.current = true;
        return;
      }

      const nuevas = unread.filter(n => !knownIdsRef.current.has(n.id));
      if (nuevas.length === 0) return;

      nuevas.forEach(n => knownIdsRef.current.add(n.id));

      // Only pop when the window is in the background
      if (document.hasFocus()) return;

      if (nuevas.length === 1) {
        window.electronAPI.notify("JAC Hub 🔔", nuevas[0].mensaje ?? "Nueva notificación");
      } else {
        window.electronAPI.notify(
          "JAC Hub 🔔",
          `${nuevas.length} notificaciones nuevas sin leer`,
        );
      }
    } catch { /* network error — silently skip */ }
  };

  useEffect(() => {
    // Run once on mount, then every 30 s
    checkNotifications();
    const timer = setInterval(checkNotifications, 30_000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
