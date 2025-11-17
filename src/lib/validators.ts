/**
 * Form Validation Schemas
 *
 * Zod schemas for validating form inputs throughout the application.
 * Provides type-safe validation with helpful error messages in Portuguese.
 */

import { z } from 'zod';

/**
 * Login form validation schema
 *
 * @example
 * ```ts
 * const result = loginSchema.safeParse({ email: 'test@test.com', password: '123456' });
 * if (result.success) {
 *   // data is valid
 * }
 * ```
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  role: z.enum(['admin', 'teacher'], {
    required_error: 'Selecione um perfil',
  }).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Profile form validation schema
 *
 * Validates user profile information including phone number format
 */
export const profileSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido'),
  phone: z
    .string({ required_error: 'Telefone é obrigatório' })
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Telefone inválido. Use formato internacional (ex: +5511999999999)'
    )
    .or(
      z.string().regex(
        /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
        'Telefone inválido. Use formato: (11) 99999-9999'
      )
    ),
  level: z.enum(['iniciante', 'intermediario', 'avancado', 'nativo'], {
    required_error: 'Selecione um nível',
  }).optional(),
  hasInternationalCertification: z.boolean().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Teacher creation/edit validation schema
 */
export const teacherSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido'),
  phone: z
    .string({ required_error: 'Telefone é obrigatório' })
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Telefone inválido. Use formato internacional'
    ),
  level: z.enum(['iniciante', 'intermediario', 'avancado', 'nativo'], {
    required_error: 'Selecione um nível de proficiência',
  }),
  has_international_certification: z.boolean().default(false),
});

export type TeacherFormData = z.infer<typeof teacherSchema>;

/**
 * Schedule update validation schema
 */
export const scheduleSchema = z.object({
  teacher_id: z.string().uuid('ID do professor inválido'),
  day_of_week: z
    .number()
    .min(0, 'Dia da semana deve ser entre 0 (domingo) e 6 (sábado)')
    .max(6, 'Dia da semana deve ser entre 0 (domingo) e 6 (sábado)'),
  hour: z
    .number()
    .min(0, 'Hora deve ser entre 0 e 23')
    .max(23, 'Hora deve ser entre 0 e 23'),
  status: z.enum(['livre', 'com_aluno', 'indisponivel'], {
    required_error: 'Selecione um status',
  }),
  student_name: z
    .string()
    .min(1, 'Nome do aluno é obrigatório quando status é "com_aluno"')
    .max(100, 'Nome do aluno deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;

/**
 * WhatsApp message validation schema
 */
export const whatsappMessageSchema = z.object({
  recipientPhone: z
    .string({ required_error: 'Telefone do destinatário é obrigatório' })
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Telefone inválido. Use formato E.164 (ex: +5511999999999)'
    ),
  recipientName: z.string().optional(),
  templateName: z.string().optional(),
  messageContent: z
    .string({ required_error: 'Conteúdo da mensagem é obrigatório' })
    .min(1, 'Mensagem não pode estar vazia')
    .max(4096, 'Mensagem deve ter no máximo 4096 caracteres'),
  messageType: z.enum([
    'schedule_confirmation',
    'schedule_reminder',
    'schedule_cancellation',
    'schedule_change',
    'custom',
    'bulk',
  ], {
    required_error: 'Tipo de mensagem é obrigatório',
  }),
  variables: z.record(z.string()).optional(),
  scheduleId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
});

export type WhatsAppMessageFormData = z.infer<typeof whatsappMessageSchema>;

/**
 * Utility function to format phone number
 *
 * @param phone - Raw phone input
 * @returns Formatted phone in E.164 format
 */
export function formatPhoneToE164(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If doesn't start with country code and has 10-11 digits, add Brazil code
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    return `+55${cleaned}`;
  }

  // If already has country code but no +
  if (!phone.startsWith('+')) {
    return `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Utility function to validate and format phone number
 *
 * @param phone - Phone number to validate
 * @returns Object with validation result and formatted phone
 */
export function validateAndFormatPhone(phone: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  try {
    const formatted = formatPhoneToE164(phone);
    const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
    phoneSchema.parse(formatted);

    return {
      isValid: true,
      formatted,
    };
  } catch (error) {
    return {
      isValid: false,
      formatted: phone,
      error: 'Telefone inválido. Use formato: +5511999999999 ou (11) 99999-9999',
    };
  }
}
