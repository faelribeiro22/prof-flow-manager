/**
 * Schedules React Query Hooks
 *
 * Hooks customizados usando React Query para gerenciar estado de agendamentos.
 * Fornece cache automático, refetch e otimizações de performance.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import {
  getTeacherSchedules,
  getAvailableSchedules,
  getOccupiedSchedules,
  findAvailableTeachers,
  createSchedule,
  updateSchedule,
  bookSchedule,
  freeSchedule,
  markScheduleUnavailable,
  deleteSchedule,
  getUpcomingSchedules,
} from '@/services/schedule.service';
import { Database } from '@/integrations/supabase/types';

type Schedule = Database['public']['Tables']['schedules']['Row'];
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];

/**
 * Hook para buscar todos os horários de um professor ou todos os horários (admin)
 *
 * @param teacherId - ID do professor (opcional - se undefined, busca todos para admin)
 * @returns Query com horários do professor ou todos
 *
 * @example
 * ```tsx
 * // Para professor específico
 * const { data: schedules, isLoading } = useTeacherSchedules(teacherId);
 * 
 * // Para admin ver todos
 * const { data: schedules, isLoading } = useTeacherSchedules(undefined);
 * ```
 */
export function useTeacherSchedules(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['schedules', 'teacher', teacherId],
    queryFn: () => getTeacherSchedules(teacherId),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para buscar horários disponíveis de um professor
 *
 * @param teacherId - ID do professor
 * @returns Query com horários livres
 */
export function useAvailableSchedules(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['schedules', 'available', teacherId],
    queryFn: () => getAvailableSchedules(teacherId!),
    enabled: !!teacherId,
  });
}

/**
 * Hook para buscar horários ocupados de um professor
 *
 * @param teacherId - ID do professor
 * @returns Query com horários com aluno
 */
export function useOccupiedSchedules(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['schedules', 'occupied', teacherId],
    queryFn: () => getOccupiedSchedules(teacherId!),
    enabled: !!teacherId,
  });
}

/**
 * Hook para buscar professores disponíveis em um horário
 *
 * @param dayOfWeek - Dia da semana (0-6)
 * @param hour - Hora (0-23)
 * @returns Query com IDs de professores disponíveis
 */
export function useAvailableTeachers(
  dayOfWeek: number | undefined,
  hour: number | undefined
) {
  return useQuery({
    queryKey: ['schedules', 'available-teachers', dayOfWeek, hour],
    queryFn: () => findAvailableTeachers(dayOfWeek!, hour!),
    enabled: dayOfWeek !== undefined && hour !== undefined,
  });
}

/**
 * Hook para buscar próximos horários (para lembretes)
 *
 * @returns Query com horários das próximas 24h
 */
export function useUpcomingSchedules() {
  return useQuery({
    queryKey: ['schedules', 'upcoming'],
    queryFn: getUpcomingSchedules,
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });
}

/**
 * Hook para criar um novo horário
 *
 * @returns Mutation para criar horário
 */
export function useCreateSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (schedule: ScheduleInsert) => createSchedule(schedule),
    onSuccess: (newSchedule) => {
      // Invalida a query específica do professor
      queryClient.invalidateQueries({
        queryKey: ['schedules', 'teacher', newSchedule.teacher_id],
      });
      
      // Invalida também a query geral (usada pelo admin)
      queryClient.invalidateQueries({
        queryKey: ['schedules', 'teacher', undefined],
      });

      toast({
        title: 'Horário criado',
        description: 'Novo horário adicionado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar horário',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para atualizar um horário
 *
 * @returns Mutation para atualizar horário
 */
export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ScheduleUpdate }) =>
      updateSchedule(id, updates),
    onSuccess: (updatedSchedule) => {
      queryClient.invalidateQueries({
        queryKey: ['schedules', 'teacher', updatedSchedule.teacher_id],
      });

      toast({
        title: 'Horário atualizado',
        description: 'Horário atualizado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar horário',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para marcar horário como ocupado
 *
 * @returns Mutation para agendar horário
 */
export function useBookSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, studentName }: { id: string; studentName: string }) =>
      bookSchedule(id, studentName),
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({
        queryKey: ['schedules', 'teacher', schedule.teacher_id],
      });

      toast({
        title: 'Aula agendada',
        description: `Horário reservado para ${schedule.student_name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao agendar horário',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para liberar um horário
 *
 * @returns Mutation para liberar horário
 */
export function useFreeSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => freeSchedule(id),
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({
        queryKey: ['schedules', 'teacher', schedule.teacher_id],
      });

      toast({
        title: 'Horário liberado',
        description: 'Horário marcado como disponível!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao liberar horário',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para marcar horário como indisponível
 *
 * @returns Mutation para marcar horário indisponível
 */
export function useMarkScheduleUnavailable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => markScheduleUnavailable(id),
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({
        queryKey: ['schedules', 'teacher', schedule.teacher_id],
      });

      toast({
        title: 'Horário marcado',
        description: 'Horário marcado como indisponível!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao marcar horário',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para deletar um horário
 *
 * @returns Mutation para deletar horário
 */
export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });

      toast({
        title: 'Horário removido',
        description: 'Horário excluído com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover horário',
        variant: 'destructive',
      });
    },
  });
}
