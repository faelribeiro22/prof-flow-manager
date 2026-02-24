/**
 * AdminManagementView Component
 *
 * Seção para gerenciamento de usuários administradores.
 * Permite que um admin crie novos usuários admin no sistema.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Loader2, ShieldCheck, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signUp } from '@/integrations/supabase/auth';

export const AdminManagementView = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e o e-mail.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A confirmação de senha não corresponde à senha informada.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'admin',
      });

      if (error) {
        toast({
          title: 'Erro ao criar administrador',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Administrador criado',
        description: `A conta para ${formData.name} foi criada com sucesso.${data.user?.email_confirmed_at ? '' : ' O usuário deve verificar o e-mail para ativar a conta.'}`,
      });

      resetForm();
    } catch (error) {
      console.error('Erro ao criar administrador:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível criar o administrador.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Gerenciar Administradores</h2>
          <p className="text-sm text-muted-foreground">
            Crie novas contas de administrador para o sistema
          </p>
        </div>
      </div>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Administradores têm acesso completo ao sistema: gerenciar professores, agendas,
          listas especiais e criar outros administradores.
        </AlertDescription>
      </Alert>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Administrador
          </CardTitle>
          <CardDescription>
            Preencha os dados para criar uma nova conta de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Nome Completo</Label>
              <Input
                id="admin-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do administrador"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email">E-mail</Label>
              <Input
                id="admin-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="admin@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha</Label>
              <Input
                id="admin-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-confirm-password">Confirmar Senha</Label>
              <Input
                id="admin-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Repita a senha"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Administrador
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
