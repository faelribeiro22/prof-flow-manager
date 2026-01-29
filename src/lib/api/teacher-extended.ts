// ============================================
// API - Teacher Extended Information
// ============================================
// Funções para gerenciar endereços, tipos de aula, etc.

import { supabase } from '@/integrations/supabase/client';
import type {
  TeacherAddress,
  TeacherAddressInsert,
  TeacherAddressUpdate,
  LessonType,
  LessonTypeInsert,
  TeacherSearchFilters,
  TeacherSearchResult,
  TeacherWithDetails,
} from '@/integrations/supabase/extended-types';

// ============================================
// TEACHER ADDRESSES (Admin only)
// ============================================

export const fetchTeacherAddress = async (
  teacherId: string
): Promise<TeacherAddress | null> => {
  const { data, error } = await supabase
    .from('teacher_addresses')
    .select('*')
    .eq('teacher_id', teacherId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data;
};

export const createTeacherAddress = async (
  addressData: TeacherAddressInsert
): Promise<TeacherAddress> => {
  const { data, error } = await supabase
    .from('teacher_addresses')
    .insert(addressData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTeacherAddress = async (
  teacherId: string,
  updates: TeacherAddressUpdate
): Promise<TeacherAddress> => {
  const { data, error } = await supabase
    .from('teacher_addresses')
    .update(updates)
    .eq('teacher_id', teacherId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTeacherAddress = async (teacherId: string): Promise<void> => {
  const { error } = await supabase
    .from('teacher_addresses')
    .delete()
    .eq('teacher_id', teacherId);

  if (error) throw error;
};

// ============================================
// LESSON TYPES
// ============================================

export const fetchLessonTypes = async (): Promise<LessonType[]> => {
  const { data, error } = await supabase
    .from('lesson_types')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createLessonType = async (
  lessonTypeData: LessonTypeInsert
): Promise<LessonType> => {
  const { data, error } = await supabase
    .from('lesson_types')
    .insert(lessonTypeData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateLessonType = async (
  id: string,
  updates: Partial<LessonType>
): Promise<LessonType> => {
  const { data, error } = await supabase
    .from('lesson_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteLessonType = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('lesson_types')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================
// TEACHER LESSON TYPES (Many-to-Many)
// ============================================

export const fetchTeacherLessonTypes = async (
  teacherId: string
): Promise<LessonType[]> => {
  const { data, error } = await supabase
    .from('teacher_lesson_types')
    .select('lesson_types(*)')
    .eq('teacher_id', teacherId);

  if (error) throw error;

  // Extract lesson_types from the join
  return data?.map((item: { lesson_types: LessonType }) => item.lesson_types).filter(Boolean) || [];
};

export const addTeacherLessonType = async (
  teacherId: string,
  lessonTypeId: string
): Promise<void> => {
  const { error } = await supabase
    .from('teacher_lesson_types')
    .insert({
      teacher_id: teacherId,
      lesson_type_id: lessonTypeId,
    });

  if (error) throw error;
};

export const removeTeacherLessonType = async (
  teacherId: string,
  lessonTypeId: string
): Promise<void> => {
  const { error } = await supabase
    .from('teacher_lesson_types')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('lesson_type_id', lessonTypeId);

  if (error) throw error;
};

export const updateTeacherLessonTypes = async (
  teacherId: string,
  lessonTypeIds: string[]
): Promise<void> => {
  // Remove all existing relations
  await supabase
    .from('teacher_lesson_types')
    .delete()
    .eq('teacher_id', teacherId);

  // Add new relations
  if (lessonTypeIds.length > 0) {
    const inserts = lessonTypeIds.map((lessonTypeId) => ({
      teacher_id: teacherId,
      lesson_type_id: lessonTypeId,
    }));

    const { error } = await supabase
      .from('teacher_lesson_types')
      .insert(inserts);

    if (error) throw error;
  }
};

// ============================================
// TEACHER WITH DETAILS
// ============================================

export const fetchTeacherWithDetails = async (
  teacherId: string
): Promise<TeacherWithDetails | null> => {
  // Fetch teacher
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', teacherId)
    .single();

  if (teacherError) throw teacherError;

  // Fetch address (may not exist)
  const address = await fetchTeacherAddress(teacherId).catch(() => null);

  // Fetch lesson types
  const lessonTypes = await fetchTeacherLessonTypes(teacherId);

  return {
    ...teacher,
    address,
    lesson_types: lessonTypes,
  };
};

// ============================================
// ADVANCED SEARCH
// ============================================

export const searchTeachersAdvanced = async (
  filters: TeacherSearchFilters
): Promise<TeacherSearchResult[]> => {
  const { data, error } = await supabase.rpc('search_teachers_advanced', {
    p_day_of_week: filters.dayOfWeek ?? null,
    p_hour: filters.hour ?? null,
    p_level: filters.level ?? null,
    p_has_certification: filters.hasCertification ?? null,
    p_performance: filters.performance ?? null,
    p_lesson_type_ids: filters.lessonTypeIds ?? null,
    p_academic_background: filters.academicBackground ?? null,
  });

  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return data as TeacherSearchResult[];
};

// ============================================
// CEP API (ViaCEP)
// ============================================

export interface ViaCepResponse {
  cep: string;
  logradouro: string; // street
  complemento: string;
  bairro: string; // neighborhood
  localidade: string; // city
  uf: string; // state
  erro?: boolean;
}

export const fetchAddressByCep = async (
  cep: string
): Promise<ViaCepResponse | null> => {
  try {
    // Remove non-numeric characters
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data;
  } catch (error) {
    console.error('Error fetching CEP:', error);
    return null;
  }
};
