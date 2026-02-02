/**
 * Teachers React Query Hooks
 *
 * Hooks customizados usando React Query para gerenciar estado de professores.
 * Fornece cache automático, refetch e otimizações de performance.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import {
  getAllTeachers,
  getTeacherById,
  getTeacherByUserId,
  getTeachersByLevel,
  getCertifiedTeachers,
  searchTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '@/services/teacher.service';
import { Database } from '@/integrations/supabase/types';

type Teacher = Database['public']['Tables']['teachers']['Row'];
type TeacherInsert = Database['public']['Tables']['teachers']['Insert'];
type TeacherUpdate = Database['public']['Tables']['teachers']['Update'];

/**
 * Hook para buscar todos os professores
 *
 * @returns Query com lista de professores
 *
 * @example
 * ```tsx
 * const { data: teachers, isLoading, error } = useTeachers();
 * ```
 */
export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: getAllTeachers,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar um professor específico
 *
 * @param id - ID do professor
 * @returns Query com dados do professor
 */
export function useTeacher(id: string) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => getTeacherById(id),
    enabled: !!id, // Só executa se ID estiver definido
  });
}

/**
 * Hook para buscar um professor pelo user_id (ID do auth.users)
 *
 * @param userId - ID do usuário (auth.users)
 * @returns Query com dados do professor
 */
export function useTeacherByUserId(userId: string) {
  return useQuery({
    queryKey: ['teachers', 'user', userId],
    queryFn: () => getTeacherByUserId(userId),
    enabled: !!userId,
  });
}

/**
 * Hook para buscar professores por nível
 *
 * @param level - Nível de proficiência
 * @returns Query com professores do nível especificado
 */
export function useTeachersByLevel(
  level: 'iniciante' | 'intermediario' | 'avancado' | 'nativo'
) {
  return useQuery({
    queryKey: ['teachers', 'level', level],
    queryFn: () => getTeachersByLevel(level),
  });
}

/**
 * Hook para buscar professores certificados
 *
 * @returns Query com professores certificados
 */
export function useCertifiedTeachers() {
  return useQuery({
    queryKey: ['teachers', 'certified'],
    queryFn: getCertifiedTeachers,
  });
}

/**
 * Hook para buscar professores por termo
 *
 * @param searchTerm - Termo de busca
 * @returns Query com resultados da busca
 */
export function useSearchTeachers(searchTerm: string) {
  return useQuery({
    queryKey: ['teachers', 'search', searchTerm],
    queryFn: () => searchTeachers(searchTerm),
    enabled: searchTerm.length >= 2, // Só busca com 2+ caracteres
  });
}

/**
 * Hook para criar um novo professor
 *
 * @returns Mutation para criar professor
 *
 * @example
 * ```tsx
 * const createMutation = useCreateTeacher();
 *
 * const handleCreate = () => {
 *   createMutation.mutate({
 *     name: 'João Silva',
 *     email: 'joao@email.com',
 *     phone: '+5511999999999',
 *     level: 'intermediario',
 *   });
 * };
 * ```
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (teacher: TeacherInsert) => createTeacher(teacher),
    onSuccess: (newTeacher) => {
      // Invalida cache para refetch
      queryClient.invalidateQueries({ queryKey: ['teachers'] });

      toast({
        title: 'Professor criado',
        description: `${newTeacher.name} foi adicionado com sucesso!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar professor',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para atualizar dados de um professor
 *
 * @returns Mutation para atualizar professor
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TeacherUpdate }) =>
      updateTeacher(id, updates),
    onSuccess: (updatedTeacher) => {
      // Invalida cache específico e lista geral
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers', updatedTeacher.id] });

      toast({
        title: 'Professor atualizado',
        description: 'Dados salvos com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar professor',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para deletar um professor
 *
 * @returns Mutation para deletar professor
 */
export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });

      toast({
        title: 'Professor removido',
        description: 'Professor excluído com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover professor',
        variant: 'destructive',
      });
    },
  });
}
