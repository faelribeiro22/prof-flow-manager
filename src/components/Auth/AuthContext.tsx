/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentSession, getUserRole, signOut as supabaseSignOut } from '@/integrations/supabase/auth';
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
  const isMountedRef = useRef(true);
  const userIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Mantém userIdRef sincronizado
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user]);

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
    isMountedRef.current = true;
    
    const loadUser = async () => {
      try {
        console.log('[AuthContext] Iniciando loadUser...');
        
        // Verifica se há uma sessão ativa
        const { data: { session } } = await getCurrentSession();
        console.log('[AuthContext] Sessão:', session ? 'Existe' : 'Não existe');
        
        if (!isMountedRef.current) return;
        
        if (session?.user) {
          const currentUser = session.user;
          console.log('[AuthContext] User ID:', currentUser.id);
          setUser(currentUser);
          
          // Busca role da tabela profiles (fonte única de verdade)
          const userRole = await getUserRole(currentUser.id);
          
          if (!isMountedRef.current) return;
          
          console.log('[AuthContext] Role final:', userRole);
          setRole(userRole);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao carregar usuário:', error);
        if (isMountedRef.current) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (isMountedRef.current) {
          console.log('[AuthContext] Finalizando loading');
          setLoading(false);
        }
      }
    };

    // Sempre carrega usuário no mount
    loadUser();
    
    // Configura listener para mudanças na autenticação
    console.log('[AuthContext] Registrando listener de auth state change...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, 'User:', session?.user?.email);
      
      if (!isMountedRef.current) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        const currentUserId = userIdRef.current;
        const eventUserId = session.user.id;
        
        console.log('[AuthContext] Current user ID:', currentUserId);
        console.log('[AuthContext] Event user ID:', eventUserId);
        
        // Se já temos o mesmo usuário logado, ignora evento duplicado
        if (currentUserId === eventUserId) {
          console.log('[AuthContext] Ignorando SIGNED_IN duplicado do mesmo usuário');
          return;
        }
        
        // Se já temos um usuário logado e o evento é de outro usuário, ignora (admin criando professor)
        if (currentUserId && currentUserId !== eventUserId) {
          console.log('[AuthContext] Ignorando SIGNED_IN de outro usuário');
          return;
        }
        
        console.log('[AuthContext] SIGNED_IN detectado, atualizando user...');
        setUser(session.user);
        setLoading(true);
        
        // Aguarda um pouco para o trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!isMountedRef.current) return;
        
        // Busca role da tabela profiles (fonte única de verdade)
        const userRole = await getUserRole(session.user.id);
        
        if (!isMountedRef.current) return;
        
        console.log('[AuthContext] Role após SIGNED_IN:', userRole);
        setRole(userRole);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] SIGNED_OUT detectado');
        setUser(null);
        setRole(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthContext] Token refreshed');
      }
    });

    return () => {
      console.log('[AuthContext] Cleanup...');
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

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