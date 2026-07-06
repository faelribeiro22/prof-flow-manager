-- Migration: Fix search by day only (without time specifications)
-- 
-- Problem:
-- When filtering by p_day_of_week_list only (without p_hour_list or p_time_ranges),
-- the function returns no results because the WHERE clause requires BOTH:
-- - Either all lists are empty (first condition)
-- - OR time_ranges/hour_list are provided (second/third conditions)
-- 
-- This misses the case: "search by day only" which should return all teachers
-- with at least one free slot on that day.
--
-- Fix:
-- Add a fourth condition to handle p_day_of_week_list when NO time specifications are provided.
-- This allows searches like "find teachers available on Monday" without specifying time.

CREATE OR REPLACE FUNCTION public.search_teachers_advanced(
  p_day_of_week INT DEFAULT NULL,
  p_hour INT DEFAULT NULL,
  p_day_of_week_list INT[] DEFAULT NULL,
  p_hour_list INT[] DEFAULT NULL,
  p_time_ranges TEXT[] DEFAULT NULL,
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
) AS $fn$
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
      (p_day_of_week IS NULL OR p_hour IS NULL)
      OR EXISTS (
        SELECT 1
        FROM public.schedules s_single
        WHERE s_single.teacher_id = t.id
          AND s_single.day_of_week = p_day_of_week
          AND s_single.hour = p_hour
          AND s_single.status::TEXT = 'livre'
      )
    )
    AND (
      (
        (p_day_of_week_list IS NULL OR cardinality(p_day_of_week_list) = 0)
        AND (p_time_ranges IS NULL OR cardinality(p_time_ranges) = 0)
        AND (p_hour_list IS NULL OR cardinality(p_hour_list) = 0)
      )
      OR (
        p_time_ranges IS NOT NULL
        AND cardinality(p_time_ranges) > 0
        AND NOT EXISTS (
          SELECT 1
          FROM unnest(
            COALESCE(NULLIF(p_day_of_week_list, ARRAY[]::INT[]), ARRAY[NULL::INT])
          ) AS d(day_of_week)
          CROSS JOIN unnest(p_time_ranges) AS r(time_range)
          WHERE NOT EXISTS (
            WITH RECURSIVE
            bounds AS (
              SELECT
                (
                  split_part(split_part(r.time_range, '-', 1), ':', 1)::INT * 60
                  + split_part(split_part(r.time_range, '-', 1), ':', 2)::INT
                ) AS range_start,
                (
                  split_part(split_part(r.time_range, '-', 2), ':', 1)::INT * 60
                  + split_part(split_part(r.time_range, '-', 2), ':', 2)::INT
                ) AS range_end
            ),
            intervals AS (
              SELECT
                GREATEST(
                  (s_multi.hour * 60 + COALESCE(s_multi.minute, 0)),
                  b.range_start
                ) AS interval_start,
                LEAST(
                  (COALESCE(s_multi.end_hour, s_multi.hour + 1) * 60 + COALESCE(s_multi.end_minute, 0)),
                  b.range_end
                ) AS interval_end
              FROM public.schedules s_multi
              CROSS JOIN bounds b
              WHERE s_multi.teacher_id = t.id
                AND s_multi.status::TEXT = 'livre'
                AND (d.day_of_week IS NULL OR s_multi.day_of_week = d.day_of_week)
                AND (COALESCE(s_multi.end_hour, s_multi.hour + 1) * 60 + COALESCE(s_multi.end_minute, 0)) > b.range_start
                AND (s_multi.hour * 60 + COALESCE(s_multi.minute, 0)) < b.range_end
            ),
            coverage AS (
              SELECT i.interval_end AS covered_end
              FROM intervals i
              CROSS JOIN bounds b
              WHERE i.interval_start <= b.range_start

              UNION

              SELECT GREATEST(c.covered_end, i.interval_end) AS covered_end
              FROM coverage c
              JOIN intervals i
                ON i.interval_start <= c.covered_end
              WHERE i.interval_end > c.covered_end
            )
            SELECT 1
            FROM coverage
            CROSS JOIN bounds b
            WHERE coverage.covered_end >= b.range_end
            LIMIT 1
          )
        )
      )
      OR (
        (p_time_ranges IS NULL OR cardinality(p_time_ranges) = 0)
        AND p_hour_list IS NOT NULL
        AND cardinality(p_hour_list) > 0
        AND NOT EXISTS (
          SELECT 1
          FROM unnest(
            COALESCE(NULLIF(p_day_of_week_list, ARRAY[]::INT[]), ARRAY[NULL::INT])
          ) AS d(day_of_week)
          CROSS JOIN unnest(p_hour_list) AS h(hour)
          WHERE NOT EXISTS (
            SELECT 1
            FROM public.schedules s_multi
            WHERE s_multi.teacher_id = t.id
              AND s_multi.status::TEXT = 'livre'
              AND (d.day_of_week IS NULL OR s_multi.day_of_week = d.day_of_week)
              AND s_multi.hour = h.hour
          )
        )
      )
      OR (
        -- NEW: Handle day-only filter (no time_ranges, no hour_list)
        p_day_of_week_list IS NOT NULL
        AND cardinality(p_day_of_week_list) > 0
        AND (p_time_ranges IS NULL OR cardinality(p_time_ranges) = 0)
        AND (p_hour_list IS NULL OR cardinality(p_hour_list) = 0)
        AND EXISTS (
          SELECT 1
          FROM public.schedules s_day
          WHERE s_day.teacher_id = t.id
            AND s_day.status::TEXT = 'livre'
            AND s_day.day_of_week = ANY(p_day_of_week_list)
        )
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
$fn$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.search_teachers_advanced(
  INT,
  INT,
  INT[],
  INT[],
  TEXT[],
  TEXT,
  BOOLEAN,
  TEXT,
  UUID[],
  TEXT
) IS 'Busca avancada de professores com filtros de disponibilidade por dia, hora, range de horario, com suporte a dia-apenas.';
