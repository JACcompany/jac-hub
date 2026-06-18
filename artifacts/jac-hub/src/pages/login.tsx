import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      data: {
        email,
        password,
        recordarSesion: recordar
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Acceso concedido",
          description: "Bienvenido a JAC Hub",
        });
        setLocation("/dashboard");
      },
      onError: () => {
        toast({
          title: "Error de autenticación",
          description: "Credenciales inválidas. Intenta de nuevo.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Fondo decorativo cyberpunk */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-lg bg-primary/10 border-2 border-primary flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.5)] mb-4">
            <span className="text-3xl font-bold text-primary">J</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-widest uppercase">JAC Hub</h1>
          <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs">Sistema de control principal</p>
        </div>

        <Card className="border-primary/20 bg-card/90 backdrop-blur shadow-[0_0_30px_rgba(0,255,136,0.1)]">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="usuario@jachub.studio"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-primary/20 focus-visible:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50 border-primary/20 focus-visible:border-primary"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="recordar" 
                  checked={recordar}
                  onCheckedChange={(checked) => setRecordar(checked as boolean)}
                  className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="recordar" className="text-sm font-normal">
                  Recordar sesión
                </Label>
              </div>
              <Button 
                type="submit" 
                className="w-full shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_25px_rgba(0,255,136,0.5)] transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  "Conectar"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-primary/10 pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Acceso restringido a personal autorizado de JAC Studio.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}