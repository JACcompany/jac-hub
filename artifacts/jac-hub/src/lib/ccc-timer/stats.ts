import { useCallback, useEffect, useState } from "react";

export interface SessionEntry {
  id: string;
  mode: string;
  minutes: number;
  at: string;
}

export interface AggStats {
  sessions: number;
  minutesCoded: number;
  streak: number;
  weekly: number[];
  coffees: number[];
  recent: SessionEntry[];
  loading: boolean;
}

const empty: AggStats = {
  sessions: 0, minutesCoded: 0, streak: 0,
  weekly: [0,0,0,0,0,0,0], coffees: [0,0,0,0,0,0,0],
  recent: [], loading: true,
};

export function useStats() {
  const [stats, setStats] = useState<AggStats>(empty);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/extensiones/ccc-timer/stats");
      if (!res.ok) throw new Error("error");
      const data = await res.json() as AggStats;
      setStats({ ...data, loading: false });
    } catch {
      setStats({ ...empty, loading: false });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCoffee = async () => {
    await fetch("/api/extensiones/ccc-timer/cafes", { method: "POST" });
    load();
  };

  const addSession = async (minutes: number, mode = "Sesión") => {
    await fetch("/api/extensiones/ccc-timer/sesiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutos: minutes, modo: mode }),
    });
    load();
  };

  const reset = async () => {
    await fetch("/api/extensiones/ccc-timer/reset", { method: "DELETE" });
    load();
  };

  return {
    stats,
    addCoffee,
    addSession,
    reset,
    reload: load,
    todayCoffees: stats.coffees[stats.coffees.length - 1] ?? 0,
    weeklyCoffees: stats.coffees.reduce((a, b) => a + b, 0),
  };
}

export function getRank(sessions: number): { name: string; next?: string; progress: number } {
  const ranks = [
    { name: "Nuevo", min: 0 },
    { name: "Activo", min: 5 },
    { name: "Recurrente", min: 20 },
    { name: "El más activo", min: 60 },
  ];
  let current = ranks[0];
  let next: typeof ranks[number] | undefined = ranks[1];
  for (let i = 0; i < ranks.length; i++) {
    if (sessions >= ranks[i].min) { current = ranks[i]; next = ranks[i + 1]; }
  }
  const progress = next ? Math.min(1, (sessions - current.min) / (next.min - current.min)) : 1;
  return { name: current.name, next: next?.name, progress };
}

export const DEV_MESSAGES = [
  "+5 Código", "+1 Curiosidad", "Bug eliminado 🐛", "Commit exitoso ✅",
  "-20% cordura", "+10 XP de Cafeína", "Refactor legendario",
  "Deploy sin errores 🚀", "Stack Overflow innecesario", "console.log eliminado",
];

export function randomDevMessage() {
  return DEV_MESSAGES[Math.floor(Math.random() * DEV_MESSAGES.length)];
}
