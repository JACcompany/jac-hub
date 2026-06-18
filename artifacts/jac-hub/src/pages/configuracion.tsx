import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Monitor, User, Shield, Terminal, UserPlus, Trash2, Users, RefreshCw, Bell, BellOff } from "lucide-react";
import { useWebPush } from "@/hooks/use-web-push";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/use-admin";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type UsuarioSistema = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  enLinea: boolean;
  fechaCreacion: string;
};

export default function Configuracion() {
  const { data: user, isLoading } = useGetMe();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const { state: pushState, error: pushError, subscribe: subscribePush, unsubscribe: unsubscribePush } = useWebPush();
  const [saving, setSaving] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", email: "", password: "", rol: "Programador" });
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchUsuarios = async () => {
    if (!isAdmin) return;
    setLoadingUsuarios(true);
    try {
      const res = await fetch("/api/auth/usuarios", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsuarios();
  }, [isAdmin]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Parámetros actualizados", description: "La configuración se ha guardado en el núcleo." });
    }, 800);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await fetch("/api/auth/usuarios", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoUsuario),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Cuenta creada exitosamente" });
        setIsCreateUserOpen(false);
        setNuevoUsuario({ nombre: "", email: "", password: "", rol: "Programador" });
        fetchUsuarios();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/auth/usuarios/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Cuenta eliminada" });
        fetchUsuarios();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Parámetros del Sistema</h1>
          <p className="text-muted-foreground">Configuración personal y administración de la plataforma.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Perfil */}
            <Card className="border-primary/20">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Perfil Operativo
                </CardTitle>
                <CardDescription>Tu identidad dentro de JAC Hub.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24 border-2 border-primary/30 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback className="text-3xl bg-muted text-primary">{user?.nombre.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                      <Badge className="bg-primary/20 text-primary border border-primary/30 font-mono text-xs">
                        ADMINISTRADOR
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre de Operador</Label>
                        <Input defaultValue={user?.nombre} className="bg-background/50 border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>Correo de Contacto</Label>
                        <Input defaultValue={user?.email} disabled className="bg-muted opacity-50 cursor-not-allowed" />
                      </div>
                      <div className="space-y-2">
                        <Label>Rol Asignado</Label>
                        <Input defaultValue={user?.rol} disabled className="bg-muted opacity-50 font-mono text-xs cursor-not-allowed" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interfaz */}
            <Card className="border-primary/20">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  Interfaz y Terminal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Efectos Neón (Glitch/Glow)</Label>
                    <p className="text-sm text-muted-foreground">Habilitar efectos visuales intensos en la UI.</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificaciones Sonoras</Label>
                    <p className="text-sm text-muted-foreground">Reproducir sonido técnico al recibir alertas.</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Modo Alto Contraste Terminal</Label>
                    <p className="text-sm text-muted-foreground">Optimizar textos pequeños y consola.</p>
                  </div>
                  <Switch className="data-[state=checked]:bg-primary" />
                </div>
              </CardContent>
            </Card>

            {/* Notificaciones Push */}
            <Card className="border-primary/20">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificaciones Push
                </CardTitle>
                <CardDescription>Recibe alertas del equipo aunque la app esté cerrada.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {pushState === "unsupported" && (
                  <p className="text-sm text-muted-foreground">Tu navegador no soporta notificaciones push.</p>
                )}
                {pushState === "denied" && (
                  <p className="text-sm text-destructive">Notificaciones bloqueadas. Actívalas desde la configuración del navegador.</p>
                )}
                {pushState === "loading" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verificando estado...
                  </div>
                )}
                {(pushState === "default" || pushState === "subscribed") && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">
                        {pushState === "subscribed" ? "Notificaciones activadas" : "Notificaciones desactivadas"}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {pushState === "subscribed"
                          ? "Recibirás alertas de JAC Hub en este dispositivo."
                          : "Actívalas para recibir mensajes del equipo en tiempo real."}
                      </p>
                      {pushError && <p className="text-xs text-destructive mt-1">{pushError}</p>}
                    </div>
                    {pushState === "subscribed" ? (
                      <Button variant="outline" className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={unsubscribePush}>
                        <BellOff className="h-4 w-4" /> Desactivar
                      </Button>
                    ) : (
                      <Button className="gap-2 shadow-[0_0_8px_rgba(0,255,136,0.3)]" onClick={subscribePush}>
                        <Bell className="h-4 w-4" /> Activar Push
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seguridad */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="border-b border-destructive/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Shield className="h-5 w-5" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Autenticación Biométrica / 2FA</Label>
                    <p className="text-sm text-muted-foreground">Actualmente deshabilitado para tu terminal.</p>
                  </div>
                  <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">Configurar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Gestión de Usuarios — solo admin */}
            {isAdmin && (
              <Card className="border-secondary/20">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-secondary" />
                      Gestión de Cuentas
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={fetchUsuarios} disabled={loadingUsuarios}>
                        <RefreshCw className={`h-4 w-4 ${loadingUsuarios ? 'animate-spin' : ''}`} />
                      </Button>
                      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2 shadow-[0_0_8px_rgba(0,212,255,0.2)] border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20">
                            <UserPlus className="h-4 w-4" /> Crear Cuenta
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] border-secondary/20 bg-card">
                          <form onSubmit={handleCreateUser}>
                            <DialogHeader>
                              <DialogTitle>Crear Nueva Cuenta de Usuario</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Nombre completo</Label>
                                <Input value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} required />
                              </div>
                              <div className="grid gap-2">
                                <Label>Correo electrónico</Label>
                                <Input type="email" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} required />
                              </div>
                              <div className="grid gap-2">
                                <Label>Contraseña</Label>
                                <Input type="password" value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} required />
                              </div>
                              <div className="grid gap-2">
                                <Label>Rol</Label>
                                <Select value={nuevoUsuario.rol} onValueChange={v => setNuevoUsuario({...nuevoUsuario, rol: v})}>
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
                                    <SelectItem value="Producción">Producción</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsCreateUserOpen(false)}>Cancelar</Button>
                              <Button type="submit" disabled={creatingUser}>
                                {creatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear Cuenta
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <CardDescription className="mt-1">Administra las cuentas de acceso al sistema. Solo el administrador principal puede crear o eliminar usuarios.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {loadingUsuarios ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : usuarios.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">No hay usuarios registrados.</p>
                  ) : (
                    <div className="space-y-2">
                      {usuarios.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-background/30 hover:bg-background/60 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarFallback className="bg-muted text-sm">{u.nombre.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">{u.nombre}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">{u.rol}</Badge>
                            {u.email === "gael@jac.dev" ? (
                              <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-mono">ADMIN</Badge>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" disabled={deletingId === u.id}>
                                    {deletingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-destructive/20 bg-card">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar cuenta de {u.nombre}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Se eliminará permanentemente la cuenta de <strong>{u.email}</strong>. Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline">Restaurar</Button>
              <Button onClick={handleSave} disabled={saving} className="min-w-[140px] shadow-[0_0_15px_rgba(0,255,136,0.3)]">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Terminal className="mr-2 h-4 w-4" />}
                Guardar Config
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
