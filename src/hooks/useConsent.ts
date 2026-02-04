/**
 * useConsent Hook
 *
 * Hook para gerenciar consentimentos do usuário conforme LGPD.
 * Fornece funções para conceder, revogar e verificar consentimentos.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/Auth/AuthContext';
import { useToast } from './use-toast';
import {
  getUserConsents,
  grantConsent as grantConsentService,
  revokeConsent as revokeConsentService,
  ConsentRecord,
  ConsentType,
} from '@/services/lgpd.service';

interface UseConsentReturn {
  consents: ConsentRecord[];
  loading: boolean;
  error: string | null;
  hasConsent: (consentType: ConsentType) => boolean;
  grantConsent: (consentType: ConsentType) => Promise<boolean>;
  revokeConsent: (consentType: ConsentType) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useConsent(): UseConsentReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsents = useCallback(async () => {
    if (!user) {
      setConsents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserConsents(user.id);
      setConsents(data);
    } catch (err) {
      console.error('Erro ao buscar consentimentos:', err);
      setError('Não foi possível carregar os consentimentos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  const hasConsent = useCallback(
    (consentType: ConsentType): boolean => {
      const consent = consents.find((c) => c.consent_type === consentType);
      return consent?.granted ?? false;
    },
    [consents]
  );

  const grantConsent = useCallback(
    async (consentType: ConsentType): Promise<boolean> => {
      if (!user) return false;

      try {
        await grantConsentService(user.id, consentType);
        await fetchConsents();
        
        toast({
          title: 'Consentimento registrado',
          description: 'Seu consentimento foi registrado com sucesso.',
        });
        
        return true;
      } catch (err) {
        console.error('Erro ao conceder consentimento:', err);
        toast({
          title: 'Erro',
          description: 'Não foi possível registrar o consentimento.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [user, fetchConsents, toast]
  );

  const revokeConsent = useCallback(
    async (consentType: ConsentType): Promise<boolean> => {
      if (!user) return false;

      try {
        await revokeConsentService(user.id, consentType);
        await fetchConsents();
        
        toast({
          title: 'Consentimento revogado',
          description: 'Seu consentimento foi revogado com sucesso.',
        });
        
        return true;
      } catch (err) {
        console.error('Erro ao revogar consentimento:', err);
        toast({
          title: 'Erro',
          description: 'Não foi possível revogar o consentimento.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [user, fetchConsents, toast]
  );

  return {
    consents,
    loading,
    error,
    hasConsent,
    grantConsent,
    revokeConsent,
    refresh: fetchConsents,
  };
}
