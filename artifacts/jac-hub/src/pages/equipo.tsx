import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useListEquipo, useCreateMiembro, useUpdateMiembro, getListEquipoQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Code, Target, Bug, Palette, Plus, Edit2, Users, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useIsAdmin } from "@/hooks/use-admin";
import { OwnerBadge, OwnerName } from "@/components/OwnerBadge";

const OWNER_EMAIL = "gael@jac.dev";

export default function Equipo() {
  const { data: miembros, isLoading } = useListEquipo();
  const createMutation = useCreateMiembro();
  const updateMutation = useUpdateMiembro();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nuevoMiembro, setNuevoMiembro] = useState({ nombre: "", email: "", rol: "Programador", habilidadesStr: "" });
  const [editMiembroId, setEditMiembroId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ enLinea: false, rol: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        nombre: nuevoMiembro.nombre,
        email: nuevoMiembro.email,
        rol: nuevoMiembro.rol,
        habilidades: nuevoMiembro.habilidadesStr.split(',').map(h => h.trim()).filter(Boolean)
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEquipoQueryKey() });
        setIsCreateOpen(false);
        setNuevoMiembro({ nombre: "", email: "", rol: "Programador", habilidadesStr: "" });
        toast({ title: "Miembro registrado" });
      }
    });
  };

  const handleUpdate = (id: number) => {
    updateMutation.mutate({ id, data: editData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEquipoQueryKey() });
        setEditMiembroId(null);
        toast({ title: "Perfil actualizado" });
      }
    });
  };

  const getRoleIcon = (rol: string) => {
    const r = rol.toLowerCase();
    if (r.includes('programador') || r.includes('dev') || r.includes('lead programador')) return <Code className="h-4 w-4" />;
    if (r.includes('diseñador') || r.includes('design')) return <Target className="h-4 w-4" />;
    if (r.includes('artist') || r.includes('arte') || r.includes('lead artista')) return <Palette className="h-4 w-4" />;
    if (r.includes('test') || r.includes('qa')) return <Bug className="h-4 w-4" />;
    if (r.includes('cliente')) return <Users className="h-4 w-4" />;
    if (r.includes('representante')) return <Users className="h-4 w-4" />;
    return <Code className="h-4 w-4" />;
  };

  const isOwnerMember = (email: string) => email === OWNER_EMAIL;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Equipo</h1>
            <p className="text-muted-foreground">Personal autorizado en la terminal.</p>
          </div>

          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                  <Plus className="h-4 w-4" /> Registrar Miembro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] border-primary/20 bg-card">
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Operador</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Nombre</Label>
                      <Input value={nuevoMiembro.nombre} onChange={e => setNuevoMiembro({...nuevoMiembro, nombre: e.target.value})} required />
                    </div>
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input type="email" value={nuevoMiembro.email} onChange={e => setNuevoMiembro({...nuevoMiembro, email: e.target.value})} required />
                    </div>
                    <div className="grid gap-2">
                      <Label>Rol</Label>
                      <Select value={nuevoMiembro.rol} onValueChange={v => setNuevoMiembro({...nuevoMiembro, rol: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Programador">Programador</SelectItem>
                          <SelectItem value="Lead Programador">Lead Programador</SelectItem>
                          <SelectItem value="Lead Artista">Lead Artista</SelectItem>
                          <SelectItem value="Diseñador de juego">Diseñador de juego</SelectItem>
                          <SelectItem value="Pixel Artist">Pixel Artist</SelectItem>
                          <SelectItem value="Tester">Tester</SelectItem>
                          <SelectItem value="Colaborador">Colaborador</SelectItem>
                          <SelectItem value="Representante">Representante</SelectItem>
                          <SelectItem value="Cliente">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Habilidades (separadas por coma)</Label>
                      <Input value={nuevoMiembro.habilidadesStr} onChange={e => setNuevoMiembro({...nuevoMiembro, habilidadesStr: e.target.value})} placeholder="React, C#, Unity..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Registrar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border/30 rounded-md px-3 py-2 bg-card/30">
            <Lock className="h-3.5 w-3.5" />
            <span>Modo lectura — solo el administrador puede agregar o editar miembros del equipo.</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : miembros && miembros.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {miembros.map((miembro) => {
              const esOwner = isOwnerMember(miembro.email);
              return (
                <Card
                  key={miembro.id}
                  className={`overflow-hidden relative transition-all ${
                    esOwner
                      ? 'owner-team-card border-amber-400/50'
                      : 'border-border'
                  }`}
                >
                  {esOwner && <div className="absolute top-0 left-0 w-full h-1 owner-top-bar" />}
                  {!esOwner && miembro.enLinea && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_10px_rgba(0,255,136,0.8)]" />
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 items-center">
                        <div className="relative">
                          <Avatar className={`h-14 w-14 ${esOwner ? 'owner-avatar' : 'border border-border'}`}>
                            <AvatarImage src={miembro.avatar || undefined} />
                            <AvatarFallback className={`text-lg font-bold ${esOwner ? 'bg-amber-900/40 text-amber-300' : 'bg-muted'}`}>
                              {miembro.nombre.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {miembro.enLinea ? (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary border-2 border-card rounded-full shadow-[0_0_5px_rgba(0,255,136,0.8)] animate-pulse" />
                          ) : (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-muted-foreground border-2 border-card rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {esOwner
                              ? <OwnerName name={miembro.nombre} size="lg" />
                              : <CardTitle className="text-lg">{miembro.nombre}</CardTitle>
                            }
                            {esOwner && <OwnerBadge size="sm" />}
                          </div>
                          {esOwner ? (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs owner-name font-mono">Fundador · JAC Studio</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-sm text-secondary font-mono mt-1 gap-1.5">
                              {getRoleIcon(miembro.rol)}
                              {miembro.rol}
                            </div>
                          )}
                        </div>
                      </div>
                      {isAdmin && !esOwner && (
                        <Dialog
                          open={editMiembroId === miembro.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setEditMiembroId(miembro.id);
                              setEditData({ enLinea: miembro.enLinea, rol: miembro.rol });
                            } else {
                              setEditMiembroId(null);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 opacity-50 hover:opacity-100 text-muted-foreground hover:text-primary">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[400px] border-primary/20 bg-card">
                            <DialogHeader>
                              <DialogTitle>Editar {miembro.nombre}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="flex items-center justify-between">
                                <Label>Estado de Conexión (En línea)</Label>
                                <Switch checked={editData.enLinea} onCheckedChange={v => setEditData({...editData, enLinea: v})} className="data-[state=checked]:bg-primary" />
                              </div>
                              <div className="grid gap-2">
                                <Label>Rol</Label>
                                <Select value={editData.rol} onValueChange={v => setEditData({...editData, rol: v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Programador">Programador</SelectItem>
                                    <SelectItem value="Lead Programador">Lead Programador</SelectItem>
                                    <SelectItem value="Lead Artista">Lead Artista</SelectItem>
                                    <SelectItem value="Diseñador de juego">Diseñador de juego</SelectItem>
                                    <SelectItem value="Pixel Artist">Pixel Artist</SelectItem>
                                    <SelectItem value="Tester">Tester</SelectItem>
                                    <SelectItem value="Colaborador">Colaborador</SelectItem>
                                    <SelectItem value="Representante">Representante</SelectItem>
                                    <SelectItem value="Cliente">Cliente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditMiembroId(null)}>Cancelar</Button>
                              <Button onClick={() => handleUpdate(miembro.id)} disabled={updateMutation.isPending}>
                                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Actualizar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{miembro.email}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Proyectos</p>
                          <p className="font-mono">{miembro.proyectosActivos || 0} Activos</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">En el sistema</p>
                          <p className="font-mono text-xs">{formatDistanceToNow(new Date(miembro.fechaUnion), { locale: es })}</p>
                        </div>
                      </div>
                      {miembro.habilidades && miembro.habilidades.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Habilidades Técnicas</p>
                          <div className="flex flex-wrap gap-1.5">
                            {miembro.habilidades.map((hab, i) => (
                              <Badge key={i} variant="outline" className={`text-[10px] font-mono ${esOwner ? 'border-amber-400/40 text-amber-300/80' : 'border-primary/30 text-primary/80'}`}>{hab}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No hay miembros registrados</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              {isAdmin ? "Agrega miembros del equipo para comenzar." : "El administrador aún no ha registrado miembros del equipo."}
            </p>
            {isAdmin && (
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Registrar Miembro
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
