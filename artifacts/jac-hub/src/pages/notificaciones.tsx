import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListNotificaciones, useMarcarNotificacionLeida, useMarcarTodasLeidas, getListNotificacionesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle2, Radio, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useIsAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";

export default function Notificaciones() {
  const { data: notificaciones, isLoading } = useListNotificaciones();
  const marcarLeidaMutation = useMarcarNotificacionLeida();
  const marcarTodasMutation = useMarcarTodasLeidas();
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();

  const [broadcast, setBroadcast] = useState({ titulo: "", mensaje: "", url: "/" });
  const [sending, setSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const handleMarcarLeida = (id: number) => {
    marcarLeidaMutation.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificacionesQueryKey() })
    });
  };

  const handleMarcarTodas = () => {
    marcarTodasMutation.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificacionesQueryKey() })
    });
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setBroadcastResult(null);
    try {
      const res = await fetch("/api/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(broadcast),
      });
      const data = await res.json() as { sent: number; failed: number; total: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");
      setBroadcastResult(data);
      toast({
        title: "Broadcast enviado",
        description: `${data.sent} dispositivos notificados${data.failed > 0 ? `, ${data.failed} fallaron` : ""}.`,
      });
      setBroadcast({ titulo: "", mensaje: "", url: "/" });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "exito": return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "error": return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "alerta": return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default: return <Info className="h-5 w-5 text-secondary" />;
    }
  };

  const unreadCount = notificaciones?.filter(n => !n.leida).length || 0;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Registro de Eventos</h1>
            <p className="text-muted-foreground">Alertas y notificaciones del sistema.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10" onClick={handleMarcarTodas} disabled={marcarTodasMutation.isPending}>
              {marcarTodasMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Limpiar Alertas
            </Button>
          )}
        </div>

        {/* Broadcast Panel — admin only */}
        {isAdmin && (
          <Card className="border-secondary/30 bg-secondary/5">
            <CardHeader className="border-b border-secondary/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-secondary">
                <Radio className="h-5 w-5" />
                Broadcast Push al Equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      placeholder="ej. Nueva build disponible"
                      value={broadcast.titulo}
                      onChange={e => setBroadcast(p => ({ ...p, titulo: e.target.value }))}
                      required
                      className="bg-background/50 border-secondary/30 focus:border-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ruta de destino</Label>
                    <Select value={broadcast.url} onValueChange={v => setBroadcast(p => ({ ...p, url: v }))}>
                      <SelectTrigger className="bg-background/50 border-secondary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="/">/dashboard</SelectItem>
                        <SelectItem value="/proyectos">/proyectos</SelectItem>
                        <SelectItem value="/tareas">/tareas</SelectItem>
                        <SelectItem value="/bugs">/bugs</SelectItem>
                        <SelectItem value="/builds">/builds</SelectItem>
                        <SelectItem value="/chat">/chat</SelectItem>
                        <SelectItem value="/notificaciones">/notificaciones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mensaje</Label>
                  <Textarea
                    placeholder="Escribe el mensaje que recibirá el equipo..."
                    value={broadcast.mensaje}
                    onChange={e => setBroadcast(p => ({ ...p, mensaje: e.target.value }))}
                    required
                    rows={3}
                    className="bg-background/50 border-secondary/30 focus:border-secondary resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  {broadcastResult && (
                    <p className="text-sm text-muted-foreground font-mono">
                      Último envío: <span className="text-primary">{broadcastResult.sent}</span> ok
                      {broadcastResult.failed > 0 && <span className="text-destructive"> · {broadcastResult.failed} fallidos</span>}
                      <span className="text-muted-foreground/60"> / {broadcastResult.total} suscritos</span>
                    </p>
                  )}
                  {!broadcastResult && (
                    <p className="text-xs text-muted-foreground">Solo llega a dispositivos con Push activado en Configuración.</p>
                  )}
                  <Button type="submit" disabled={sending} className="gap-2 shadow-[0_0_8px_rgba(0,212,255,0.3)] bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Enviar Broadcast
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Notification list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notificaciones && notificaciones.length > 0 ? (
          <div className="space-y-3">
            {notificaciones.map((notif) => (
              <Card key={notif.id} className={`border transition-colors ${notif.leida ? 'border-border/50 bg-card/40 opacity-70' : 'border-primary/30 bg-card/80 shadow-[inset_4px_0_0_0_rgba(0,255,136,1)]'}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="mt-0.5">{getTipoIcon(notif.tipo)}</div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${notif.leida ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                      {notif.mensaje}
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground/70 font-mono">
                      <span>{formatDistanceToNow(new Date(notif.fecha), { addSuffix: true, locale: es })}</span>
                      {notif.usuario && <span>• Usuario: {notif.usuario}</span>}
                    </div>
                  </div>
                  {!notif.leida && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleMarcarLeida(notif.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">Comms Silenciadas</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">No hay eventos recientes en el registro.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
