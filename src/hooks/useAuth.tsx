/**
 * Authentication Hook
 *
 * Custom hook para gerenciar autenticação com Supabase Auth.
 * Fornece funções para login, logout e gerenciamento de sessão.
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from './use-toast';

interface Profile {
  id: string;
  user_id: string;
  role: 'admin' | 'teacher';
  created_at?: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isTeacher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de autenticação
 * Envolva sua aplicação com este provider para habilitar autenticação
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar sessão inicial
  useEffect(() => {
    // Verificar sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Carrega perfil do usuário do banco de dados
   */
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seu perfil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Faz login com email e senha
   *
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @throws Error se credenciais inválidas
   */
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Perfil será carregado automaticamente pelo onAuthStateChange
      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso!',
      });
    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'Credenciais inválidas';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
      }

      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive',
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Faz logout do usuário
   */
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setProfile(null);

      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.role === 'admin',
    isTeacher: profile?.role === 'teacher',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acessar contexto de autenticação
 *
 * @throws Error se usado fora do AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signIn, signOut, isAdmin } = useAuth();
 *
 *   if (!user) {
 *     return <LoginForm />;
 *   }
 *
 *   return <Dashboard />;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
