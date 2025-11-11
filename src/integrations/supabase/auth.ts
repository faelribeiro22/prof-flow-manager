import { supabase } from './client';
import { AuthError, AuthResponse, User } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'teacher';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
}

/**
 * Registra um novo usuário no Supabase
 */
export const signUp = async ({ email, password, name, role }: SignUpData): Promise<AuthResponse> => {
  // Registra o usuário na autenticação do Supabase com metadados
  const authResponse = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (authResponse.error) {
    throw authResponse.error;
  }

  // Se o registro for bem-sucedido e tivermos um usuário
  if (authResponse.data.user) {
    // Aguarda um pouco para garantir que o trigger do banco criou o perfil
    await new Promise(resolve => setTimeout(resolve, 100));

    // Atualiza o perfil com o role correto (caso o trigger tenha criado com role padrão)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('user_id', authResponse.data.user.id);

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      // Não lança erro aqui pois o perfil já foi criado pelo trigger
    }

    // Se for um professor, cria o registro na tabela de professores
    if (role === 'teacher') {
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: authResponse.data.user.id,
          name,
          email,
          level: 'iniciante', // Valor padrão
          has_international_certification: false, // Valor padrão
        });

      if (teacherError) {
        console.error('Erro ao criar professor:', teacherError);
        throw new Error(`Erro ao criar professor: ${teacherError.message}`);
      }
    }
  }

  return authResponse;
};

/**
 * Realiza login de um usuário existente
 */
export const signIn = async ({ email, password }: SignInData): Promise<AuthResponse> => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

/**
 * Realiza logout do usuário atual
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  return await supabase.auth.signOut();
};

/**
 * Obtém a sessão atual do usuário
 */
export const getCurrentSession = async () => {
  return await supabase.auth.getSession();
};

/**
 * Obtém o usuário atual
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

/**
 * Obtém o papel (role) do usuário atual
 */
export const getUserRole = async (userId: string): Promise<'admin' | 'teacher' | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role;
};

/**
 * Verifica se o email já está em uso
 */
export const isEmailInUse = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('teachers')
    .select('email')
    .eq('email', email)
    .single();

  return !error && !!data;
};