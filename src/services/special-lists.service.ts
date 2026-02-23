/**
 * Special Lists Service
 *
 * Serviço para operações CRUD de listas especiais no Supabase.
 * Centraliza toda a lógica de acesso a dados de listas especiais.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SpecialList = Database['public']['Tables']['special_lists']['Row'];
type SpecialListInsert = Database['public']['Tables']['special_lists']['Insert'];
type SpecialListUpdate = Database['public']['Tables']['special_lists']['Update'];

export type SpecialListWithTeacher = SpecialList & {
  teachers: {
    id: string;
    name: string;
  };
};

/**
 * Busca todas as entradas de listas especiais por tipo
 *
 * @param listType - Tipo da lista ('restricted' ou 'best')
 * @returns Lista de entradas ordenada por data de criação
 * @throws Error se falhar ao buscar
 */
export async function getSpecialListsByType(
  listType: string
): Promise<SpecialListWithTeacher[]> {
  const { data, error } = await supabase
    .from('special_lists')
    .select(`
      *,
      teachers (
        id,
        name
      )
    `)
    .eq('list_type', listType)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching special lists:', error);
    throw new Error('Erro ao buscar listas especiais');
  }

  return (data as SpecialListWithTeacher[]) || [];
}

/**
 * Cria uma nova entrada em uma lista especial
 *
 * @param data - Dados da entrada
 * @returns Entrada criada
 * @throws Error se falhar ao criar
 */
export async function createSpecialListEntry(
  data: SpecialListInsert
): Promise<SpecialList> {
  const { data: created, error } = await supabase
    .from('special_lists')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating special list entry:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Erro ao criar entrada na lista especial: ${error.message}`);
  }

  return created;
}

/**
 * Atualiza uma entrada de lista especial
 *
 * @param id - ID da entrada
 * @param data - Dados para atualizar
 * @returns Entrada atualizada
 * @throws Error se falhar ao atualizar
 */
export async function updateSpecialListEntry(
  id: string,
  data: SpecialListUpdate
): Promise<SpecialList> {
  const { data: updated, error } = await supabase
    .from('special_lists')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating special list entry:', error);
    throw new Error('Erro ao atualizar entrada na lista especial');
  }

  return updated;
}

/**
 * Remove uma entrada de lista especial
 *
 * @param id - ID da entrada
 * @throws Error se falhar ao remover
 */
export async function deleteSpecialListEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('special_lists')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting special list entry:', error);
    throw new Error('Erro ao remover entrada da lista especial');
  }
}

/**
 * Verifica se um professor já está em uma lista específica
 *
 * @param teacherId - ID do professor
 * @param listType - Tipo da lista
 * @returns true se o professor já está na lista
 */
export async function isTeacherInList(
  teacherId: string,
  listType: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('special_lists')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('list_type', listType)
    .maybeSingle();

  if (error) {
    console.error('Error checking teacher in list:', error);
    return false;
  }

  return data !== null;
}

/**
 * Busca a entrada de lista especial de um professor por tipo
 *
 * @param teacherId - ID do professor
 * @param listType - Tipo da lista
 * @returns Entrada da lista especial ou null se não encontrada
 */
export async function getTeacherSpecialListEntry(
  teacherId: string,
  listType: string
): Promise<SpecialList | null> {
  const { data, error } = await supabase
    .from('special_lists')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('list_type', listType)
    .maybeSingle();

  if (error) {
    console.error('Error fetching teacher special list entry:', error);
    return null;
  }

  return data;
}
