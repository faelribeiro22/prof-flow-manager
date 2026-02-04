/**
 * LGPD Service
 *
 * Serviço para conformidade com a Lei Geral de Proteção de Dados (LGPD).
 * Implementa os direitos do titular de dados: acesso, retificação, exclusão e portabilidade.
 * 
 * NOTA: As tabelas user_consents, audit_logs e data_subject_requests precisam ser criadas
 * no Supabase usando a migration 005_lgpd_compliance.sql antes de usar este serviço.
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserDataExport {
  profile: Record<string, unknown> | null;
  teacher: Record<string, unknown> | null;
  schedules: Record<string, unknown>[] | null;
  specialLists: Record<string, unknown>[] | null;
  consents: Record<string, unknown>[] | null;
  exportedAt: string;
}

export type ConsentType = 'privacy_policy' | 'data_processing' | 'marketing';

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DataRequestType = 'access' | 'rectification' | 'deletion' | 'portability';
export type DataRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface DataSubjectRequest {
  id: string;
  user_id: string;
  request_type: DataRequestType;
  status: DataRequestStatus;
  request_details: string | null;
  response_details: string | null;
  requested_at: string;
  processed_at: string | null;
}

// Cliente Supabase não-tipado para tabelas LGPD (até que os tipos sejam atualizados)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lgpdClient = supabase as any;

/**
 * Exporta todos os dados pessoais de um usuário (Direito de Acesso/Portabilidade)
 * 
 * @param userId - ID do usuário
 * @returns Objeto com todos os dados pessoais do usuário
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const userData: UserDataExport = {
    profile: null,
    teacher: null,
    schedules: null,
    specialLists: null,
    consents: null,
    exportedAt: new Date().toISOString(),
  };

  try {
    // Buscar dados do perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    if (profile) {
      userData.profile = profile;
    }

    // Buscar dados do professor (se aplicável)
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, name, email, phone, level, has_international_certification, performance, academic_background, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    if (teacher) {
      userData.teacher = teacher;

      // Buscar agendamentos do professor (sem nomes de alunos - dados de terceiros)
      const { data: schedules } = await supabase
        .from('schedules')
        .select('id, day_of_week, hour, status, created_at, updated_at')
        .eq('teacher_id', teacher.id);

      userData.schedules = schedules;

      // Buscar listas especiais
      const { data: specialLists } = await supabase
        .from('special_lists')
        .select('id, list_type, observation, created_at, updated_at')
        .eq('teacher_id', teacher.id);

      userData.specialLists = specialLists;
    }

    // Buscar consentimentos (usando cliente não-tipado para tabela LGPD)
    const { data: consents } = await lgpdClient
      .from('user_consents')
      .select('id, consent_type, granted, granted_at, revoked_at, created_at')
      .eq('user_id', userId);

    userData.consents = consents;

    // Registrar ação de exportação no audit log
    await logAuditAction(userId, 'data_export', null, null, { exportedAt: userData.exportedAt });

    return userData;
  } catch (error) {
    console.error('Erro ao exportar dados do usuário:', error);
    throw new Error('Não foi possível exportar os dados do usuário');
  }
}

/**
 * Anonimiza os dados de um usuário (Direito ao Esquecimento)
 * Em vez de deletar, anonimiza para manter integridade referencial
 * 
 * @param userId - ID do usuário
 * @returns true se a operação foi bem-sucedida
 */
export async function anonymizeUserData(userId: string): Promise<boolean> {
  const timestamp = Date.now();
  const anonymizedName = `Usuário Removido #${timestamp}`;
  const anonymizedEmail = `removed_${timestamp}@anonymous.local`;

  try {
    // Buscar teacher_id primeiro
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (teacher) {
      // Anonimizar dados do professor
      const { error: teacherError } = await supabase
        .from('teachers')
        .update({
          name: anonymizedName,
          email: anonymizedEmail,
          phone: null,
          academic_background: null,
        })
        .eq('id', teacher.id);

      if (teacherError) throw teacherError;

      // Anonimizar nomes de alunos nos agendamentos
      const { error: schedulesError } = await supabase
        .from('schedules')
        .update({
          student_name: 'Aluno Removido',
        })
        .eq('teacher_id', teacher.id)
        .not('student_name', 'is', null);

      if (schedulesError) throw schedulesError;

      // Remover observações das listas especiais
      const { error: listsError } = await supabase
        .from('special_lists')
        .update({
          observation: null,
        })
        .eq('teacher_id', teacher.id);

      if (listsError) throw listsError;
    }

    // Registrar a anonimização no audit log
    await logAuditAction(userId, 'data_anonymization', 'teachers', teacher?.id || null, {
      anonymized_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Erro ao anonimizar dados do usuário:', error);
    throw new Error('Não foi possível anonimizar os dados do usuário');
  }
}

/**
 * Deleta permanentemente todos os dados de um usuário
 * Use com cuidado - operação irreversível
 * 
 * @param userId - ID do usuário
 * @returns true se a operação foi bem-sucedida
 */
export async function deleteUserData(userId: string): Promise<boolean> {
  try {
    // Registrar ação antes de deletar (para manter registro de conformidade)
    await logAuditAction(userId, 'data_deletion_requested', null, null, {
      requested_at: new Date().toISOString(),
    });

    // Buscar teacher_id primeiro
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (teacher) {
      // Deletar agendamentos
      await supabase.from('schedules').delete().eq('teacher_id', teacher.id);

      // Deletar listas especiais
      await supabase.from('special_lists').delete().eq('teacher_id', teacher.id);

      // Deletar endereço do professor
      await supabase.from('teacher_addresses').delete().eq('teacher_id', teacher.id);

      // Deletar tipos de aula do professor
      await supabase.from('teacher_lesson_types').delete().eq('teacher_id', teacher.id);

      // Deletar professor
      await supabase.from('teachers').delete().eq('id', teacher.id);
    }

    // Deletar consentimentos (usando cliente não-tipado)
    await lgpdClient.from('user_consents').delete().eq('user_id', userId);

    // Deletar solicitações de dados (usando cliente não-tipado)
    await lgpdClient.from('data_subject_requests').delete().eq('user_id', userId);

    // Deletar perfil
    await supabase.from('profiles').delete().eq('user_id', userId);

    return true;
  } catch (error) {
    console.error('Erro ao deletar dados do usuário:', error);
    throw new Error('Não foi possível deletar os dados do usuário');
  }
}

/**
 * Busca os consentimentos de um usuário
 * 
 * @param userId - ID do usuário
 * @returns Lista de consentimentos
 */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  const { data, error } = await lgpdClient
    .from('user_consents')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar consentimentos:', error);
    throw new Error('Não foi possível buscar os consentimentos');
  }

  return (data as ConsentRecord[]) || [];
}

