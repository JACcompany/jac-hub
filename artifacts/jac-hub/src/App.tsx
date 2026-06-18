import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Proyectos from "@/pages/proyectos";
import Equipo from "@/pages/equipo";
import Bugs from "@/pages/bugs";
import Builds from "@/pages/builds";
import Notificaciones from "@/pages/notificaciones";
import Configuracion from "@/pages/configuracion";
import Tareas from "@/pages/tareas";
import Chat from "@/pages/chat";
import Planning from "@/pages/planning";
import Storyboard from "@/pages/storyboard";
import Extensiones from "@/pages/extensiones";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => {
        window.location.href = "/dashboard";
        return null;
      }} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/proyectos" component={Proyectos} />
      <Route path="/tareas" component={Tareas} />
      <Route path="/chat" component={Chat} />
      <Route path="/planning" component={Planning} />
      <Route path="/bugs" component={Bugs} />
      <Route path="/equipo" component={Equipo} />
      <Route path="/builds" component={Builds} />
      <Route path="/storyboard" component={Storyboard} />
      <Route path="/extensiones" component={Extensiones} />
      <Route path="/notificaciones" component={Notificaciones} />
      <Route path="/configuracion" component={Configuracion} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
