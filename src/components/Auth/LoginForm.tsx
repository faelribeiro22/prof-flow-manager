import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, LogIn } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { signIn } from "@/integrations/supabase/auth";
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
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await signIn({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      if (data.user) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo de volta!",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
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
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Sua senha"
                  required
                />
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