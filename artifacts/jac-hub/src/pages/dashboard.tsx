import { useGetDashboardStats } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Kanban, Users, Bug, CheckCircle2, Package, Loader2, BarChart2, Smartphone, Monitor, Download, CheckCircle } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";

const COLORS = ['#ff0055', '#ff7a00', '#ffcc00', '#00ff88'];

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Dashboard</h1>
          <p className="text-muted-foreground">Estado general del estudio JAC.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <>
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Proyectos Activos</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">{stats.proyectosActivos}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                    <Kanban className="h-6 w-6 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary/20 bg-card/50 backdrop-blur">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Miembros Conectados</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">{stats.miembrosConectados}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/30">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-card/50 backdrop-blur">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Bugs Abiertos</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">{stats.bugsAbiertos}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/30">
                    <Bug className="h-6 w-6 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Builds</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">{stats.totalBuilds}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos reales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bugs por Prioridad */}
              {stats.bugsPorPrioridad && stats.bugsPorPrioridad.some(b => b.cantidad > 0) ? (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="h-5 w-5 text-primary" />
                      Bugs por Prioridad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[280px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.bugsPorPrioridad.filter(b => b.cantidad > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="cantidad"
                          nameKey="prioridad"
                          stroke="none"
                        >
                          {stats.bugsPorPrioridad.filter(b => b.cantidad > 0).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="h-5 w-5 text-primary" />
                      Bugs por Prioridad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center h-[280px] text-center">
                    <Bug className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">No hay bugs registrados</p>
                  </CardContent>
                </Card>
              )}

              {/* Progreso de Proyectos */}
              {stats.progresoPorProyecto && stats.progresoPorProyecto.length > 0 ? (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-primary" />
                      Progreso de Proyectos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.progresoPorProyecto} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} stroke="#888" tickFormatter={(v) => `${v}%`} />
                        <YAxis dataKey="nombre" type="category" stroke="#888" width={90} tick={{ fontSize: 12 }} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          formatter={(v) => [`${v}%`, "Progreso"]}
                        />
                        <Bar dataKey="progreso" fill="#00ff88" radius={[0, 4, 4, 0]} name="Progreso (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-primary" />
                      Progreso de Proyectos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center h-[280px] text-center">
                    <Kanban className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">No hay proyectos activos registrados</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tareas esta semana */}
            <Card className="border-primary/20 bg-card/50">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tareas Completadas esta Semana</p>
                  <h3 className="text-3xl font-bold mt-2 text-foreground">{stats.tareasCompletadasSemana}</h3>
                  <p className="text-xs text-muted-foreground mt-1">de {stats.totalTareas} tareas totales</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>

            {/* ── Descargar / Instalar JAC Hub ── */}
            <div className="border border-primary/20 rounded-xl bg-card/30 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Download className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-primary">Instalar JAC Hub</h2>
                {isInstalled && (
                  <span className="flex items-center gap-1 text-xs text-primary/60 ml-2">
                    <CheckCircle className="h-3.5 w-3.5" /> Instalada
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Android */}
                <div className="rounded-lg border border-border/50 bg-background/40 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Android</p>
                      <p className="text-[10px] text-muted-foreground">Chrome / Edge</p>
                    </div>
                  </div>
                  <ol className="text-xs text-muted-foreground space-y-1 list-none">
                    <li className="flex gap-1.5"><span className="text-primary font-mono">1.</span> Abre JAC Hub en Chrome</li>
                    <li className="flex gap-1.5"><span className="text-primary font-mono">2.</span> Toca el menú ⋮</li>
                    <li className="flex gap-1.5"><span className="text-primary font-mono">3.</span> "Agregar a pantalla de inicio"</li>
                  </ol>
                </div>

                {/* Windows */}
                <div className="rounded-lg border border-border/50 bg-background/40 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Windows</p>
                      <p className="text-[10px] text-muted-foreground">Chrome / Edge</p>
                    </div>
                  </div>
                  {isInstalled ? (
                    <p className="text-xs text-primary flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" /> App ya instalada
                    </p>
                  ) : isInstallable ? (
                    <Button
                      size="sm"
                      className="w-full mt-auto text-xs gap-1.5 bg-secondary/20 hover:bg-secondary/30 border border-secondary/40 text-secondary"
                      variant="outline"
                      onClick={install}
                    >
                      <Download className="h-3.5 w-3.5" /> Instalar ahora
                    </Button>
                  ) : (
                    <ol className="text-xs text-muted-foreground space-y-1 list-none">
                      <li className="flex gap-1.5"><span className="text-secondary font-mono">1.</span> Abre en Chrome o Edge</li>
                      <li className="flex gap-1.5"><span className="text-secondary font-mono">2.</span> Ícono instalar en la barra</li>
                      <li className="flex gap-1.5"><span className="text-secondary font-mono">3.</span> Confirma la instalación</li>
                    </ol>
                  )}
                </div>

                {/* Linux / Mac */}
                <div className="rounded-lg border border-border/50 bg-background/40 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-primary/80" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Linux / Mac</p>
                      <p className="text-[10px] text-muted-foreground">Chrome / Chromium</p>
                    </div>
                  </div>
                  {isInstalled ? (
                    <p className="text-xs text-primary flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" /> App ya instalada
                    </p>
                  ) : isInstallable ? (
                    <Button
                      size="sm"
                      className="w-full mt-auto text-xs gap-1.5"
                      variant="outline"
                      onClick={install}
                    >
                      <Download className="h-3.5 w-3.5" /> Instalar ahora
                    </Button>
                  ) : (
                    <ol className="text-xs text-muted-foreground space-y-1 list-none">
                      <li className="flex gap-1.5"><span className="text-primary font-mono">1.</span> Abre en Chrome/Chromium</li>
                      <li className="flex gap-1.5"><span className="text-primary font-mono">2.</span> Ícono instalar (⊕) en la barra</li>
                      <li className="flex gap-1.5"><span className="text-primary font-mono">3.</span> Confirma la instalación</li>
                    </ol>
                  )}
                </div>

              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-4 text-center">
                PWA — se instala sin tienda de apps. Requiere que la app esté publicada en HTTPS para funcionar.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
            <BarChart2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Sin datos disponibles</h3>
            <p className="text-muted-foreground mt-2">No hay información que mostrar en el dashboard.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
