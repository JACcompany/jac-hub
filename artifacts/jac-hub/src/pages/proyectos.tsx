import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListProyectos, useCreateProyecto, useDeleteProyecto, getListProyectosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Calendar, Users, Cpu, Trash2, Kanban, Lock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useIsAdmin } from "@/hooks/use-admin";

export default function Proyectos() {
  const { data: proyectos, isLoading } = useListProyectos();
  const queryClient = useQueryClient();
  const createMutation = useCreateProyecto();
  const deleteMutation = useDeleteProyecto();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nuevoProyecto, setNuevoProyecto] = useState({ nombre: "", descripcion: "", estado: "Activo" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: nuevoProyecto }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProyectosQueryKey() });
        setIsCreateOpen(false);
        setNuevoProyecto({ nombre: "", descripcion: "", estado: "Activo" });
        toast({ title: "Proyecto creado exitosamente" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProyectosQueryKey() });
        toast({ title: "Proyecto eliminado" });
      }
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo': return 'bg-primary/20 text-primary border-primary/30';
      case 'completado': return 'bg-chart-2/20 text-chart-2 border-chart-2/30';
      case 'pausado': return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Proyectos</h1>
            <p className="text-muted-foreground">Gestión de títulos y desarrollos en curso.</p>
          </div>

          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                  <Plus className="h-4 w-4" /> Nuevo Proyecto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] border-primary/20 bg-card">
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Crear Proyecto</DialogTitle>
                    <DialogDescription>Inicializa un nuevo entorno de desarrollo.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nombre">Nombre del Proyecto</Label>
                      <Input id="nombre" value={nuevoProyecto.nombre} onChange={(e) => setNuevoProyecto({...nuevoProyecto, nombre: e.target.value})} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea id="descripcion" value={nuevoProyecto.descripcion} onChange={(e) => setNuevoProyecto({...nuevoProyecto, descripcion: e.target.value})} rows={3} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Select value={nuevoProyecto.estado} onValueChange={(val) => setNuevoProyecto({...nuevoProyecto, estado: val})}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Pausado">Pausado</SelectItem>
                          <SelectItem value="Completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Inicializar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : proyectos && proyectos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((proyecto) => (
              <Card key={proyecto.id} className="border-border hover:border-primary/50 transition-all duration-300 group flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold truncate pr-2">{proyecto.nombre}</CardTitle>
                    <Badge variant="outline" className={getEstadoColor(proyecto.estado)}>{proyecto.estado}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2 h-10">{proyecto.descripcion}</p>
                </CardHeader>

                <CardContent className="pb-2 flex-1 relative z-10">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Progreso de Build</span>
                        <span className="text-primary">{proyecto.progreso}%</span>
                      </div>
                      <Progress value={proyecto.progreso} className="h-2 bg-muted/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{proyecto.miembros?.length || 0} asignados</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(proyecto.fechaActualizacion), "dd MMM yyyy", { locale: es })}</span>
                      </div>
                    </div>
                    {proyecto.tecnologias && proyecto.tecnologias.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {proyecto.tecnologias.map((tech, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/10 text-secondary border-secondary/20">
                            <Cpu className="h-3 w-3 mr-1 inline" />{tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-border/50 relative z-10 flex justify-between">
                  <Button variant="ghost" size="sm" className="text-xs hover:text-primary" onClick={() => window.location.href = `/tareas?proyecto=${proyecto.id}`}>
                    Ver Tareas
                  </Button>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-destructive/20 bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Confirmar purga de datos?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará el proyecto "{proyecto.nombre}" y todos sus datos. No se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abortar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(proyecto.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Purgar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
            <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No hay proyectos registrados</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              {isAdmin ? "Inicializa un nuevo proyecto para comenzar." : "El administrador aún no ha creado proyectos."}
            </p>
            {isAdmin && (
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Inicializar Proyecto
              </Button>
            )}
          </div>
        )}

        {!isAdmin && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border/30 rounded-md px-3 py-2 bg-card/30">
            <Lock className="h-3.5 w-3.5" />
            <span>Modo lectura — solo el administrador puede crear o eliminar proyectos.</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
