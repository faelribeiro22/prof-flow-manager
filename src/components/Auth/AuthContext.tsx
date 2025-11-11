import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentSession, getCurrentUser, getUserRole, signOut as supabaseSignOut } from '@/integrations/supabase/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'teacher' | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'teacher' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleSignOut = useCallback(async () => {
    try {
      console.log('Iniciando logout...');
      const result = await supabaseSignOut();
      console.log('Resultado do logout:', result);
      
      if (result.error) {
        throw result.error;
      }
      
      setUser(null);
      setRole(null);
      
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar o logout',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        
        // Verifica se há uma sessão ativa
        const { data: { session } } = await getCurrentSession();
        
        if (session) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          
          if (currentUser) {
            const userRole = await getUserRole(currentUser.id);
            setRole(userRole);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do usuário',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    
    // Configura listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const userRole = await getUserRole(session.user.id);
        setRole(userRole);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const value = {
    user,
    role,
    loading,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};