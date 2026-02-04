/**
 * PrivacySettings Component
 *
 * Componente para gerenciar configurações de privacidade do usuário conforme LGPD.
 * Permite gerenciar consentimentos, exportar dados e solicitar exclusão de conta.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Download, 
  Trash2, 
  AlertTriangle, 
  Shield, 
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthContext';
import { useConsent } from '@/hooks/useConsent';
import { exportUserData, deleteUserData } from '@/services/lgpd.service';
import { useToast } from '@/hooks/use-toast';
import { ConsentType } from '@/services/lgpd.service';

interface ConsentItemProps {
  type: ConsentType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
}

const ConsentItem = ({ 
  title, 
  description, 
  checked, 
  onChange, 
  disabled,
  required 
}: ConsentItemProps) => (
  <div className="flex items-start justify-between py-4">
    <div className="space-y-1 pr-4">
      <div className="flex items-center gap-2">
        <Label className="font-medium">{title}</Label>
        {required && (
          <Badge variant="secondary" className="text-xs">
            Obrigatório
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled || required}
    />
  </div>
);

export const PrivacySettings = () => {
  const { user, signOut } = useAuth();
  const { hasConsent, grantConsent, revokeConsent, loading: consentsLoading } = useConsent();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConsentToggle = async (consentType: ConsentType, currentValue: boolean) => {
    if (currentValue) {
      await revokeConsent(consentType);
    } else {
      await grantConsent(consentType);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    setExporting(true);
    try {
      const data = await exportUserData(user.id);
      
      // Criar arquivo JSON para download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meus-dados-agendapro-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Dados exportados',
        description: 'Seus dados foram baixados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar seus dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      await deleteUserData(user.id);
      
      toast({
        title: 'Conta excluída',
        description: 'Seus dados foram removidos. Você será desconectado.',
      });

      // Aguardar um pouco antes de fazer logout
      setTimeout(async () => {
        await signOut();
      }, 2000);
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir sua conta. Tente novamente.',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  if (consentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Privacidade e Dados</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie suas preferências de privacidade conforme a LGPD
          </p>
        </div>
      </div>

      {/* Link para Política de Privacidade */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Política de Privacidade</p>
                <p className="text-sm text-muted-foreground">
                  Leia nossa política completa sobre tratamento de dados
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/privacidade', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver política
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consentimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consentimentos</CardTitle>
          <CardDescription>
            Gerencie suas preferências de consentimento para tratamento de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <ConsentItem
            type="privacy_policy"
            title="Política de Privacidade"
            description="Aceite dos termos de uso e política de privacidade do sistema"
            checked={hasConsent('privacy_policy')}
            onChange={(checked) => handleConsentToggle('privacy_policy', !checked)}
            required
          />
          
          <Separator />
          
          <ConsentItem
            type="data_processing"
            title="Processamento de Dados"
            description="Consentimento para processamento de dados pessoais necessários ao funcionamento do sistema"
            checked={hasConsent('data_processing')}
            onChange={(checked) => handleConsentToggle('data_processing', !checked)}
            disabled={!hasConsent('privacy_policy')}
          />
          
          <Separator />
          
          <ConsentItem
            type="marketing"
            title="Comunicações de Marketing"
            description="Receber e-mails promocionais, novidades e dicas sobre o sistema"
            checked={hasConsent('marketing')}
            onChange={(checked) => handleConsentToggle('marketing', !checked)}
          />
        </CardContent>
      </Card>

      {/* Status dos Consentimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status dos Consentimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <span>Política de Privacidade</span>
              {hasConsent('privacy_policy') ? (
                <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aceito
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Processamento de Dados</span>
              {hasConsent('data_processing') ? (
                <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aceito
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Comunicações de Marketing</span>
              {hasConsent('marketing') ? (
                <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aceito
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Não aceito
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seus Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seus Dados</CardTitle>
          <CardDescription>
            Exerça seus direitos garantidos pela LGPD
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exportar dados */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Exportar meus dados</p>
              <p className="text-sm text-muted-foreground">
                Baixe uma cópia de todos os seus dados pessoais em formato JSON
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Zona de Perigo */}
          <div className="pt-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Zona de Perigo</AlertTitle>
              <AlertDescription>
                Excluir sua conta removerá permanentemente todos os seus dados pessoais, 
                incluindo perfil, agendamentos e configurações. Esta ação não pode ser desfeita.
              </AlertDescription>
            </Alert>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full mt-4" disabled={deleting}>
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir minha conta
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Esta ação <strong>não pode ser desfeita</strong>. Isso excluirá permanentemente:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Seu perfil e dados pessoais</li>
                      <li>Todos os seus agendamentos</li>
                      <li>Suas configurações e preferências</li>
                      <li>Histórico de consentimentos</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, excluir minha conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Encarregado de Dados (DPO):</strong> Para dúvidas sobre seus dados, 
              entre em contato pelo e-mail: privacidade@agendapro.com.br
            </p>
            <p>
              <strong>Prazo de resposta:</strong> Até 15 dias úteis conforme previsto na LGPD.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
