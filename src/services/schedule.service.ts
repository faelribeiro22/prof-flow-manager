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
type UpcomingSchedule = Schedule & { teacher: { name: string; email: string } };

const toMinutes = (hour: number, minute = 0): number => hour * 60 + minute;

const hasTimeOverlap = (
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean => startA < endB && endA > startB;

const validateScheduleConflicts = async (schedules: ScheduleInsert[]): Promise<void> => {
  if (schedules.length === 0) return;

  type Candidate = {
    teacherId: string;
    dayOfWeek: number;
    start: number;
    end: number;
    label: string;
  };

  const candidates: Candidate[] = schedules.map((schedule) => {
    const startMinute = schedule.minute ?? 0;
    const endHour = schedule.end_hour ?? schedule.hour + 1;
    const endMinute = schedule.end_minute ?? 0;
    const start = toMinutes(schedule.hour, startMinute);
    const end = toMinutes(endHour, endMinute);

    if (end <= start) {
      throw new Error('Horario invalido: o termino deve ser maior que o inicio.');
    }

    return {
      teacherId: schedule.teacher_id,
      dayOfWeek: schedule.day_of_week,
      start,
      end,
      label: `${String(schedule.hour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
    };
  });

  // Conflitos entre os próprios novos horários
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i];
      const b = candidates[j];
      if (a.teacherId !== b.teacherId || a.dayOfWeek !== b.dayOfWeek) continue;
      if (hasTimeOverlap(a.start, a.end, b.start, b.end)) {
        throw new Error(`Conflito entre horarios selecionados no dia ${a.dayOfWeek}: ${a.label} e ${b.label}.`);
      }
    }
  }

  // Conflitos com horários já cadastrados (incluindo livres)
  const teacherIds = Array.from(new Set(candidates.map((c) => c.teacherId)));
  for (const teacherId of teacherIds) {
    const days = Array.from(
      new Set(candidates.filter((c) => c.teacherId === teacherId).map((c) => c.dayOfWeek))
    );

    const { data: existingSchedules, error } = await supabase
      .from('schedules')
      .select('teacher_id, day_of_week, hour, minute, end_hour, end_minute')
      .eq('teacher_id', teacherId)
      .in('day_of_week', days);

    if (error) {
      console.error('Error checking schedule conflicts:', error);
      throw new Error('Erro ao verificar conflitos de horario');
    }

    const existing = existingSchedules || [];
    for (const candidate of candidates.filter((c) => c.teacherId === teacherId)) {
      const conflict = existing.find((item) => {
        if (item.day_of_week !== candidate.dayOfWeek) return false;
        const itemStart = toMinutes(item.hour, item.minute ?? 0);
        const itemEnd = toMinutes(item.end_hour, item.end_minute ?? 0);
        return hasTimeOverlap(candidate.start, candidate.end, itemStart, itemEnd);
      });

      if (conflict) {
        const conflictLabel = `${String(conflict.hour).padStart(2, '0')}:${String(conflict.minute ?? 0).padStart(2, '0')} - ${String(conflict.end_hour).padStart(2, '0')}:${String(conflict.end_minute ?? 0).padStart(2, '0')}`;
        throw new Error(
          `Conflito de agenda no dia ${candidate.dayOfWeek}: ${candidate.label} conflita com horario existente ${conflictLabel}.`
        );
      }
    }
  }
};

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
  await validateScheduleConflicts([schedule]);

  const { data, error } = await supabase
    .from('schedules')
    .insert(schedule)
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule:', error);
    // Verifica se é erro de duplicação (código 23505 é unique_violation)
    if (error.code === '23505') {
      throw new Error('Este horário já existe na agenda');
    }
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
 * Cria múltiplos horários de uma vez (bulk create)
 *
 * @param schedules - Array de dados dos horários
 * @returns Array de horários criados
 */
export async function createSchedulesBulk(schedules: ScheduleInsert[]): Promise<Schedule[]> {
  await validateScheduleConflicts(schedules);

  const { data, error } = await supabase
    .from('schedules')
    .insert(schedules)
    .select();

  if (error) {
    console.error('Error creating schedules in bulk:', error);
    // Verifica se é erro de duplicação (código 23505 é unique_violation)
    if (error.code === '23505') {
      throw new Error('Um ou mais horários já existem na agenda. Verifique os horários selecionados.');
    }
    throw new Error('Erro ao criar horários');
  }

  return data || [];
}

/**
 * Busca horários para o próximo dia (usado para lembretes)
 *
 * @returns Lista de horários com aula nas próximas 24h
 */
export async function getUpcomingSchedules(): Promise<UpcomingSchedule[]> {
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

  return (data ?? []) as unknown as UpcomingSchedule[];
}
