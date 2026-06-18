import { Trophy } from "lucide-react";
import { getRank } from "@/lib/ccc-timer/stats";

interface Props {
  sessions: number;
}

export function RankCard({ sessions }: Props) {
  const r = getRank(sessions);
  return (
    <div className="card-soft rounded-2xl p-5 animate-fade-up overflow-hidden relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,212,255,0.15))" }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Tu rango</div>
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="text-3xl font-mono font-semibold text-gradient">{r.name}</div>
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso</span>
            <span>{r.next ? `→ ${r.next}` : "Máximo alcanzado"}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round(r.progress * 100)}%`,
                background: "linear-gradient(90deg, #00ff88, #00d4ff)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
