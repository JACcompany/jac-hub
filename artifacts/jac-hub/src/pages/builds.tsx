import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListBuilds, useCreateBuild, getListBuildsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Download, Plus, GitCommit, HardDrive, Calendar, Lock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useIsAdmin } from "@/hooks/use-admin";

export default function Builds() {
  const { data: builds, isLoading } = useListBuilds({});
  const createMutation = useCreateBuild();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nuevoBuild, setNuevoBuild] = useState({ version: "", plataforma: "Windows", descripcion: "", tamano: "", changelog: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: nuevoBuild }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBuildsQueryKey({}) });
        setIsCreateOpen(false);
        setNuevoBuild({ version: "", plataforma: "Windows", descripcion: "", tamano: "", changelog: "" });
        toast({ title: "Build compilado y registrado" });
      }
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "estable": return "bg-primary/20 text-primary border-primary/30";
      case "beta": return "bg-secondary/20 text-secondary border-secondary/30";
      case "alpha": return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "en prueba": return "bg-chart-3/20 text-chart-3 border-chart-3/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Repositorio de Builds</h1>
            <p className="text-muted-foreground">Distribuciones compiladas y versiones del producto.</p>
          </div>

          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                  <Plus className="h-4 w-4" /> Subir Build
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card">
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Registrar Nueva Compilación</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Versión (Ej: v1.2.0)</Label>
                        <Input value={nuevoBuild.version} onChange={e => setNuevoBuild({...nuevoBuild, version: e.target.value})} required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Plataforma</Label>
                        <Select value={nuevoBuild.plataforma} onValueChange={v => setNuevoBuild({...nuevoBuild, plataforma: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Windows">Windows</SelectItem>
                            <SelectItem value="macOS">macOS</SelectItem>
                            <SelectItem value="Linux">Linux</SelectItem>
                            <SelectItem value="Android">Android (APK)</SelectItem>
                            <SelectItem value="Consola">Consola</SelectItem>
                            <SelectItem value="Multiplataforma">Multiplataforma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Tamaño (Ej: 1.2 GB)</Label>
                      <Input value={nuevoBuild.tamano} onChange={e => setNuevoBuild({...nuevoBuild, tamano: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Descripción Breve</Label>
                      <Input value={nuevoBuild.descripcion} onChange={e => setNuevoBuild({...nuevoBuild, descripcion: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Changelog (Opcional)</Label>
                      <Textarea value={nuevoBuild.changelog} onChange={e => setNuevoBuild({...nuevoBuild, changelog: e.target.value})} rows={4} className="font-mono text-xs" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar Subida
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
            <span>Modo lectura — solo el administrador puede subir o gestionar builds.</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : builds && builds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builds.map((build) => (
              <Card key={build.id} className="border-border hover:border-primary/40 transition-colors bg-card/80 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl font-mono">{build.version}</CardTitle>
                    </div>
                    <Badge variant="outline" className={getEstadoColor(build.estado)}>{build.estado}</Badge>
                  </div>
                  <CardDescription className="line-clamp-1 mt-1">{build.descripcion || "Sin descripción"}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 flex-1">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="h-4 w-4" />
                      <span>{build.plataforma}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-mono text-xs bg-muted px-1.5 rounded">{build.tamano || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">{format(new Date(build.fechaSubida), "dd MMM yyyy", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Download className="h-4 w-4 text-secondary/70" />
                      <span>{build.descargas || 0}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-border/50 flex justify-between gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <GitCommit className="mr-1 h-3 w-3" /> Changelog
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] border-primary/20 bg-card">
                      <DialogHeader>
                        <DialogTitle>Registro de Cambios - {build.version}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <pre className="p-4 rounded-md bg-background text-xs font-mono text-foreground/80 whitespace-pre-wrap overflow-auto max-h-[300px] border border-border">
                          {build.changelog || "No hay registro de cambios para esta versión."}
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
                    <Download className="mr-2 h-4 w-4" /> Descargar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No hay builds registradas</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              {isAdmin ? "Sube la primera compilación para comenzar el repositorio." : "El administrador aún no ha subido builds."}
            </p>
            {isAdmin && (
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Subir Build
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
