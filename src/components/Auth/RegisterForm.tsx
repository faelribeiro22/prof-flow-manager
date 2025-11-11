import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signUp } from "@/integrations/supabase/auth";
import { Link } from "react-router-dom";

interface RegisterFormProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export const RegisterForm = ({ onSuccess, onBackToLogin }: RegisterFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'teacher' as 'admin' | 'teacher'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role
      });
      
      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Conta criada com sucesso",
        description: "Verifique seu email para confirmar o cadastro",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Criar Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuário</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: 'admin' | 'teacher') => setFormData({...formData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="teacher">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta? <Link to="/" className="text-primary hover:underline">Faça login</Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};