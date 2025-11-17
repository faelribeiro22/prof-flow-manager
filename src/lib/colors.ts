/**
 * Color Utilities
 *
 * Centralized color management for status indicators and level badges
 * to avoid duplication across components.
 */

/**
 * Maps schedule status to Tailwind CSS background color classes
 *
 * @param status - The schedule status ('livre', 'com_aluno', 'indisponivel')
 * @returns Tailwind CSS class string for background color
 *
 * @example
 * ```tsx
 * <div className={getStatusColor('livre')}>Livre</div>
 * ```
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    livre: 'bg-status-free hover:bg-green-100',
    com_aluno: 'bg-status-occupied hover:bg-orange-100',
    indisponivel: 'bg-status-unavailable hover:bg-gray-200',
  };

  return colors[status] ?? 'bg-gray-100';
};

/**
 * Maps schedule status to Tailwind CSS text color classes
 *
 * @param status - The schedule status ('livre', 'com_aluno', 'indisponivel')
 * @returns Tailwind CSS class string for text color
 *
 * @example
 * ```tsx
 * <span className={getStatusTextColor('livre')}>Disponível</span>
 * ```
 */
export const getStatusTextColor = (status: string): string => {
  const colors: Record<string, string> = {
    livre: 'text-green-700',
    com_aluno: 'text-orange-700',
    indisponivel: 'text-gray-700',
  };

  return colors[status] ?? 'text-gray-700';
};

/**
 * Maps teacher proficiency level to Tailwind CSS text color classes
 *
 * @param level - Teacher level ('nativo', 'avancado', 'intermediario', 'iniciante')
 * @returns Tailwind CSS class string for text color
 *
 * @example
 * ```tsx
 * <Badge className={getLevelColor('nativo')}>Nativo</Badge>
 * ```
 */
export const getLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    nativo: 'text-green-600 dark:text-green-400',
    avancado: 'text-blue-600 dark:text-blue-400',
    intermediario: 'text-yellow-600 dark:text-yellow-400',
    iniciante: 'text-gray-600 dark:text-gray-400',
  };

  return colors[level] ?? 'text-gray-600';
};

/**
 * Maps teacher proficiency level to Tailwind CSS badge variant classes
 *
 * @param level - Teacher level
 * @returns Tailwind CSS class string for badge styling
 *
 * @example
 * ```tsx
 * <Badge className={getLevelBadgeColor('avancado')}>Avançado</Badge>
 * ```
 */
export const getLevelBadgeColor = (level: string): string => {
  const colors: Record<string, string> = {
    nativo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    avancado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    intermediario: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    iniciante: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return colors[level] ?? 'bg-gray-100 text-gray-800';
};

/**
 * Gets human-readable label for schedule status
 *
 * @param status - The schedule status
 * @returns Portuguese label for the status
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    livre: 'Livre',
    com_aluno: 'Com Aluno',
    indisponivel: 'Indisponível',
  };

  return labels[status] ?? 'Desconhecido';
};

/**
 * Gets human-readable label for teacher level
 *
 * @param level - The teacher level
 * @returns Portuguese label for the level
 */
export const getLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    nativo: 'Nativo',
    avancado: 'Avançado',
    intermediario: 'Intermediário',
    iniciante: 'Iniciante',
  };

  return labels[level] ?? 'Não especificado';
};
