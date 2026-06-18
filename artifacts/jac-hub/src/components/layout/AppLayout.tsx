import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout, useListNotificaciones, useHealthCheck } from "@workspace/api-client-react";
import {
  LayoutDashboard, Kanban, ListTodo, Bug,
  Users, Package, Bell, Settings, LogOut, Loader2, Menu,
  MessageCircle, CalendarDays, ClipboardList, Puzzle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { OwnerBadge } from "@/components/OwnerBadge";
import { OWNER_EMAIL } from "@/hooks/use-admin";
import { useDesktopNotifications } from "@/hooks/use-desktop-notifications";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: _health } = useHealthCheck();
  const logoutMutation = useLogout();
  const { data: notificaciones } = useListNotificaciones();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notificaciones?.filter(n => !n.leida).length || 0;
  const isOwner = user?.email === OWNER_EMAIL;

  // Fire native OS popups when running inside the Electron desktop app
  useDesktopNotifications();

  useEffect(() => {
    if (!isUserLoading && !user) {
      setLocation("/login");
    }
  }, [isUserLoading, user, setLocation]);

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
    { href: "/proyectos",      label: "Proyectos",      icon: Kanban },
    { href: "/tareas",         label: "Tareas",          icon: ListTodo },
    { href: "/chat",           label: "Chat",            icon: MessageCircle },
    { href: "/planning",       label: "Planning",        icon: CalendarDays },
    { href: "/bugs",           label: "Bugs",            icon: Bug },
    { href: "/equipo",         label: "Equipo",          icon: Users },
    { href: "/builds",         label: "Builds",          icon: Package },
    { href: "/storyboard",     label: "Tareas Personales", icon: ClipboardList },
    { href: "/extensiones",    label: "Extensiones",     icon: Puzzle },
    { href: "/notificaciones", label: "Notificaciones",  icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { href: "/configuracion",  label: "Configuración",   icon: Settings },
  ];

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => setLocation("/login"),
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* ── Sidebar Desktop ── */}
      <aside className="hidden md:flex w-56 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-lg uppercase tracking-wider">
            <div className="w-7 h-7 rounded bg-primary/10 border border-primary flex items-center justify-center shadow-[0_0_10px_rgba(0,255,136,0.3)] text-sm">
              J
            </div>
            JAC Hub
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors text-sm
                  ${isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_10px_rgba(0,255,136,0.1)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="default" className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 h-4">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`w-full justify-start gap-2 px-2 hover:bg-sidebar-accent ${isOwner ? 'owner-sidebar-btn' : ''}`}>
                <Avatar className={`h-7 w-7 flex-shrink-0 ${isOwner ? 'owner-avatar' : 'border border-primary/30'}`}>
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className={`text-xs font-bold ${isOwner ? 'bg-amber-900/40 text-amber-300' : 'bg-sidebar-accent text-primary'}`}>
                    {user.nombre.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left truncate flex-1 min-w-0">
                  <div className="flex items-center gap-1 w-full">
                    {isOwner
                      ? <span className="text-xs font-bold owner-name truncate">{user.nombre}</span>
                      : <span className="text-xs font-medium leading-none truncate">{user.nombre}</span>
                    }
                    {isOwner && <OwnerBadge size="sm" showLabel={false} />}
                  </div>
                  <div className="mt-0.5">
                    {isOwner
                      ? <OwnerBadge size="sm" />
                      : <span className="text-[10px] text-muted-foreground">{user.rol}</span>
                    }
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-popover border-popover-border">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    {isOwner ? <span className="owner-name font-bold">{user.nombre}</span> : user.nombre}
                    {isOwner && <OwnerBadge size="sm" />}
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => setLocation("/configuracion")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile topbar */}
        <header className="h-14 flex md:hidden items-center justify-between px-4 border-b border-border bg-card sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold">
            <div className="w-6 h-6 rounded bg-primary/10 border border-primary flex items-center justify-center text-xs">J</div>
            JAC
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px]">{unreadCount}</Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-5 w-5 text-foreground" />
            </Button>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background/97 backdrop-blur-sm md:hidden flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2.5">
                <Avatar className={`h-9 w-9 ${isOwner ? 'owner-avatar' : 'border border-primary/30'}`}>
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className={`font-bold ${isOwner ? 'bg-amber-900/40 text-amber-300' : 'bg-muted text-primary'}`}>
                    {user.nombre.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    {isOwner
                      ? <span className="text-sm font-bold owner-name">{user.nombre}</span>
                      : <span className="text-sm font-medium">{user.nombre}</span>
                    }
                    {isOwner && <OwnerBadge size="sm" showLabel={false} />}
                  </div>
                  {isOwner ? <OwnerBadge size="sm" /> : <span className="text-xs text-muted-foreground">{user.rol}</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl leading-none">&times;</span>
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2 content-start">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors
                    ${location === item.href
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/40 bg-card/30 text-foreground hover:bg-card/60"
                    }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge className="ml-auto bg-primary text-primary-foreground text-[10px] px-1">{item.badge}</Badge>
                  )}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <Button variant="destructive" className="w-full justify-center" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
