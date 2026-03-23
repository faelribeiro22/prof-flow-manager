import { supabase } from './client';
import type { AuthError, AuthResponse, User, Session } from '@supabase/supabase-js';
import type { TeacherLevel, TeacherPerformance, Teacher } from './extended-types';

const isMissingDistrictColumnError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return false;
  }

  const message = String((error as { message?: unknown }).message || '').toLowerCase();
  return (
    message.includes("could not find the 'district' column")
    || message.includes('column') && message.includes('district') && message.includes('schema cache')
  );
};

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

export interface ChangePasswordData {
  newPassword: string;
}

export interface AdminResetPasswordData {
  email: string;
  redirectTo?: string;
}

export interface AdminDefaultPasswordResetData {
  email: string;
}

export interface AdminDeleteUserData {
  userId: string;
}

export interface CreateTeacherAsAdminData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  district?: string;
  level: TeacherLevel;
  hasInternationalCertification: boolean;
  academicBackground?: string;
  performance?: TeacherPerformance;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Registra um novo usuário no Supabase
 */
export const signUp = async ({ email, password, name, role }: SignUpData): Promise<AuthResponse> => {
  console.log('[signUp] Iniciando registro:', { email, name, role });
  
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

  console.log('[signUp] Resposta do auth:', { 
    user: authResponse.data.user?.id, 
    error: authResponse.error 
  });

  if (authResponse.error) {
    console.error('[signUp] Erro no registro:', authResponse.error);
    throw authResponse.error;
  }

  // Se o registro for bem-sucedido e tivermos um usuário
  if (authResponse.data.user) {
    const userId = authResponse.data.user.id;
    console.log('[signUp] Usuário criado com ID:', userId);
    console.log('[signUp] Metadados do usuário:', authResponse.data.user.user_metadata);
    
    // Aguarda um pouco para garantir que o trigger do banco criou o perfil
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verifica se o perfil foi criado pelo trigger
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('[signUp] Perfil existente:', { profile: existingProfile, error: checkError });

    // Se o perfil não existe ou precisa ser atualizado
    if (checkError || !existingProfile || existingProfile.role !== role) {
      console.log('[signUp] Atualizando perfil com role:', role);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('user_id', userId);

      if (profileError) {
        console.error('[signUp] Erro ao atualizar perfil:', profileError);
        // Não lança erro aqui pois o perfil já foi criado pelo trigger
      } else {
        console.log('[signUp] Perfil atualizado com sucesso');
      }
    }

    // Se for um professor, cria o registro na tabela de professores
    if (role === 'teacher') {
      console.log('[signUp] Criando registro de professor');
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: userId,
          name,
          email,
          level: 'iniciante', // Valor padrão
          has_international_certification: false, // Valor padrão
        })
        .select()
        .single();

      if (teacherError) {
        console.error('[signUp] Erro ao criar professor:', teacherError);
        throw new Error(`Erro ao criar professor: ${teacherError.message}`);
      }
      
      console.log('[signUp] Professor criado com sucesso:', teacherData);
    }
    
    console.log('[signUp] Registro completo com sucesso');
  }

  return authResponse;
};

/**
 * Cria um novo professor como admin:
 * 1) Cria o usuário no Supabase Auth via signUp
 * 2) Insere o registro em public.teachers usando permissão de admin
 * NOTA: Usa autoConfirm: false para evitar disparo de eventos
 */
