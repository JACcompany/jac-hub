import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListTareas, useCreateTarea, useUpdateTarea, useDeleteTarea, getListTareasQueryKey,
  useListProyectos, useListEquipo,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ListTodo, FolderOpen, User, MessageSquare, Send } from "lucide-react";
import { useIsAdmin, useCurrentUser, OWNER_EMAIL } from "@/hooks/use-admin";
import { OwnerBadge } from "@/components/OwnerBadge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const COLUMNAS = ["Ideas", "Pendiente", "En Progreso", "Testing", "Completado"];

const COLUMNA_COLORS: Record<string, string> = {
  "Ideas":       "border-t-purple-500/60",
  "Pendiente":   "border-t-muted-foreground/40",
  "En Progreso": "border-t-secondary/60",
  "Testing":     "border-t-orange-400/60",
  "Completado":  "border-t-primary/60",
};

const PRIORIDADES = ["Baja", "Media", "Alta", "Crítica"];

interface Comentario {
  id: number;
  tareaId: number;
  autorNombre: string;
  autorEmail: string;
  contenido: string;
  fechaCreacion: string;
}

function useComentarios(tareaId: number | null) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!tareaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tareas/${tareaId}/comentarios`);
      if (res.ok) setComentarios(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tareaId]);

  useEffect(() => { cargar(); }, [cargar]);

  return { comentarios, loading, recargar: cargar };
}

function useConteosComentarios() {
  const [conteos, setConteos] = useState<Record<number, number>>({});

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/tareas/conteos-comentarios");
      if (res.ok) setConteos(await res.json());
    } catch {}
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return { conteos, recargar: cargar };
}

function PanelComentarios({
  tarea, open, onClose, onNuevoComentario,
}: {
  tarea: { id: number; titulo: string } | null;
  open: boolean;
  onClose: () => void;
  onNuevoComentario: () => void;
}) {
  const { comentarios, loading, recargar } = useComentarios(tarea?.id ?? null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();
  const currentUser = useCurrentUser();

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || !tarea) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/tareas/${tarea.id}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: texto.trim() }),
      });
      if (res.ok) {
        setTexto("");
        recargar();
        onNuevoComentario();
      } else {
        toast({ title: "Error al enviar comentario", variant: "destructive" });
      }
    } finally {
      setEnviando(false);
    }
  };

  const isOwnerEmail = (email: string) => email === OWNER_EMAIL;

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-card border-border/60">
        <SheetHeader className="pb-3 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="truncate">{tarea?.titulo}</span>
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{comentarios.length} comentario{comentarios.length !== 1 ? "s" : ""}</p>
        </SheetHeader>

        <ScrollArea className="flex-1 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : comentarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">Sin comentarios aún.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Sé el primero en comentar.</p>
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {comentarios.map(c => {
                const esMio = c.autorEmail === currentUser?.email;
                const esOwner = isOwnerEmail(c.autorEmail);
                return (
                  <div key={c.id} className={`flex gap-2.5 ${esMio ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-bold
                      ${esOwner ? "bg-amber-900/40 border border-amber-400/40 text-amber-300" : "bg-primary/10 border border-primary/20 text-primary"}`}>
                      {c.autorNombre[0].toUpperCase()}
                    </div>
                    <div className={`max-w-[80%] flex flex-col gap-1 ${esMio ? "items-end" : "items-start"}`}>
                      <div className={`flex items-center gap-1.5 ${esMio ? "flex-row-reverse" : ""}`}>
                        {esOwner
                          ? <span className="text-[11px] owner-name font-bold">{c.autorNombre}</span>
                          : <span className="text-[11px] font-semibold text-foreground">{c.autorNombre}</span>
                        }
                        {esOwner && <OwnerBadge size="sm" showLabel={false} />}
                        <span className="text-[10px] text-muted-foreground/50">
                          {formatDistanceToNow(new Date(c.fechaCreacion), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                      <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed break-words
                        ${esMio
                          ? "bg-primary/20 border border-primary/30 text-foreground rounded-tr-sm"
                          : esOwner
                            ? "owner-task-card border border-amber-400/30 rounded-tl-sm"
                            : "bg-muted/30 border border-border/50 rounded-tl-sm"
                        }`}>
                        {c.contenido}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="pt-3 border-t border-border/50">
          <form onSubmit={enviar} className="flex gap-2">
            <Input
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Escribe un comentario..."
              maxLength={1000}
              className="flex-1 bg-background/60 border-border/50 focus-visible:border-primary/50"
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!texto.trim() || enviando} className="flex-shrink-0">
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Tareas() {
  const { data: tareas, isLoading } = useListTareas();
  const { data: proyectos } = useListProyectos();
  const { data: miembros } = useListEquipo();
  const createMutation = useCreateTarea();
  const updateMutation = useUpdateTarea();
  const deleteMutation = useDeleteTarea();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const currentUser = useCurrentUser();
  const { conteos, recargar: recargarConteos } = useConteosComentarios();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: "",
    descripcion: "",
    columna: "Pendiente",
    prioridad: "Media",
    asignadoA: "",
    proyectoId: undefined as number | undefined,
  });
  const [draggedTareaId, setDraggedTareaId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [tareaComentarios, setTareaComentarios] = useState<{ id: number; titulo: string } | null>(null);

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad?.toLowerCase()) {
      case "crítica": return "bg-destructive text-destructive-foreground";
      case "alta":    return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "media":   return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "baja":    return "bg-primary/20 text-primary border-primary/30";
      default:        return "bg-muted text-muted-foreground";
    }
  };

  const isOwnerTask = (creadoPor: string | null | undefined) => creadoPor === OWNER_EMAIL;
  const canDelete = (tarea: { creadoPor?: string | null }) =>
    isAdmin || tarea.creadoPor === currentUser?.email;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        titulo: nuevaTarea.titulo,
        descripcion: nuevaTarea.descripcion,
        columna: nuevaTarea.columna,
        prioridad: nuevaTarea.prioridad,
        asignadoA: nuevaTarea.asignadoA || undefined,
        proyectoId: nuevaTarea.proyectoId,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTareasQueryKey() });
        setIsCreateOpen(false);
        setNuevaTarea({ titulo: "", descripcion: "", columna: "Pendiente", prioridad: "Media", asignadoA: "", proyectoId: undefined });
        toast({ title: "Tarea registrada" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTareasQueryKey() });
        toast({ title: "Tarea eliminada" });
      },
      onError: () => toast({ title: "Sin permiso para eliminar esta tarea", variant: "destructive" }),
    });
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedTareaId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id.toString());
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(col);
  };

  const handleDrop = (e: React.DragEvent, columnaDestino: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedTareaId === null) return;
    const tarea = tareas?.find(t => t.id === draggedTareaId);
    if (tarea && tarea.columna !== columnaDestino) {
      queryClient.setQueryData(getListTareasQueryKey(), (old: any[]) =>
        old?.map(t => t.id === draggedTareaId ? { ...t, columna: columnaDestino } : t)
      );
      updateMutation.mutate({ id: draggedTareaId, data: { columna: columnaDestino } }, {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: getListTareasQueryKey() });
          toast({ title: "Error al mover tarea", variant: "destructive" });
        }
      });
    }
    setDraggedTareaId(null);
  };

  const tareasPorColumna = COLUMNAS.reduce((acc, col) => {
    acc[col] = tareas?.filter(t => t.columna === col) || [];
    return acc;
  }, {} as Record<string, any[]>);

  const proyectoNombre = (id: number | null | undefined) =>
    proyectos?.find(p => p.id === id)?.nombre ?? null;

  return (
    <AppLayout>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Kanban</h1>
            <p className="text-muted-foreground">Flujo de trabajo colaborativo del equipo.</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                <Plus className="h-4 w-4" /> Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] border-primary/20 bg-card">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Añadir Tarea</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="titulo">Título *</Label>
                    <Input id="titulo" value={nuevaTarea.titulo} onChange={e => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea id="descripcion" value={nuevaTarea.descripcion} onChange={e => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Columna</Label>
                      <Select value={nuevaTarea.columna} onValueChange={v => setNuevaTarea({ ...nuevaTarea, columna: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{COLUMNAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Prioridad</Label>
                      <Select value={nuevaTarea.prioridad} onValueChange={v => setNuevaTarea({ ...nuevaTarea, prioridad: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1.5">
                      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> Proyecto (opcional)
                    </Label>
                    <Select
                      value={nuevaTarea.proyectoId !== undefined ? String(nuevaTarea.proyectoId) : "ninguno"}
                      onValueChange={v => setNuevaTarea({ ...nuevaTarea, proyectoId: v === "ninguno" ? undefined : Number(v) })}
                    >
                      <SelectTrigger className="bg-background/60"><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ninguno">Sin proyecto</SelectItem>
                        {proyectos?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> Asignar a (opcional)
                    </Label>
                    <Select
                      value={nuevaTarea.asignadoA || "nadie"}
                      onValueChange={v => setNuevaTarea({ ...nuevaTarea, asignadoA: v === "nadie" ? "" : v })}
                    >
                      <SelectTrigger className="bg-background/60"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nadie">Sin asignar</SelectItem>
                        {miembros?.map(m => <SelectItem key={m.id} value={m.nombre}>{m.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Tarea
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 flex-1 items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tareas && tareas.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
            <ListTodo className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No existen tareas actualmente</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Crea la primera tarea para comenzar.</p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
            {COLUMNAS.map(columna => (
              <div
                key={columna}
                className={`w-80 min-w-[320px] flex flex-col bg-card/30 border border-t-2 rounded-lg overflow-hidden transition-colors
                  ${COLUMNA_COLORS[columna]} ${dragOverCol === columna ? "border-primary/60 bg-primary/5" : "border-border/50"}`}
                onDragOver={e => handleDragOver(e, columna)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={e => handleDrop(e, columna)}
              >
                <div className="p-3 border-b border-border/50 bg-card/50 flex justify-between items-center">
                  <h3 className="font-semibold text-foreground">{columna}</h3>
                  <Badge variant="secondary" className="bg-background">{tareasPorColumna[columna]?.length || 0}</Badge>
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {tareasPorColumna[columna]?.map(tarea => {
                    const esDelOwner = isOwnerTask(tarea.creadoPor);
                    const proyecto = proyectoNombre(tarea.proyectoId);
                    const numComentarios = conteos[tarea.id] ?? 0;
                    return (
                      <Card
                        key={tarea.id}
                        className={`group shadow-sm transition-all cursor-grab active:cursor-grabbing
                          ${esDelOwner
                            ? "owner-task-card border-amber-400/60 bg-amber-950/10"
                            : "border-border/60 bg-card hover:border-primary/40"
                          }`}
                        draggable
                        onDragStart={e => handleDragStart(e, tarea.id)}
                      >
                        <CardContent className="p-3">
                          {esDelOwner && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <OwnerBadge size="sm" />
                              <span className="text-[10px] owner-name font-semibold">gaelo03</span>
                            </div>
                          )}
                          {!esDelOwner && tarea.creadoPor && (
                            <div className="text-[10px] text-muted-foreground mb-1 font-mono">
                              por {tarea.creadoPor.split("@")[0]}
                            </div>
                          )}
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-medium text-sm leading-tight line-clamp-2">{tarea.titulo}</h4>
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 border-transparent flex-shrink-0 ${getPrioridadColor(tarea.prioridad)}`}>
                              {tarea.prioridad.charAt(0)}
                            </Badge>
                          </div>
                          {tarea.descripcion && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{tarea.descripcion}</p>
                          )}
                          {proyecto && (
                            <div className="flex items-center gap-1 mb-2">
                              <FolderOpen className="h-2.5 w-2.5 text-secondary/60" />
                              <span className="text-[10px] text-secondary/70 truncate">{proyecto}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                            {tarea.asignadoA ? (
                              <div className="flex items-center gap-1">
                                <User className="h-2.5 w-2.5 text-secondary/60" />
                                <span className="text-xs text-secondary font-medium">{tarea.asignadoA}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin asignar</span>
                            )}
                            <div className="flex items-center gap-1">
                              {/* Botón comentarios con contador */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 px-1.5 gap-1 text-xs transition-colors
                                  ${numComentarios > 0
                                    ? "text-primary/70 hover:text-primary hover:bg-primary/10"
                                    : "text-muted-foreground/40 hover:text-primary/60 hover:bg-primary/10"
                                  }`}
                                onClick={e => { e.stopPropagation(); setTareaComentarios({ id: tarea.id, titulo: tarea.titulo }); }}
                              >
                                <MessageSquare className="h-3 w-3" />
                                {numComentarios > 0 && (
                                  <span className="font-mono font-bold leading-none">{numComentarios}</span>
                                )}
                              </Button>
                              {canDelete(tarea) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="border-destructive/20 bg-card">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                                      <AlertDialogDescription>Se eliminará "{tarea.titulo}". Esta acción no se puede deshacer.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(tarea.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {tareasPorColumna[columna]?.length === 0 && (
                    <div className={`h-24 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground/50 text-sm transition-colors
                      ${dragOverCol === columna ? "border-primary/40 text-primary/40" : "border-border/30"}`}>
                      {dragOverCol === columna ? "Soltar aquí" : "Columna vacía"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PanelComentarios
        tarea={tareaComentarios}
        open={!!tareaComentarios}
        onClose={() => setTareaComentarios(null)}
        onNuevoComentario={recargarConteos}
      />
    </AppLayout>
  );
}
