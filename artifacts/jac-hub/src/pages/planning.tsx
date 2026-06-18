import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListTareas, useListProyectos } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, Zap, CheckCircle2, Clock, Lightbulb, TrendingUp } from "lucide-react";
import { isWithinInterval, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

const COLUMNA_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  "Ideas":       { label: "Ideas",      color: "text-purple-400 border-purple-400/30 bg-purple-500/10", icon: <Lightbulb className="h-4 w-4" /> },
  "Pendiente":   { label: "Pendiente",  color: "text-muted-foreground border-border/40 bg-muted/10", icon: <Clock className="h-4 w-4" /> },
  "En Progreso": { label: "En Progreso",color: "text-secondary border-secondary/30 bg-secondary/10", icon: <Zap className="h-4 w-4" /> },
  "Testing":     { label: "Testing",    color: "text-orange-400 border-orange-400/30 bg-orange-500/10", icon: <TrendingUp className="h-4 w-4" /> },
  "Completado":  { label: "Completado", color: "text-primary border-primary/30 bg-primary/10", icon: <CheckCircle2 className="h-4 w-4" /> },
};

const PRIORIDAD_DOT: Record<string, string> = {
  "Crítica": "bg-destructive",
  "Alta":    "bg-orange-400",
  "Media":   "bg-yellow-400",
  "Baja":    "bg-primary",
};

export default function Planning() {
  const { data: tareas, isLoading: loadingTareas } = useListTareas();
  const { data: proyectos } = useListProyectos();

  const hoy = startOfDay(new Date());
  const semanaInicio = startOfWeek(hoy, { locale: es });
  const semanaFin = endOfWeek(hoy, { locale: es });
  const proximaSemanaFin = endOfDay(addDays(semanaFin, 7));

  const { sprint, backlog, completado, vencenEsta, vencenProxima, stats } = useMemo(() => {
    if (!tareas) return { sprint: [], backlog: [], completado: [], vencenEsta: [], vencenProxima: [], stats: { total: 0, completadas: 0, enProgreso: 0, ideas: 0 } };

    const sprint = tareas.filter(t => t.columna === "En Progreso" || t.columna === "Testing");
    const backlog = tareas.filter(t => t.columna === "Ideas" || t.columna === "Pendiente");
    const completado = tareas.filter(t => t.columna === "Completado");
    const vencenEsta = tareas.filter(t => t.fechaLimite && isWithinInterval(new Date(t.fechaLimite), { start: semanaInicio, end: semanaFin }));
    const vencenProxima = tareas.filter(t => t.fechaLimite && isWithinInterval(new Date(t.fechaLimite), { start: addDays(semanaFin, 1), end: proximaSemanaFin }));

    return {
      sprint, backlog, completado, vencenEsta, vencenProxima,
      stats: {
        total: tareas.length,
        completadas: completado.length,
        enProgreso: sprint.length,
        ideas: backlog.filter(t => t.columna === "Ideas").length,
      }
    };
  }, [tareas, semanaInicio, semanaFin, proximaSemanaFin]);

  const completionRate = stats.total > 0 ? Math.round((stats.completadas / stats.total) * 100) : 0;

  const getProyectoNombre = (proyectoId?: number | null) =>
    proyectos?.find(p => p.id === proyectoId)?.nombre ?? null;

  const TareaCard = ({ tarea }: { tarea: any }) => {
    const col = COLUMNA_CONFIG[tarea.columna] ?? COLUMNA_CONFIG["Pendiente"];
    const proyecto = getProyectoNombre(tarea.proyectoId);
    return (
      <div className={`p-2.5 rounded-lg border ${col.color} flex items-start gap-2`}>
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORIDAD_DOT[tarea.prioridad] ?? "bg-muted"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-2">{tarea.titulo}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {proyecto && <span className="text-[10px] text-muted-foreground truncate">{proyecto}</span>}
            {tarea.asignadoA && <span className="text-[10px] text-secondary/80">→ {tarea.asignadoA}</span>}
            {tarea.fechaLimite && (
              <span className="text-[10px] text-orange-400/80">
                {new Date(tarea.fechaLimite).toLocaleDateString("es", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-transparent bg-background/30 flex-shrink-0">
          {col.icon}
        </Badge>
      </div>
    );
  };

  if (loadingTareas) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Planning</h1>
          <p className="text-muted-foreground">Vista de sprint semanal y progreso del equipo.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total tareas", value: stats.total, color: "text-foreground" },
            { label: "En progreso", value: stats.enProgreso, color: "text-secondary" },
            { label: "Completadas", value: stats.completadas, color: "text-primary" },
            { label: "Tasa de compl.", value: `${completionRate}%`, color: completionRate >= 70 ? "text-primary" : completionRate >= 40 ? "text-yellow-400" : "text-destructive" },
          ].map(s => (
            <Card key={s.label} className="border-border/50 bg-card/40">
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso global del sprint</span>
              <span>{completionRate}%</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(0,255,136,0.4)]"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Deadlines this week */}
        {vencenEsta.length > 0 && (
          <Card className="border-orange-400/30 bg-orange-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Vencen esta semana ({vencenEsta.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {vencenEsta.map(t => <TareaCard key={t.id} tarea={t} />)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sprint activo */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-secondary" />
              <h2 className="font-semibold text-secondary uppercase tracking-wide text-sm">Sprint Activo</h2>
              <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-[10px]">{sprint.length}</Badge>
            </div>
            <div className="space-y-2">
              {sprint.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">Sin tareas en progreso</p>
              ) : (
                sprint.map(t => <TareaCard key={t.id} tarea={t} />)
              )}
            </div>
          </div>

          {/* Backlog */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-muted-foreground uppercase tracking-wide text-sm">Backlog</h2>
              <Badge variant="secondary" className="text-[10px]">{backlog.length}</Badge>
            </div>
            <div className="space-y-2">
              {backlog.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">Backlog vacío</p>
              ) : (
                backlog.map(t => <TareaCard key={t.id} tarea={t} />)
              )}
            </div>
          </div>

          {/* Completado */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-primary uppercase tracking-wide text-sm">Completado</h2>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">{completado.length}</Badge>
            </div>
            <div className="space-y-2">
              {completado.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">Nada completado aún</p>
              ) : (
                completado.slice(0, 10).map(t => <TareaCard key={t.id} tarea={t} />)
              )}
              {completado.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">+{completado.length - 10} más</p>
              )}
            </div>
          </div>
        </div>

        {/* Próxima semana */}
        {vencenProxima.length > 0 && (
          <Card className="border-border/40 bg-card/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Vencen la próxima semana ({vencenProxima.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {vencenProxima.map(t => <TareaCard key={t.id} tarea={t} />)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
