import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound, Mail, Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { changeCurrentUserPassword, updateCurrentUserEmail } from '@/integrations/supabase/auth';

export const PasswordSettings = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [emailData, setEmailData] = useState({
    newEmail: '',
    confirmEmail: '',
  });

  const resetForm = () => {
    setFormData({
      newPassword: '',
      confirmPassword: '',
    });
  };

  const resetEmailForm = () => {
    setEmailData({
      newEmail: '',
      confirmEmail: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) {
      toast({
        title: 'Campos obrigatorios',
        description: 'Preencha os dois campos de senha.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Senhas nao coincidem',
        description: 'A confirmacao precisa ser igual a nova senha.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await changeCurrentUserPassword({
        newPassword: formData.newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Senha atualizada',
        description: 'Sua senha foi alterada com sucesso.',
      });
      resetForm();
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast({
        title: 'Erro ao atualizar senha',
        description:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel atualizar sua senha. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailData.newEmail || !emailData.confirmEmail) {
      toast({
        title: 'Campos obrigatorios',
        description: 'Preencha os dois campos de e-mail.',
        variant: 'destructive',
      });
      return;
    }

    if (emailData.newEmail !== emailData.confirmEmail) {
      toast({
        title: 'E-mails nao coincidem',
        description: 'A confirmacao precisa ser igual ao novo e-mail.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingEmail(true);

    try {
      await updateCurrentUserEmail(emailData.newEmail);

      toast({
        title: 'E-mail atualizado',
        description: 'Seu e-mail foi alterado com sucesso.',
      });
      resetEmailForm();
    } catch (error) {
      console.error('Erro ao atualizar e-mail:', error);
      toast({
        title: 'Erro ao atualizar e-mail',
        description:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel atualizar seu e-mail. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <KeyRound className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Seguranca da Conta</h2>
          <p className="text-sm text-muted-foreground">Troque sua senha de acesso</p>
        </div>
      </div>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          Use uma senha forte com letras, numeros e caracteres especiais sempre que possivel.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                placeholder="Digite a nova senha"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="Repita a nova senha"
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Alterar E-mail
          </CardTitle>
          <CardDescription>Atualize seu endereço de e-mail</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitEmail} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="new-email">Novo e-mail</Label>
              <Input
                id="new-email"
                type="email"
                value={emailData.newEmail}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, newEmail: e.target.value }))
                }
                placeholder="novo@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-email">Confirmar e-mail</Label>
              <Input
                id="confirm-email"
                type="email"
                value={emailData.confirmEmail}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, confirmEmail: e.target.value }))
                }
                placeholder="Repita o novo e-mail"
                required
              />
            </div>

            <Button type="submit" disabled={isSubmittingEmail}>
              {isSubmittingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar e-mail'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
