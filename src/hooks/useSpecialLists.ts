/**
 * Special Lists React Query Hooks
 *
 * Hooks customizados usando React Query para gerenciar estado de listas especiais.
 * Fornece cache automático, refetch e otimizações de performance.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import {
  getSpecialListsByType,
  createSpecialListEntry,
  updateSpecialListEntry,
  deleteSpecialListEntry,
  isTeacherInList,
  getTeacherSpecialListEntry,
} from '@/services/special-lists.service';
import type { Database } from '@/integrations/supabase/types';

type SpecialListInsert = Database['public']['Tables']['special_lists']['Insert'];
type SpecialListUpdate = Database['public']['Tables']['special_lists']['Update'];

/**
 * Hook para buscar entradas de uma lista especial por tipo
 *
 * @param listType - Tipo da lista ('restricted' ou 'best')
 * @returns Query com lista de entradas
 *
 * @example
 * ```tsx
 * const { data: restrictedTeachers, isLoading } = useSpecialListsByType('restricted');
 * ```
 */
export function useSpecialListsByType(listType: string) {
  return useQuery({
    queryKey: ['special_lists', listType],
    queryFn: () => getSpecialListsByType(listType),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para criar uma nova entrada em lista especial
 *
 * @returns Mutation para criar entrada
 */
export function useCreateSpecialListEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: SpecialListInsert) => createSpecialListEntry(data),
    onSuccess: () => {
      // Invalida cache para refetch de ambas as listas
      queryClient.invalidateQueries({ queryKey: ['special_lists'] });

      toast({
        title: 'Professor adicionado',
        description: 'Professor adicionado à lista com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar professor à lista',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para atualizar uma entrada de lista especial
 *
 * @returns Mutation para atualizar entrada
 */
export function useUpdateSpecialListEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: SpecialListUpdate }) =>
      updateSpecialListEntry(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special_lists'] });

      toast({
        title: 'Entrada atualizada',
        description: 'Dados salvos com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar entrada',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para remover uma entrada de lista especial
 *
 * @returns Mutation para remover entrada
 */
export function useDeleteSpecialListEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteSpecialListEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special_lists'] });

      toast({
        title: 'Professor removido',
        description: 'Professor removido da lista com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover professor da lista',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para verificar se um professor está em uma lista
 *
 * @param teacherId - ID do professor
 * @param listType - Tipo da lista
 * @returns Query com resultado da verificação
 */
export function useIsTeacherInList(teacherId: string, listType: string) {
  return useQuery({
    queryKey: ['special_lists', 'check', teacherId, listType],
    queryFn: () => isTeacherInList(teacherId, listType),
    enabled: !!teacherId && !!listType,
  });
}

/**
 * Hook para buscar a entrada de lista especial restrita de um professor
 *
 * @param teacherId - ID do professor
 * @returns Query com a entrada da lista restrita (ou null)
 *
 * @example
 * ```tsx
 * const { data: restriction } = useTeacherRestriction(teacherId);
 * if (restriction) { // professor está na lista restrita }
 * ```
 */
export function useTeacherRestriction(teacherId: string) {
  return useQuery({
    queryKey: ['special_lists', 'restriction', teacherId],
    queryFn: () => getTeacherSpecialListEntry(teacherId, 'restricted'),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
