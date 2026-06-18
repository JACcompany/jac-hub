import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetProyecto, useUpdateProyecto, getGetProyectoQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Kanban } from "lucide-react";

export default function ProyectoDetalle() {
  const [, params] = useRoute("/proyectos/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proyecto, isLoading } = useGetProyecto(id, { 
    query: { enabled: !!id, queryKey: getGetProyectoQueryKey(id) } 
  });
  
  const updateMutation = useUpdateProyecto();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    estado: "",
    progreso: 0,
  });

  useEffect(() => {
    if (proyecto) {
      setFormData({
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion,
        estado: proyecto.estado,
        progreso: proyecto.progreso,
      });
    }
  }, [proyecto]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id,
      data: formData
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProyectoQueryKey(id) });
        toast({ title: "Proyecto actualizado" });
      }
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!proyecto) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <Kanban className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">Proyecto no encontrado</h3>
          <Button variant="link" onClick={() => setLocation("/proyectos")}>Volver a Proyectos</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/proyectos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">{proyecto.nombre}</h1>
            <p className="text-muted-foreground">Configuración y detalles del entorno.</p>
          </div>
        </div>

        <Card className="border-primary/20 bg-card/80">
          <CardHeader>
            <CardTitle>Detalles del Proyecto</CardTitle>
            <CardDescription>Actualiza los parámetros principales del proyecto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input 
                    id="nombre" 
                    value={formData.nombre} 
                    onChange={e => setFormData({...formData, nombre: e.target.value})} 
                    required 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea 
                    id="descripcion" 
                    value={formData.descripcion} 
                    onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={v => setFormData({...formData, estado: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Pausado">Pausado</SelectItem>
                        <SelectItem value="Completado">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Progreso: {formData.progreso}%</Label>
                    <div className="pt-2">
                      <Slider 
                        value={[formData.progreso]} 
                        max={100} 
                        step={1} 
                        onValueChange={v => setFormData({...formData, progreso: v[0]})}
                        className="[&>span:first-child]:bg-primary/20 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                >
                  {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}