-- ============================================
-- MIGRATION: Allow admins to insert teachers
-- ============================================
-- Necessário para permitir que administradores cadastrem novos professores
-- sem precisar trocar a sessão para o usuário recém-criado.

-- TEACHERS: Admins can insert teachers
DROP POLICY IF EXISTS "Admins can insert teachers" ON public.teachers;

CREATE POLICY "Admins can insert teachers"
  ON public.teachers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
