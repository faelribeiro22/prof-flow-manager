// ============================================
// TYPES - Extended Teacher Information
// ============================================
// Tipos TypeScript para as novas funcionalidades

import type { Database } from './types';

// ============================================
// Database Types
// ============================================

export type TeacherAddress = Database['public']['Tables']['teacher_addresses']['Row'];
export type TeacherAddressInsert = Database['public']['Tables']['teacher_addresses']['Insert'];
export type TeacherAddressUpdate = Database['public']['Tables']['teacher_addresses']['Update'];

export type LessonType = Database['public']['Tables']['lesson_types']['Row'];
export type LessonTypeInsert = Database['public']['Tables']['lesson_types']['Insert'];
export type LessonTypeUpdate = Database['public']['Tables']['lesson_types']['Update'];

export type TeacherLessonType = Database['public']['Tables']['teacher_lesson_types']['Row'];
export type TeacherLessonTypeInsert = Database['public']['Tables']['teacher_lesson_types']['Insert'];
export type TeacherLessonTypeUpdate = Database['public']['Tables']['teacher_lesson_types']['Update'];

export type Teacher = Database['public']['Tables']['teachers']['Row'];
export type TeacherInsert = Database['public']['Tables']['teachers']['Insert'];
export type TeacherUpdate = Database['public']['Tables']['teachers']['Update'];

// ============================================
// Enum Types
// ============================================

export type TeacherPerformance = Database['public']['Enums']['teacher_performance'];
export type TeacherLevel = Database['public']['Enums']['teacher_level'];

// ============================================
// Extended Types (com relacionamentos)
// ============================================

export interface TeacherWithDetails extends Teacher {
  address?: TeacherAddress | null;
  lesson_types?: LessonType[];
}

export interface TeacherSearchFilters {
  dayOfWeek?: number;
  hour?: number;
  dayOfWeekList?: number[];
  hourList?: number[];
  level?: TeacherLevel;
  hasCertification?: boolean;
  performance?: TeacherPerformance;
  lessonTypeIds?: string[];
  academicBackground?: string;
}

export interface TeacherSearchResult extends Teacher {
  free_hours_count: number;
  lesson_types?: LessonType[];
}

// ============================================
// Form Types
// ============================================

export interface TeacherAddressFormData {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface TeacherFormData {
  name: string;
  email: string;
  phone?: string;
  level: TeacherLevel;
  has_international_certification: boolean;
  academic_background?: string;
  performance?: TeacherPerformance;
  lesson_type_ids?: string[];
}

// ============================================
// Constants
// ============================================

export const TEACHER_PERFORMANCE_LABELS: Record<TeacherPerformance, string> = {
  ruim: 'Ruim',
  regular: 'Regular',
  bom: 'Bom',
  excelente: 'Excelente',
};

export const TEACHER_LEVEL_LABELS: Record<TeacherLevel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
  nativo: 'Nativo',
};

export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const;
