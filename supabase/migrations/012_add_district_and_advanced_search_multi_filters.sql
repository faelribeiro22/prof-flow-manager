-- Migration: Add teacher district and support multi-day/multi-hour advanced search

ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS district TEXT;

CREATE OR REPLACE FUNCTION public.search_teachers_advanced(
  p_day_of_week INT DEFAULT NULL,
  p_hour INT DEFAULT NULL,
  p_day_of_week_list INT[] DEFAULT NULL,
  p_hour_list INT[] DEFAULT NULL,
  p_level TEXT DEFAULT NULL,
  p_has_certification BOOLEAN DEFAULT NULL,
  p_performance TEXT DEFAULT NULL,
  p_lesson_type_ids UUID[] DEFAULT NULL,
  p_academic_background TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  district TEXT,
  level TEXT,
  has_international_certification BOOLEAN,
  performance TEXT,
  academic_background TEXT,
  free_hours_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    t.id,
    t.user_id,
    t.name,
    t.email,
    t.phone,
    t.district,
    t.level::TEXT,
    t.has_international_certification,
    t.performance::TEXT,
    t.academic_background,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status::TEXT = 'livre') AS free_hours_count
  FROM public.teachers t
  LEFT JOIN public.schedules s ON t.id = s.teacher_id
  LEFT JOIN public.teacher_lesson_types tlt ON t.id = tlt.teacher_id
  WHERE
    (
      (
        (p_day_of_week IS NULL OR p_hour IS NULL)
        OR (
          p_day_of_week IS NOT NULL
          AND p_hour IS NOT NULL
          AND s.day_of_week = p_day_of_week
          AND s.hour = p_hour
          AND s.status::TEXT = 'livre'
        )
      )
      AND (
        p_day_of_week_list IS NULL
        OR cardinality(p_day_of_week_list) = 0
        OR s.day_of_week = ANY(p_day_of_week_list)
      )
      AND (
        p_hour_list IS NULL
        OR cardinality(p_hour_list) = 0
        OR s.hour = ANY(p_hour_list)
      )
      AND (
        (
          (p_day_of_week_list IS NULL OR cardinality(p_day_of_week_list) = 0)
          AND (p_hour_list IS NULL OR cardinality(p_hour_list) = 0)
        )
        OR s.status::TEXT = 'livre'
      )
    )
    AND (p_level IS NULL OR t.level::TEXT = p_level)
    AND (p_has_certification IS NULL OR t.has_international_certification = p_has_certification)
    AND (p_performance IS NULL OR t.performance::TEXT = p_performance)
    AND (p_lesson_type_ids IS NULL OR tlt.lesson_type_id = ANY(p_lesson_type_ids))
    AND (p_academic_background IS NULL OR t.academic_background ILIKE '%' || p_academic_background || '%')
  GROUP BY t.id, t.user_id, t.name, t.email, t.phone, t.district, t.level,
           t.has_international_certification, t.performance, t.academic_background
  ORDER BY free_hours_count DESC, t.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON COLUMN public.teachers.district IS 'Distrito do professor para classificação e busca.';
COMMENT ON FUNCTION public.search_teachers_advanced(
  INT,
  INT,
  INT[],
  INT[],
  TEXT,
  BOOLEAN,
  TEXT,
  UUID[],
  TEXT
) IS 'Busca avançada de professores com filtros simples e múltiplos (dias/horários), incluindo distrito.';