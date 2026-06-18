import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FocusTimer } from "@/components/ccc-timer/FocusTimer";
import { CoffeeTracker } from "@/components/ccc-timer/CoffeeTracker";
import { ProductivityChart } from "@/components/ccc-timer/ProductivityChart";
import { StatCard } from "@/components/ccc-timer/StatCard";
import { RankCard } from "@/components/ccc-timer/RankCard";
import { AmbientMode } from "@/components/ccc-timer/AmbientMode";
import { UsersTimeTable } from "@/components/ccc-timer/UsersTimeTable";
import { useStats } from "@/lib/ccc-timer/stats";
import { useIsOwner } from "@/hooks/use-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Code2, Clock, Flame, TrendingUp, Puzzle, Upload, Lock
} from "lucide-react";

const EXTENSIONS = [
  {
    id: "ccc-timer",
    nombre: "CCC Timer",
    descripcion: "Código, Curiosidad y Cafeína — Timer Pomodoro con estadísticas de sesión y ranking del equipo.",
    version: "1.0",
    autor: "JAC Studio",
    icono: "⏱️",
    activo: true,
  },
];

export default function Extensiones() {
  const isOwner = useIsOwner();
  const { stats, addCoffee, addSession, todayCoffees, weeklyCoffees } = useStats();
  const [extensionActiva, setExtensionActiva] = useState<string | null>("ccc-timer");

  const formatMinutes = (m: number) => {
    const h = Math.floor(m / 60), min = m % 60;
    if (h && min) return `${h}h ${min}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary uppercase flex items-center gap-2">
              <Puzzle className="h-7 w-7" /> Extensiones
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Herramientas integradas para el equipo JAC.
            </p>
          </div>
          {isOwner ? (
            <Button variant="outline" size="sm" className="border-primary/30 hover:border-primary/60 gap-2">
              <Upload className="h-4 w-4" /> Subir extensión
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border/40 rounded-md px-3 py-1.5">
              <Lock className="h-3.5 w-3.5" /> Solo el OWNER puede subir extensiones
            </div>
          )}
        </div>

        {/* Extension tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {EXTENSIONS.map(ext => (
            <button
              key={ext.id}
              onClick={() => setExtensionActiva(extensionActiva === ext.id ? null : ext.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                extensionActiva === ext.id
                  ? "border-primary/40 bg-primary/5 shadow-[0_0_12px_rgba(0,255,136,0.1)]"
                  : "border-border/50 bg-card/40 hover:border-primary/30 hover:bg-card/60"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{ext.icono}</span>
                <Badge variant={ext.activo ? "default" : "secondary"} className={`text-[10px] ${ext.activo ? "bg-primary/20 text-primary border-primary/30" : ""}`}>
                  {ext.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="mt-2">
                <p className="font-semibold text-sm">{ext.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ext.descripcion}</p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>v{ext.version}</span>
                <span>·</span>
                <span>{ext.autor}</span>
              </div>
            </button>
          ))}

          {/* Placeholder for future extensions */}
          {isOwner && (
            <div className="p-4 rounded-xl border border-dashed border-border/40 bg-card/20 flex flex-col items-center justify-center gap-2 min-h-[120px] text-center">
              <Upload className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground/60">Sube una nueva extensión</p>
            </div>
          )}
        </div>

        {/* CCC Timer expanded view */}
        {extensionActiva === "ccc-timer" && (
          <div className="border border-primary/20 rounded-2xl bg-card/20 overflow-hidden">
            {/* Extension header */}
            <div className="px-5 py-3 border-b border-border/40 flex items-center gap-3 bg-primary/5">
              <Code2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">CCC Timer</p>
                <p className="text-[11px] text-muted-foreground">Código, Curiosidad y Cafeína · v1.0</p>
              </div>
              <Badge className="ml-auto text-[10px] bg-primary/20 text-primary border-primary/30">
                Vinculado a tu cuenta
              </Badge>
            </div>

            <div className="p-4 md:p-6">
              <Tabs defaultValue="timer">
                <TabsList className="mb-5 bg-muted/30 border border-border/40">
                  <TabsTrigger value="timer" className="text-xs gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Timer
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="text-xs gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Mis stats
                  </TabsTrigger>
                  <TabsTrigger value="ranking" className="text-xs gap-1.5">
                    <Flame className="h-3.5 w-3.5" /> Ranking
                  </TabsTrigger>
                </TabsList>

                {/* ── TIMER TAB ── */}
                <TabsContent value="timer">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex justify-center">
                      <div className="w-full max-w-sm">
                        <FocusTimer onComplete={(mins, mode) => addSession(mins, mode)} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <CoffeeTracker today={todayCoffees} weekly={weeklyCoffees} onAdd={addCoffee} />
                      <AmbientMode />
                    </div>
                  </div>
                </TabsContent>

                {/* ── STATS TAB ── */}
                <TabsContent value="stats">
                  {stats.loading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Sesiones" value={stats.sessions} hint="total" accent="primary" icon={<Clock className="h-4 w-4" />} />
                        <StatCard label="Tiempo total" value={formatMinutes(stats.minutesCoded)} hint="programando" accent="success" />
                        <StatCard label="Racha" value={`${stats.streak}d`} hint={stats.streak > 0 ? "¡sigue así!" : "sin racha"} accent="success" icon={<Flame className="h-4 w-4" />} />
                        <StatCard label="Cafés esta semana" value={weeklyCoffees} accent="coffee" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProductivityChart data={stats.weekly} title="Minutos esta semana" />
                        <RankCard sessions={stats.sessions} />
                      </div>
                      {stats.recent.length > 0 && (
                        <div className="card-soft rounded-2xl p-4">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Sesiones recientes</p>
                          <div className="space-y-1.5">
                            {stats.recent.slice(0, 5).map(s => (
                              <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                                <div className="flex items-center gap-2">
                                  <Code2 className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-sm">{s.mode}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-mono text-primary">{s.minutes} min</span>
                                  <span>{new Date(s.at).toLocaleString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ── RANKING TAB ── */}
                <TabsContent value="ranking">
                  <UsersTimeTable />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
