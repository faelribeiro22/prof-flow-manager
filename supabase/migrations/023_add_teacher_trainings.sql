-- Migration: Add teacher trainings
-- Stores trainings watched by each teacher: training name, date, and content.

CREATE TABLE IF NOT EXISTS public.teacher_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  training_date DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.teacher_trainings IS
  'Trainings completed by teachers, including training name, date, and content.';
COMMENT ON COLUMN public.teacher_trainings.training_name IS
  'Name of the training watched by the teacher.';
COMMENT ON COLUMN public.teacher_trainings.training_date IS
  'Date when the teacher watched or completed the training.';
COMMENT ON COLUMN public.teacher_trainings.content IS
  'Content, topics, or modules covered in the training.';

CREATE INDEX IF NOT EXISTS idx_teacher_trainings_teacher_id
  ON public.teacher_trainings(teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_trainings_training_date
  ON public.teacher_trainings(training_date DESC);

DROP TRIGGER IF EXISTS update_teacher_trainings_updated_at ON public.teacher_trainings;
CREATE TRIGGER update_teacher_trainings_updated_at
  BEFORE UPDATE ON public.teacher_trainings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.teacher_trainings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all teacher trainings" ON public.teacher_trainings;
DROP POLICY IF EXISTS "Teachers can view own trainings" ON public.teacher_trainings;
DROP POLICY IF EXISTS "Admins can insert teacher trainings" ON public.teacher_trainings;
DROP POLICY IF EXISTS "Admins can update teacher trainings" ON public.teacher_trainings;
DROP POLICY IF EXISTS "Admins can delete teacher trainings" ON public.teacher_trainings;

CREATE POLICY "Admins can view all teacher trainings"
  ON public.teacher_trainings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can view own trainings"
  ON public.teacher_trainings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.teachers
      WHERE teachers.id = teacher_trainings.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert teacher trainings"
  ON public.teacher_trainings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update teacher trainings"
  ON public.teacher_trainings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete teacher trainings"
  ON public.teacher_trainings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
