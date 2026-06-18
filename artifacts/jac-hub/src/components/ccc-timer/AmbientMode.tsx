import { useState } from "react";
import { Cloud, CloudRain, Coffee, Keyboard, Music, VolumeX } from "lucide-react";
import { setAmbient, setAmbientVolume, type AmbientId } from "@/lib/ccc-timer/sound";

const SOUNDS = [
  { id: "lofi"  as const, label: "Lo-fi",      icon: Music },
  { id: "rain"  as const, label: "Lluvia",      icon: CloudRain },
  { id: "keys"  as const, label: "Teclado",     icon: Keyboard },
  { id: "cafe"  as const, label: "Cafetería",   icon: Coffee },
];

export function AmbientMode() {
  const [active, setActive] = useState<AmbientId>(null);
  const [vol, setVol] = useState(0.7);

  const toggle = (id: AmbientId) => {
    const next = active === id ? null : id;
    setActive(next);
    setAmbient(next);
    if (next) setAmbientVolume(vol);
  };

  return (
    <div className="card-soft rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Modo ambiente</div>
          <div className="text-base font-mono font-semibold mt-1">Atmósfera</div>
        </div>
        {active
          ? <Cloud className="h-5 w-5 text-primary animate-pulse" />
          : <VolumeX className="h-5 w-5 text-muted-foreground" />
        }
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SOUNDS.map(s => {
          const Icon = s.icon;
          const on = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                on
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="h-4 w-4" />{s.label}
            </button>
          );
        })}
      </div>
      {active && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Volumen</span><span>{Math.round(vol * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.05} value={vol}
            onChange={e => { const v = Number(e.target.value); setVol(v); setAmbientVolume(v); }}
            className="w-full accent-primary"
          />
        </div>
      )}
      <p className="text-[11px] text-muted-foreground mt-3">
        {active ? "Reproduciendo en bucle…" : "Selecciona una atmósfera"}
      </p>
    </div>
  );
}
