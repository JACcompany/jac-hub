import { Coffee } from "lucide-react";
import { sfx } from "@/lib/ccc-timer/sound";

interface Props {
  today: number;
  weekly: number;
  onAdd: () => void;
}

export function CoffeeTracker({ today, weekly, onAdd }: Props) {
  const level = Math.min(100, today * 20);
  const status =
    today === 0 ? "Crítico ⚠️" :
    today <= 2  ? "Estable" :
    today <= 4  ? "Óptimo ⚡" :
                  "Sobrecarga 🔥";

  return (
    <div className="card-soft rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Cafeína</div>
          <div className="text-base font-mono font-semibold mt-1">Nivel actual</div>
        </div>
        <Coffee className="h-5 w-5" style={{ color: "var(--coffee)" }} />
      </div>

      <button
        onClick={() => { sfx.coffee(); onAdd(); }}
        className="w-full rounded-xl border border-border bg-muted/40 hover:bg-muted/70 py-2.5 text-sm font-medium transition flex items-center justify-center gap-2 mb-4"
      >
        Tomé café <span>☕</span>
      </button>

      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Nivel</span><span>{status}</span>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${level}%`, background: "linear-gradient(90deg, var(--coffee), #f59e0b)" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="rounded-lg bg-background/50 p-2.5 border border-border/60">
          <div className="text-xl font-mono font-semibold">{today}</div>
          <div className="text-xs text-muted-foreground">Hoy</div>
        </div>
        <div className="rounded-lg bg-background/50 p-2.5 border border-border/60">
          <div className="text-xl font-mono font-semibold">{weekly}</div>
          <div className="text-xs text-muted-foreground">Esta semana</div>
        </div>
      </div>
    </div>
  );
}
