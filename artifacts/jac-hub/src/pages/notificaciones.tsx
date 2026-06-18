import { AppLayout } from "@/components/layout/AppLayout";
import { useListNotificaciones, useMarcarNotificacionLeida, useMarcarTodasLeidas, getListNotificacionesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Notificaciones() {
  const { data: notificaciones, isLoading } = useListNotificaciones();
  const marcarLeidaMutation = useMarcarNotificacionLeida();
  const marcarTodasMutation = useMarcarTodasLeidas();
  const queryClient = useQueryClient();

  const handleMarcarLeida = (id: number) => {
    marcarLeidaMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificacionesQueryKey() });
      }
    });
  };

  const handleMarcarTodas = () => {
    marcarTodasMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificacionesQueryKey() });
      }
    });
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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notificaciones && notificaciones.length > 0 ? (
          <div className="space-y-3">
            {notificaciones.map((notif) => (
              <Card key={notif.id} className={`border transition-colors ${notif.leida ? 'border-border/50 bg-card/40 opacity-70' : 'border-primary/30 bg-card/80 shadow-[inset_4px_0_0_0_rgba(0,255,136,1)]'}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="mt-0.5">
                    {getTipoIcon(notif.tipo)}
                  </div>
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