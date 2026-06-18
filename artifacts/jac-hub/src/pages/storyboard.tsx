import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListTareas } from "@workspace/api-client-react";
import { useCurrentUser } from "@/hooks/use-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, CheckCircle2, Clock, Zap, FlaskConical, Lightbulb } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const COLUMNA_CFG: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  "Ideas":       { icon: Lightbulb,    color: "text-purple-400",          bg: "border-purple-500/40 bg-purple-500/5" },
  "Pendiente":   { icon: Clock,        color: "text-muted-foreground",     bg: "border-border/40 bg-card/30" },
  "En Progreso": { icon: Zap,          color: "text-secondary",            bg: "border-secondary/40 bg-secondary/5" },
  "Testing":     { icon: FlaskConical, color: "text-orange-400",           bg: "border-orange-400/40 bg-orange-400/5" },
  "Completado":  { icon: CheckCircle2, color: "text-primary",              bg: "border-primary/40 bg-primary/5" },
};

const PRIORIDAD_COLOR: Record<string, string> = {
  "Crítica": "bg-destructive/20 text-destructive border-destructive/30",
  "Alta":    "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Media":   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Baja":    "bg-primary/10 text-primary border-primary/20",
};

const COLUMNAS = ["En Progreso", "Pendiente", "Testing", "Ideas", "Completado"];

export default function TareasPersonales() {
  const { data: todasTareas, isLoading } = useListTareas();
  const currentUser = useCurrentUser();

  const misTareas = useMemo(() => {
    if (!todasTareas || !currentUser) return [];
    return todasTareas.filter(t =>
      t.asignadoA &&
      t.asignadoA.toLowerCase() === currentUser.nombre.toLowerCase()
    );
  }, [todasTareas, currentUser]);

  const tareasPorColumna = useMemo(() =>
    COLUMNAS.reduce((acc, col) => {
      acc[col] = misTareas.filter(t => t.columna === col);
      return acc;
    }, {} as Record<string, typeof misTareas>),
    [misTareas]
  );

  const total = misTareas.length;
  const completadas = misTareas.filter(t => t.columna === "Completado").length;
  const enProgreso = misTareas.filter(t => t.columna === "En Progreso").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase flex items-center gap-2">
            <ClipboardList className="h-7 w-7" />
            Tareas Personales
          </h1>
          <p className="text-muted-foreground">Tareas asignadas a {currentUser?.nombre ?? "ti"}.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : misTareas.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Sin tareas asignadas</h3>
            <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
              Cuando alguien te asigne una tarea, aparecerá aquí.
            </p>
          </div>
        ) : (
          <>
            {/* Stats rápidas */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card/40 border border-border/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total</p>
              </div>
              <div className="bg-secondary/5 border border-secondary/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-secondary">{enProgreso}</p>
                <p className="text-xs text-muted-foreground mt-0.5">En progreso</p>
              </div>
              <div className="bg-primary/5 border border-primary/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{completadas}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Completadas</p>
              </div>
            </div>

            {/* Columnas */}
            <div className="space-y-6">
              {COLUMNAS.filter(col => tareasPorColumna[col].length > 0).map(columna => {
                const cfg = COLUMNA_CFG[columna];
                const Icon = cfg.icon;
                return (
                  <div key={columna}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      <h2 className={`text-sm font-bold uppercase tracking-widest ${cfg.color}`}>{columna}</h2>
                      <Badge variant="outline" className="text-[10px]">{tareasPorColumna[columna].length}</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {tareasPorColumna[columna].map(tarea => (
                        <Card key={tarea.id} className={`border ${cfg.bg} hover:border-primary/30 transition-colors`}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-sm font-semibold leading-snug line-clamp-2">{tarea.titulo}</h4>
                              <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 flex-shrink-0 ${PRIORIDAD_COLOR[tarea.prioridad] ?? ""}`}>
                                {tarea.prioridad?.[0] ?? "?"}
                              </Badge>
                            </div>
                            {tarea.descripcion && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{tarea.descripcion}</p>
                            )}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                              {tarea.creadoPor && (
                                <span className="text-[10px] text-muted-foreground/60 font-mono">
                                  por {tarea.creadoPor.split("@")[0]}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground/50 ml-auto">
                                {tarea.fechaCreacion
                                  ? formatDistanceToNow(new Date(tarea.fechaCreacion), { locale: es, addSuffix: true })
                                  : ""}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
