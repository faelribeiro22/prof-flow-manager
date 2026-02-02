/**
 * Schedule Service
 *
 * Serviço para operações de agendamentos no Supabase.
 * Gerencia horários, disponibilidade e agendamentos de aulas.
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Schedule = Database['public']['Tables']['schedules']['Row'];
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];

/**
 * Busca todos os horários de um professor ou todos os horários (para admin)
 *
 * @param teacherId - ID do professor (opcional - se não informado, retorna todos)
 * @returns Lista de horários ordenada por dia e hora
 */
export async function getTeacherSchedules(teacherId?: string): Promise<Schedule[]> {
  let query = supabase
    .from('schedules')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('hour', { ascending: true });
  
  // Se teacherId foi informado, filtra por professor
  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching schedules:', error);
    throw new Error('Erro ao buscar horários');
  }

  return data || [];
}

/**
 * Busca horários disponíveis (livres) de um professor
 *
 * @param teacherId - ID do professor
 * @returns Lista de horários livres
 */
export async function getAvailableSchedules(teacherId: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('status', 'livre')
    .order('day_of_week', { ascending: true })
    .order('hour', { ascending: true });

  if (error) {
    console.error('Error fetching available schedules:', error);
    throw new Error('Erro ao buscar horários disponíveis');
  }

  return data || [];
}

/**
 * Busca horários ocupados de um professor
 *
 * @param teacherId - ID do professor
 * @returns Lista de horários com aluno
 */
export async function getOccupiedSchedules(teacherId: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('status', 'com_aluno')
    .order('day_of_week', { ascending: true })
    .order('hour', { ascending: true });

  if (error) {
    console.error('Error fetching occupied schedules:', error);
    throw new Error('Erro ao buscar horários ocupados');
  }

  return data || [];
}

/**
 * Busca professores disponíveis em um horário específico
 *
 * @param dayOfWeek - Dia da semana (0-6)
 * @param hour - Hora (0-23)
 * @returns Lista de IDs de professores disponíveis
 */
export async function findAvailableTeachers(
  dayOfWeek: number,
  hour: number
): Promise<string[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('teacher_id')
    .eq('day_of_week', dayOfWeek)
    .eq('hour', hour)
    .eq('status', 'livre');

  if (error) {
    console.error('Error finding available teachers:', error);
    throw new Error('Erro ao buscar professores disponíveis');
  }

  return data?.map((s) => s.teacher_id) || [];
}

/**
 * Cria um novo horário
 *
 * @param schedule - Dados do horário
 * @returns Horário criado
 */
export async function createSchedule(schedule: ScheduleInsert): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .insert(schedule)
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule:', error);
    throw new Error('Erro ao criar horário');
  }

  return data;
}

/**
 * Atualiza um horário existente
 *
 * @param id - ID do horário
 * @param updates - Dados a atualizar
 * @returns Horário atualizado
 */
export async function updateSchedule(
  id: string,
  updates: ScheduleUpdate
): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating schedule:', error);
    throw new Error('Erro ao atualizar horário');
  }

  return data;
}

/**
 * Marca horário como ocupado com um aluno
 *
 * @param id - ID do horário
 * @param studentName - Nome do aluno
 * @returns Horário atualizado
 */
export async function bookSchedule(id: string, studentName: string): Promise<Schedule> {
  return updateSchedule(id, {
    status: 'com_aluno',
    student_name: studentName,
  });
}

/**
 * Marca horário como livre
 *
 * @param id - ID do horário
 * @returns Horário atualizado
 */
export async function freeSchedule(id: string): Promise<Schedule> {
  return updateSchedule(id, {
    status: 'livre',
    student_name: null,
  });
}

/**
 * Marca horário como indisponível
 *
 * @param id - ID do horário
 * @returns Horário atualizado
 */
export async function markScheduleUnavailable(id: string): Promise<Schedule> {
  return updateSchedule(id, {
    status: 'indisponivel',
    student_name: null,
  });
}

/**
 * Deleta um horário
 *
 * @param id - ID do horário
 */
export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from('schedules').delete().eq('id', id);

  if (error) {
    console.error('Error deleting schedule:', error);
    throw new Error('Erro ao deletar horário');
  }
}

/**
 * Busca horários para o próximo dia (usado para lembretes)
 *
 * @returns Lista de horários com aula nas próximas 24h
 */
export async function getUpcomingSchedules(): Promise<
  (Schedule & { teacher: { name: string; email: string } })[]
> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayOfWeek = tomorrow.getDay();

  const { data, error } = await supabase
    .from('schedules')
    .select('*, teachers(name, email)')
    .eq('day_of_week', dayOfWeek)
    .eq('status', 'com_aluno')
    .not('student_name', 'is', null);

  if (error) {
    console.error('Error fetching upcoming schedules:', error);
    throw new Error('Erro ao buscar próximos horários');
  }

  return (data as any) || [];
}
