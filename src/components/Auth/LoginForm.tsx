import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, LogIn } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { signIn } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    
    try {
      console.log('[LoginForm] Iniciando login...');
      const { data, error } = await signIn({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) {
        console.error('[LoginForm] Erro no login:', error);
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      if (data.user) {
        console.log('[LoginForm] Login bem-sucedido, user:', data.user.id);
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo de volta!",
        });
        
        // Aguarda um pouco para o AuthContext processar o onAuthStateChange
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, 500);
        });
        
        if (isMountedRef.current) {
          console.log('[LoginForm] Chamando onSuccess após delay');
          onSuccess();
        }
      }
    } catch (error) {
      console.error('[LoginForm] Exception:', error);
      
      // Ignora AbortError pois o login pode ter funcionado
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('[LoginForm] AbortError no login, mas pode ter funcionado. Aguardando...');
        
        // Aguarda um pouco e verifica se o login funcionou
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, 1500);
        });
        
        if (!isMountedRef.current) return;
        
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (sessionCheck.session?.user?.email === credentials.email) {
          console.log('[LoginForm] Login confirmado após AbortError');
          toast({
            title: "Login realizado com sucesso",
            description: "Bem-vindo de volta!",
          });
          if (isMountedRef.current) {
            onSuccess();
          }
          return;
        }
      }
      
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função de login demo removida pois não é mais necessária

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calendar className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">AgendaPro</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>
        </div>

        <Card className="shadow-custom-lg">
          <CardHeader>
            <CardTitle className="text-center">Fazer Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => {
                    setCredentials(prev => ({ ...prev, email: e.target.value }));
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="seu@email.com"
                  className={errors.email ? 'border-destructive' : ''}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => {
                    setCredentials(prev => ({ ...prev, password: e.target.value }));
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="Sua senha"
                  className={errors.password ? 'border-destructive' : ''}
                  required
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground mt-2">
                Não tem uma conta? <Link to="/register" className="text-primary hover:underline">Cadastre-se</Link>
              </p>
              <p className="text-xs text-center text-muted-foreground">
                <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Autenticação implementada com Supabase
          </p>
        </div>
      </div>
    </div>
  );
};