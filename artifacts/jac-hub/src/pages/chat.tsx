import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser, OWNER_EMAIL } from "@/hooks/use-admin";
import { OwnerBadge } from "@/components/OwnerBadge";
import {
  Send, Wifi, WifiOff, Hash, Users, Crown, Lock,
  Megaphone, MessageCircle, BookOpen, Smile,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type SalaTipo = "chat" | "info" | "bienvenidas";

interface Sala {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: SalaTipo;
  icono: typeof Hash;
}

const SALAS: Sala[] = [
  // ── CANALES DE TEXTO (todos pueden escribir) ──
  { id: "general",     nombre: "general",     descripcion: "Chat del equipo",        tipo: "chat",       icono: Hash },
  { id: "desarrollo",  nombre: "desarrollo",  descripcion: "Programación y engine",  tipo: "chat",       icono: Hash },
  { id: "arte",        nombre: "arte",        descripcion: "Assets y diseño visual", tipo: "chat",       icono: Hash },
  // ── CANALES DE INFORMACIÓN (solo OWNER escribe → notificación) ──
  { id: "anuncios",    nombre: "anuncios",    descripcion: "Anuncios del equipo",    tipo: "info",       icono: Megaphone },
  // ── BIENVENIDAS (solo lectura, mensajes automáticos) ──
  { id: "bienvenidas", nombre: "bienvenidas", descripcion: "Bienvenida al servidor", tipo: "bienvenidas", icono: Smile },
];

interface Mensaje {
  id?: number;
  tipo: "mensaje" | "sistema" | "error";
  contenido?: string;
  mensaje?: string;
  autorNombre?: string;
  autorEmail?: string;
  sala?: string;
  fechaEnvio?: string;
  local?: boolean;
}

export default function Chat() {
  const user = useCurrentUser();
  const { toast } = useToast();
  const [salaActual, setSalaActual] = useState("general");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [conectado, setConectado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userEmailRef = useRef<string | undefined>(undefined);
  const lastNotifRef = useRef<number>(0);

  const isOwner = user?.email === OWNER_EMAIL;
  const salaInfo = SALAS.find(s => s.id === salaActual);
  const esBloqueada =
    salaInfo?.tipo === "bienvenidas" ||
    (salaInfo?.tipo === "info" && !isOwner);

  useEffect(() => { userEmailRef.current = user?.email; }, [user?.email]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  }, []);

  const cargarHistorial = useCallback(async (sala: string) => {
    setCargando(true);
    try {
      const res = await fetch(`/api/chat/mensajes?sala=${sala}&limit=60`);
      if (res.ok) {
        const data = await res.json();
        setMensajes(data.map((m: Record<string, unknown>) => ({ ...m, tipo: "mensaje" })));
        scrollToBottom();
      }
    } catch { /* ignore */ }
    finally { setCargando(false); }
  }, [scrollToBottom]);

  const conectarWS = useCallback((sala: string) => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws/chat?sala=${sala}`;

    let ws: WebSocket;
    try { ws = new WebSocket(wsUrl); } catch { return; }
    wsRef.current = ws;

    ws.onopen = () => setConectado(true);
    ws.onclose = () => {
      setConectado(false);
      reconnectRef.current = setTimeout(() => conectarWS(sala), 4000);
    };
    ws.onerror = () => { ws.close(); };

    ws.onmessage = (event) => {
      try {
        const data: Mensaje = JSON.parse(event.data);

        if (data.tipo === "error") {
          toast({ title: data.mensaje ?? "Error", variant: "destructive", duration: 3000 });
          return;
        }

        setMensajes(prev => [...prev.slice(-200), data]);
        scrollToBottom();

        // Notificación nativa Electron
        if (
          data.tipo === "mensaje" &&
          data.autorEmail !== userEmailRef.current &&
          !document.hasFocus() &&
          window.electronAPI
        ) {
          const now = Date.now();
          if (now - lastNotifRef.current > 5_000) {
            lastNotifRef.current = now;
            window.electronAPI.notify(
              `#${sala} — ${data.autorNombre ?? "Equipo"}`,
              data.contenido ?? "",
            );
          }
        }
      } catch { /* ignore */ }
    };
  }, [scrollToBottom, toast]);

  useEffect(() => {
    cargarHistorial(salaActual);
    conectarWS(salaActual);
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [salaActual, cargarHistorial, conectarWS]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ tipo: "mensaje", sala: salaActual, contenido }));
      setTexto("");
    } else {
      toast({ title: "Sin conexión — reintentando...", variant: "destructive" });
    }
  };

  const isOwnerMsg = (email?: string) => email === OWNER_EMAIL;
  const isSystemMsg = (email?: string) => email === "system@jac.dev";

  const salasPorCategoria = {
    chat: SALAS.filter(s => s.tipo === "chat"),
    info: SALAS.filter(s => s.tipo === "info"),
    bienvenidas: SALAS.filter(s => s.tipo === "bienvenidas"),
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] gap-0 rounded-lg overflow-hidden border border-border/50 bg-card/20">

        {/* ── Channel Sidebar ── */}
        <div className="w-52 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
          <div className="p-3 border-b border-sidebar-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Canales</p>
          </div>

          <ScrollArea className="flex-1 p-2">
            {/* Canales de texto */}
            <div className="mb-3">
              <div className="flex items-center gap-1 px-2 py-1 mb-0.5">
                <MessageCircle className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Texto</span>
              </div>
              {salasPorCategoria.chat.map(sala => (
                <ChannelBtn key={sala.id} sala={sala} activa={salaActual === sala.id} onClick={() => setSalaActual(sala.id)} />
              ))}
            </div>

            {/* Canales de información */}
            <div className="mb-3">
              <div className="flex items-center gap-1 px-2 py-1 mb-0.5">
                <BookOpen className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Información</span>
              </div>
              {salasPorCategoria.info.map(sala => (
                <ChannelBtn key={sala.id} sala={sala} activa={salaActual === sala.id} onClick={() => setSalaActual(sala.id)} locked />
              ))}
              {salasPorCategoria.bienvenidas.map(sala => (
                <ChannelBtn key={sala.id} sala={sala} activa={salaActual === sala.id} onClick={() => setSalaActual(sala.id)} locked />
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${conectado ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground">{conectado ? "En línea" : "Desconectado"}</span>
            </div>
          </div>
        </div>

        {/* ── Main chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-border/50 bg-card/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              {salaInfo?.tipo === "bienvenidas" ? (
                <Smile className="h-4 w-4 text-primary" />
              ) : salaInfo?.tipo === "info" ? (
                <Megaphone className="h-4 w-4 text-amber-400" />
              ) : (
                <Hash className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-semibold">{salaActual}</span>
              <span className="text-xs text-muted-foreground hidden md:block">
                — {salaInfo?.descripcion}
              </span>
              {esBloqueada && (
                <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground gap-1">
                  <Lock className="h-2.5 w-2.5" /> Solo lectura
                </Badge>
              )}
              {salaInfo?.tipo === "info" && isOwner && (
                <Badge variant="outline" className="text-[10px] border-amber-400/40 text-amber-400 gap-1">
                  <Crown className="h-2.5 w-2.5" /> Anuncio
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {conectado
                ? <Wifi className="h-4 w-4 text-primary" />
                : <WifiOff className="h-4 w-4 text-muted-foreground animate-pulse" />
              }
              <Badge variant="outline" className={`text-[10px] ${conectado ? "border-primary/40 text-primary" : "text-muted-foreground"}`}>
                {conectado ? "LIVE" : "OFFLINE"}
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {cargando ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                {salaInfo?.tipo === "bienvenidas" ? (
                  <>
                    <Smile className="h-12 w-12 text-primary/20 mb-3" />
                    <p className="text-muted-foreground text-sm">Los mensajes de bienvenida aparecerán aquí.</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Cada nuevo miembro del equipo recibe su mensaje.</p>
                  </>
                ) : (
                  <>
                    <Hash className="h-12 w-12 text-muted-foreground/20 mb-3" />
                    <p className="text-muted-foreground text-sm">Nadie ha escrito en #{salaActual} aún.</p>
                    {!esBloqueada && <p className="text-muted-foreground/60 text-xs mt-1">¡Sé el primero en escribir algo!</p>}
                  </>
                )}
              </div>
            ) : mensajes.map((msg, i) => {
              if (msg.tipo === "sistema") {
                return (
                  <div key={i} className="flex items-center justify-center">
                    <span className="text-[11px] text-muted-foreground/50 italic px-3 py-1 bg-muted/20 rounded-full">
                      {msg.mensaje}
                    </span>
                  </div>
                );
              }

              const esOwnerMsg = isOwnerMsg(msg.autorEmail);
              const esSystem = isSystemMsg(msg.autorEmail);
              const esMio = msg.autorEmail === user?.email;
              const esConsecutivo = i > 0 &&
                mensajes[i-1].tipo === "mensaje" &&
                mensajes[i-1].autorEmail === msg.autorEmail;

              // System welcome messages (from system@jac.dev)
              if (esSystem) {
                return (
                  <div key={msg.id ?? i} className="flex justify-center my-3">
                    <div className="max-w-lg text-center px-5 py-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 leading-relaxed">
                      <div className="text-xs text-primary/60 font-mono mb-1">🤖 JAC Sistema</div>
                      {msg.contenido}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id ?? i} className={`flex gap-3 group ${esMio ? "flex-row-reverse" : "flex-row"}`}>
                  {!esConsecutivo && (
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold
                      ${esOwnerMsg
                        ? "bg-amber-900/40 border border-amber-400/50 text-amber-300"
                        : "bg-primary/10 border border-primary/20 text-primary"
                      }`}>
                      {(msg.autorNombre ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  {esConsecutivo && <div className="w-8 flex-shrink-0" />}

                  <div className={`max-w-[70%] ${esMio ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                    {!esConsecutivo && (
                      <div className={`flex items-center gap-1.5 ${esMio ? "flex-row-reverse" : "flex-row"}`}>
                        {esOwnerMsg
                          ? <span className="text-xs owner-name font-bold">{msg.autorNombre}</span>
                          : <span className="text-xs font-semibold text-foreground">{msg.autorNombre}</span>
                        }
                        {esOwnerMsg && <OwnerBadge size="sm" />}
                        <span className="text-[10px] text-muted-foreground/50">
                          {msg.fechaEnvio ? formatDistanceToNow(new Date(msg.fechaEnvio), { locale: es, addSuffix: true }) : ""}
                        </span>
                      </div>
                    )}
                    <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed break-words
                      ${esMio
                        ? "bg-primary/20 border border-primary/30 text-foreground rounded-tr-sm"
                        : esOwnerMsg
                          ? "owner-task-card border border-amber-400/40 rounded-tl-sm"
                          : "bg-card border border-border/60 rounded-tl-sm"
                      }`}>
                      {msg.contenido}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Input area ── */}
          <div className="p-3 border-t border-border/50 bg-card/30 flex-shrink-0">
            {esBloqueada ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/20 border border-border/30">
                <Lock className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                <span className="text-sm text-muted-foreground/60">
                  {salaInfo?.tipo === "bienvenidas"
                    ? "Este canal es de solo lectura. Los mensajes son automáticos."
                    : "Canal de información — solo el OWNER puede escribir aquí."
                  }
                </span>
              </div>
            ) : (
              <>
                <form onSubmit={enviar} className="flex gap-2">
                  <Input
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    placeholder={
                      salaInfo?.tipo === "info"
                        ? `📢 Escribir anuncio en #${salaActual}...`
                        : `Mensaje en #${salaActual}...`
                    }
                    disabled={!conectado}
                    maxLength={2000}
                    className={`flex-1 bg-background/60 border-border/50 focus-visible:border-primary/50 ${
                      salaInfo?.tipo === "info" ? "border-amber-400/30 focus-visible:border-amber-400/60" : ""
                    }`}
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    disabled={!texto.trim() || !conectado}
                    size="icon"
                    className={`flex-shrink-0 ${
                      salaInfo?.tipo === "info"
                        ? "bg-amber-600/80 hover:bg-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                        : "shadow-[0_0_8px_rgba(0,255,136,0.2)]"
                    }`}
                  >
                    {salaInfo?.tipo === "info" ? <Megaphone className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
                {salaInfo?.tipo === "info" && (
                  <p className="text-[10px] text-amber-400/60 mt-1.5 flex items-center gap-1">
                    <Crown className="h-3 w-3" /> Al enviar, todos los miembros recibirán una notificación.
                  </p>
                )}
                {salaInfo?.tipo === "chat" && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Users className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/50">
                      Los mensajes son visibles para todo el equipo
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ChannelBtn({ sala, activa, onClick, locked = false }: {
  sala: Sala;
  activa: boolean;
  onClick: () => void;
  locked?: boolean;
}) {
  const Icon = sala.tipo === "bienvenidas" ? Smile : sala.tipo === "info" ? Megaphone : Hash;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-colors text-left
        ${activa
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
        }`}
    >
      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${
        sala.tipo === "info" ? "text-amber-400" :
        sala.tipo === "bienvenidas" ? "text-primary" : ""
      }`} />
      <span className="truncate flex-1">{sala.nombre}</span>
      {locked && <Lock className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground/40" />}
    </button>
  );
}