/**
 * Concede um consentimento
 * 
 * @param userId - ID do usuário
 * @param consentType - Tipo de consentimento
 * @returns Registro de consentimento criado/atualizado
 */
export async function grantConsent(
  userId: string,
  consentType: ConsentType
): Promise<ConsentRecord> {
  const { data, error } = await lgpdClient
    .from('user_consents')
    .upsert({
      user_id: userId,
      consent_type: consentType,
      granted: true,
      granted_at: new Date().toISOString(),
      revoked_at: null,
    }, {
      onConflict: 'user_id,consent_type',
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao conceder consentimento:', error);
    throw new Error('Não foi possível registrar o consentimento');
  }

  // Registrar no audit log
  await logAuditAction(userId, 'consent_granted', 'user_consents', data.id, {
    consent_type: consentType,
  });

  return data as ConsentRecord;
}

/**
 * Revoga um consentimento
 * 
 * @param userId - ID do usuário
 * @param consentType - Tipo de consentimento
 * @returns Registro de consentimento atualizado
 */
export async function revokeConsent(
  userId: string,
  consentType: ConsentType
): Promise<ConsentRecord | null> {
  const { data, error } = await lgpdClient
    .from('user_consents')
    .update({
      granted: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('consent_type', consentType)
    .select()
    .single();

  if (error) {
    console.error('Erro ao revogar consentimento:', error);
    throw new Error('Não foi possível revogar o consentimento');
  }

  // Registrar no audit log
  if (data) {
    await logAuditAction(userId, 'consent_revoked', 'user_consents', data.id, {
      consent_type: consentType,
    });
  }

  return data as ConsentRecord | null;
}

/**
 * Verifica se o usuário possui um consentimento ativo
 * 
 * @param userId - ID do usuário
 * @param consentType - Tipo de consentimento
 * @returns true se o consentimento está ativo
 */
export async function hasActiveConsent(
  userId: string,
  consentType: ConsentType
): Promise<boolean> {
  const { data, error } = await lgpdClient
    .from('user_consents')
    .select('granted')
    .eq('user_id', userId)
    .eq('consent_type', consentType)
    .single();

  if (error || !data) {
    return false;
  }

  return data.granted;
}

/**
 * Cria uma solicitação de direitos do titular (DSAR)
 * 
 * @param userId - ID do usuário
 * @param requestType - Tipo de solicitação
 * @param details - Detalhes da solicitação
 * @returns Solicitação criada
 */
export async function createDataSubjectRequest(
  userId: string,
  requestType: DataRequestType,
  details?: string
): Promise<DataSubjectRequest> {
  const { data, error } = await lgpdClient
    .from('data_subject_requests')
    .insert({
      user_id: userId,
      request_type: requestType,
      request_details: details || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar solicitação:', error);
    throw new Error('Não foi possível criar a solicitação');
  }

  // Registrar no audit log
  await logAuditAction(userId, 'dsar_created', 'data_subject_requests', data.id, {
    request_type: requestType,
  });

  return data as DataSubjectRequest;
}

/**
 * Busca as solicitações de um usuário
 * 
 * @param userId - ID do usuário
 * @returns Lista de solicitações
 */
export async function getUserDataSubjectRequests(
  userId: string
): Promise<DataSubjectRequest[]> {
  const { data, error } = await lgpdClient
    .from('data_subject_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar solicitações:', error);
    throw new Error('Não foi possível buscar as solicitações');
  }

  return (data as DataSubjectRequest[]) || [];
}

/**
 * Registra uma ação no log de auditoria
 * 
 * @param userId - ID do usuário
 * @param action - Ação realizada
 * @param tableName - Nome da tabela afetada
 * @param recordId - ID do registro afetado
 * @param details - Detalhes adicionais
 */
async function logAuditAction(
  userId: string,
  action: string,
  tableName: string | null,
  recordId: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await lgpdClient.from('audit_logs').insert({
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      details: details || null,
    });
  } catch (error) {
    // Não falhar se o log de auditoria falhar
    console.error('Erro ao registrar audit log:', error);
  }
}