export const createTeacherAsAdmin = async (
  data: CreateTeacherAsAdminData
): Promise<{ userId: string; teacher: Teacher }> => {
  console.log('[createTeacherAsAdmin] Iniciando criação de professor:', data.email);
  
  const { data: sessionData } = await supabase.auth.getSession();
  const adminSession = sessionData.session;

  if (!adminSession) {
    throw new Error('Você precisa estar autenticado como admin para cadastrar professores');
  }

  console.log('[createTeacherAsAdmin] Admin autenticado:', adminSession.user.email);
  const adminUserId = adminSession.user.id;
  const adminAccessToken = adminSession.access_token;
  const adminRefreshToken = adminSession.refresh_token;

  // Cria o usuário no Auth com autoConfirm: false para evitar eventos de login
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        role: 'teacher',
      },
      emailRedirectTo: undefined, // Evita redirect
    },
  });

  if (signUpError) {
    console.error('[createTeacherAsAdmin] Erro no signUp:', signUpError);
    throw signUpError;
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    throw new Error('Não foi possível obter o usuário criado no Auth');
  }

  console.log('[createTeacherAsAdmin] Usuário criado no Auth:', userId);

  // Garante que a sessão ativa continue sendo a do admin.
  // Em alguns cenários, o signUp pode trocar o contexto para o usuário recém-criado.
  const { data: afterSignUpSessionData } = await supabase.auth.getSession();
  const currentUserId = afterSignUpSessionData.session?.user?.id;
  if (currentUserId && currentUserId !== adminUserId) {
    const { error: restoreSessionError } = await supabase.auth.setSession({
      access_token: adminAccessToken,
      refresh_token: adminRefreshToken,
    });

    if (restoreSessionError) {
      console.error('[createTeacherAsAdmin] Erro ao restaurar sessão do admin:', restoreSessionError);
      throw new Error('Não foi possível restaurar a sessão do administrador. Faça login novamente.');
    }

    console.log('[createTeacherAsAdmin] Sessão do admin restaurada com sucesso');
  }

  // Aguarda um pouco para o trigger criar o perfil
  await new Promise(resolve => setTimeout(resolve, 500));

  // Insere o professor na tabela teachers.
  // Fallback: se o banco ainda não tiver a coluna district, tenta novamente sem esse campo.
  const teacherInsertData = {
    user_id: userId,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    district: data.district || null,
    level: data.level,
    has_international_certification: data.hasInternationalCertification,
    academic_background: data.academicBackground || null,
    performance: data.performance || null,
  };

  let { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .insert(teacherInsertData)
    .select('*')
    .single();

  if (teacherError && isMissingDistrictColumnError(teacherError)) {
    console.warn('[createTeacherAsAdmin] Coluna district ausente no banco. Retentando sem district.');

    const { district: _ignoredDistrict, ...teacherInsertWithoutDistrict } = teacherInsertData;
    const retryResult = await supabase
      .from('teachers')
      .insert(teacherInsertWithoutDistrict)
      .select('*')
      .single();

    teacher = retryResult.data;
    teacherError = retryResult.error;
  }

  if (teacherError) {
    console.error('[createTeacherAsAdmin] Erro ao criar professor:', teacherError);
    throw teacherError;
  }

  console.log('[createTeacherAsAdmin] Professor criado com sucesso:', teacher.id);
  
  return { userId, teacher };
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
 * Atualiza a senha do usuário autenticado
 */
export const changeCurrentUserPassword = async ({
  newPassword,
}: ChangePasswordData): Promise<{ error: AuthError | null }> => {
  return await supabase.auth.updateUser({
    password: newPassword,
  });
};

/**
 * Dispara e-mail de recuperação de senha para um usuário (fluxo admin)
 */
export const sendPasswordResetForUser = async ({
  email,
  redirectTo,
}: AdminResetPasswordData): Promise<{ error: AuthError | null }> => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || window.location.origin,
  });
};

/**
 * Reseta a senha de um usuario para o padrao definido no banco (somente admin)
 */
export const resetUserPasswordToDefault = async ({
  email,
}: AdminDefaultPasswordResetData): Promise<void> => {
  const { error } = await supabase.rpc('admin_reset_user_password_to_default', {
    p_user_email: email,
  });

  if (error) {
    throw error;
  }
};

/**
 * Deleta um usuário (admin ou professor) com validações de segurança
 * e cascata de dados relacionados
 */
export const deleteUser = async ({
  userId,
}: AdminDeleteUserData): Promise<void> => {
  const { error } = await supabase.rpc('admin_delete_user', {
    user_id_to_delete: userId,
  });

  if (error) {
    throw error;
  }
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
 * Busca APENAS da tabela profiles (fonte única de verdade)
 * NOTA: Não usa user_metadata como fallback para evitar inconsistências
 * Inclui timeout de 10 segundos para evitar loading infinito
 */
export const getUserRole = async (userId: string): Promise<'admin' | 'teacher' | null> => {
  const TIMEOUT_MS = 10000;
  
  const fetchRole = async (): Promise<'admin' | 'teacher' | null> => {
    try {
      console.log('[getUserRole] Buscando role para userId:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('[getUserRole] Resultado da tabela profiles:', { data, error });

      if (error) {
        console.error('[getUserRole] Erro ao buscar role:', error);
        return null;
      }

      // Se encontrou na tabela profiles, retorna
      if (data?.role) {
        console.log('[getUserRole] Role encontrada na tabela profiles:', data.role);
        return data.role;
      }
      
      console.warn('[getUserRole] Nenhum role encontrado na tabela profiles');
      return null;
    } catch (error) {
      console.error('[getUserRole] Exception:', error);
      return null;
    }
  };

  // Executa com timeout global para evitar loading infinito
  const timeoutPromise = new Promise<'admin' | 'teacher' | null>((resolve) => {
    setTimeout(() => {
      console.warn('[getUserRole] Timeout atingido ao buscar role');
      resolve(null);
    }, TIMEOUT_MS);
  });

  return Promise.race([fetchRole(), timeoutPromise]);
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