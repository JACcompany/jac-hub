import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { formatTime, useTimer, type TimerMode } from "@/lib/ccc-timer/timer";
import { randomDevMessage } from "@/lib/ccc-timer/stats";
import { sfx } from "@/lib/ccc-timer/sound";

const MODES: { id: TimerMode; label: string; sub: string }[] = [
  { id: "pomodoro", label: "Pomodoro", sub: "25 min" },
  { id: "deep",     label: "Deep Work", sub: "50 min" },
  { id: "custom",   label: "Personalizado", sub: "tú decides" },
];

interface Props {
  onComplete?: (minutes: number, modeLabel: string) => void;
}

export function FocusTimer({ onComplete }: Props) {
  const t = useTimer();
  const [customMin, setCustomMin] = useState(15);
  const [flash, setFlash] = useState<string | null>(null);
  const [lastRunning, setLastRunning] = useState(false);

  useEffect(() => {
    if (lastRunning && !t.running && t.remaining === 0) {
      const mins = Math.round(t.duration / 60);
      const label = MODES.find(m => m.id === t.mode)?.label ?? "Sesión";
      onComplete?.(mins, label);
      sfx.done();
      setFlash(randomDevMessage());
      setTimeout(() => setFlash(null), 3500);
    }
    setLastRunning(t.running);
  }, [t.running, t.remaining, t.duration, t.mode, lastRunning, onComplete]);

  const size = 260;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - t.progress);

  return (
    <div className="card-soft rounded-3xl p-6 md:p-8 flex flex-col items-center gap-5 animate-fade-up">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-full max-w-xs">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { sfx.click(); t.changeMode(m.id, customMin * 60); }}
            className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-all ${
              t.mode === m.id
                ? "bg-background text-foreground shadow border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="font-medium">{m.label}</div>
            <div className="text-[10px] opacity-70">{m.sub}</div>
          </button>
        ))}
      </div>

      {/* SVG Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
          <circle
            cx={size/2} cy={size/2} r={r}
            stroke="url(#ccc-gr)" strokeWidth={stroke} strokeLinecap="round" fill="none"
            strokeDasharray={c} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          <defs>
            <linearGradient id="ccc-gr" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00ff88" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center time */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-4xl md:text-5xl font-mono tabular-nums font-bold text-foreground">
            {formatTime(t.remaining)}
          </span>
          <span className="text-xs text-muted-foreground">{MODES.find(m => m.id === t.mode)?.label}</span>
          {flash && (
            <span className="text-[11px] text-primary animate-fade-up font-mono mt-1">{flash}</span>
          )}
        </div>
      </div>

      {/* Custom duration */}
      {t.mode === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="number" min={1} max={180} value={customMin}
            onChange={e => setCustomMin(Number(e.target.value))}
            onBlur={() => t.changeMode("custom", customMin * 60)}
            className="w-20 text-center rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-sm focus:outline-none focus:border-primary/60"
          />
          <span className="text-sm text-muted-foreground">minutos</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => { sfx.click(); t.reset(); }}
          className="p-2 rounded-full hover:bg-muted/40 transition text-muted-foreground hover:text-foreground"
          title="Reiniciar"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          onClick={() => { t.running ? sfx.pause() : sfx.start(); t.toggle(); }}
          disabled={t.remaining === 0 && !t.running}
          className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary hover:bg-primary/20 transition flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.3)] disabled:opacity-40"
        >
          {t.running
            ? <Pause className="h-6 w-6 text-primary" />
            : <Play className="h-6 w-6 text-primary ml-0.5" />
          }
        </button>

        <div className="w-9" />
      </div>
    </div>
  );
}
