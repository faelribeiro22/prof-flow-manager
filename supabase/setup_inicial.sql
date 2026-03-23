-- ================================================================
-- AGENDAPRO - SCRIPT DE SETUP INICIAL COMPLETO
-- ================================================================
-- Este script configura TODO o banco de dados do zero no Supabase.
-- Inclui: enums, tabelas, triggers, RLS, índices, constraints,
--         funções, views, seed data e conformidade LGPD.
--
-- COMO EXECUTAR:
--   1. Acesse o SQL Editor no dashboard do Supabase
--   2. Cole este script inteiro
--   3. Execute (RUN)
--   4. Verifique se não há erros no output
--
-- NOTAS:
--   - Execute este script APENAS UMA VEZ em um banco novo
--   - Usa IF NOT EXISTS / DROP IF EXISTS para ser idempotente
--   - Após rodar, crie o primeiro usuário admin pelo app
--
-- Última atualização: 2026-03-23
-- ================================================================


-- ================================================================
-- 1. ENUMS (TIPOS CUSTOMIZADOS)
-- ================================================================

-- Role do usuário: admin ou teacher
DO $do$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'teacher');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $do$;

-- Status de um slot de horário
DO $do$ BEGIN
  CREATE TYPE public.schedule_status AS ENUM ('livre', 'com_aluno', 'indisponivel');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $do$;

-- Nível do professor
DO $do$ BEGIN
  CREATE TYPE public.teacher_level AS ENUM ('iniciante', 'intermediario', 'avancado', 'nativo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $do$;

-- Desempenho em sala do professor
DO $do$ BEGIN
  CREATE TYPE public.teacher_performance AS ENUM ('ruim', 'regular', 'bom', 'excelente');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $do$;

-- Tipo de consentimento LGPD
DO $do$ BEGIN
  CREATE TYPE public.consent_type AS ENUM ('privacy_policy', 'data_processing', 'marketing');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $do$;


-- ================================================================
-- 2. TABELAS
-- ================================================================

-- ------------------------------------------------
-- 2.1 PROFILES
-- Perfil do usuário (criado automaticamente via trigger)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'teacher',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_profiles_user_id UNIQUE (user_id)
);

COMMENT ON TABLE public.profiles IS 'Perfil de autenticação do usuário, com seu role (admin/teacher)';

-- ------------------------------------------------
-- 2.2 TEACHERS
-- Dados do professor
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  district TEXT,
  level public.teacher_level NOT NULL DEFAULT 'iniciante',
  has_international_certification BOOLEAN NOT NULL DEFAULT false,
  performance public.teacher_performance DEFAULT NULL,
  academic_background TEXT,
  last_schedule_access TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.teachers IS 'Dados completos do professor';
COMMENT ON COLUMN public.teachers.district IS 'Distrito do professor para classificação e busca.';
COMMENT ON COLUMN public.teachers.performance IS 'Desempenho em sala de aula - acesso restrito a admin';
COMMENT ON COLUMN public.teachers.academic_background IS 'Formação acadêmica do professor';

-- ------------------------------------------------
-- 2.3 SCHEDULES
-- Horários de aula do professor
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  hour INTEGER NOT NULL,
  minute INTEGER NOT NULL DEFAULT 0,
  end_hour INTEGER NOT NULL,
  end_minute INTEGER NOT NULL DEFAULT 0,
  status public.schedule_status NOT NULL DEFAULT 'livre',
  student_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.schedules IS 'Horários de aula dos professores';
COMMENT ON COLUMN public.schedules.end_hour IS 'Hora de término da aula (0-23)';
COMMENT ON COLUMN public.schedules.end_minute IS 'Minuto de término da aula (0-59)';

-- ------------------------------------------------
-- 2.4 SPECIAL_LISTS
-- Listas especiais (férias, licença, etc.)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.special_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  list_type TEXT NOT NULL,
  observation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.special_lists IS 'Listas especiais dos professores (férias, licença, etc.)';

-- ------------------------------------------------
-- 2.5 TEACHER_ADDRESSES
-- Endereço do professor (acesso restrito a admin)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  cep VARCHAR(9) NOT NULL,
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(100),
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_teacher_address UNIQUE (teacher_id)
);

COMMENT ON TABLE public.teacher_addresses IS 'Endereços dos professores - acesso restrito a admin';

-- ------------------------------------------------
-- 2.6 LESSON_TYPES
-- Tipos de aula disponíveis no sistema
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.lesson_types IS 'Tipos de aula disponíveis no sistema';

-- ------------------------------------------------
-- 2.7 TEACHER_LESSON_TYPES
-- Relacionamento N:N entre professor e tipo de aula
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_lesson_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  lesson_type_id UUID NOT NULL REFERENCES public.lesson_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_teacher_lesson_type UNIQUE (teacher_id, lesson_type_id)
);

COMMENT ON TABLE public.teacher_lesson_types IS 'Relação muitos-para-muitos entre professores e tipos de aula';

-- ------------------------------------------------
-- 2.8 USER_CONSENTS (LGPD)
-- Consentimentos do usuário
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type public.consent_type NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, consent_type)
);

COMMENT ON TABLE public.user_consents IS 'Consentimentos LGPD do usuário';

-- ------------------------------------------------
-- 2.9 AUDIT_LOGS (LGPD)
-- Logs de auditoria
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria para conformidade LGPD';

-- ------------------------------------------------
-- 2.10 DATA_SUBJECT_REQUESTS (LGPD - DSAR)
-- Solicitações de direitos do titular
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL,   -- 'access', 'rectification', 'deletion', 'portability'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  request_details TEXT,
  response_details TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.data_subject_requests IS 'Solicitações de direitos de titulares (LGPD/DSAR)';


-- ================================================================
-- 3. CONSTRAINTS (VALIDAÇÕES ADICIONAIS)
-- ================================================================

-- SCHEDULES: dia da semana (0 = Domingo ... 6 = Sábado)
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS check_day_of_week;
ALTER TABLE public.schedules ADD CONSTRAINT check_day_of_week
  CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- SCHEDULES: hora de início (0-23)
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS check_hour;
ALTER TABLE public.schedules ADD CONSTRAINT check_hour
  CHECK (hour >= 0 AND hour <= 23);

-- SCHEDULES: minuto de início (0-59)
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS valid_minute;
ALTER TABLE public.schedules ADD CONSTRAINT valid_minute
  CHECK (minute >= 0 AND minute <= 59);

-- SCHEDULES: hora de fim (0-23)
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS valid_end_hour;
ALTER TABLE public.schedules ADD CONSTRAINT valid_end_hour
  CHECK (end_hour >= 0 AND end_hour <= 23);

-- SCHEDULES: minuto de fim (0-59)
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS valid_end_minute;
ALTER TABLE public.schedules ADD CONSTRAINT valid_end_minute
  CHECK (end_minute >= 0 AND end_minute <= 59);

-- SCHEDULES: horário de fim deve ser depois do início
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS valid_time_range;
ALTER TABLE public.schedules ADD CONSTRAINT valid_time_range
  CHECK (
    (end_hour > hour OR (end_hour = hour AND end_minute > minute))
    OR (hour >= 22 AND end_hour <= 2)
  );

-- SCHEDULES: unicidade de slot (professor + dia + hora + minuto)
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS schedules_teacher_day_hour_minute_unique;
ALTER TABLE public.schedules ADD CONSTRAINT schedules_teacher_day_hour_minute_unique
  UNIQUE (teacher_id, day_of_week, hour, minute);

-- SPECIAL_LISTS: tipos permitidos
ALTER TABLE public.special_lists DROP CONSTRAINT IF EXISTS special_lists_list_type_check;
ALTER TABLE public.special_lists ADD CONSTRAINT special_lists_list_type_check
  CHECK (list_type IN ('ferias', 'licenca_medica', 'afastamento', 'outro', 'restricted', 'best'));

-- TEACHERS: distrito do professor (migração 012)
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS district TEXT;


-- ================================================================
-- 4. FUNÇÕES AUXILIARES
-- ================================================================

-- ------------------------------------------------
-- 4.1 Trigger: atualizar updated_at automaticamente
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $fn$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- ------------------------------------------------
-- 4.2 Trigger: criar perfil ao registrar novo usuário
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $fn$
DECLARE
  role_extraido text;
  role_final public.user_role;
BEGIN
  RAISE LOG 'Trigger handle_new_user executado para user_id: %', NEW.id;
  RAISE LOG 'raw_user_meta_data: %', NEW.raw_user_meta_data;

  -- Extrai o role do metadado do signup
  role_extraido := NEW.raw_user_meta_data->>'role';
  RAISE LOG 'Role extraído: %', role_extraido;

  -- Valida se é 'admin', senão usa 'teacher' como padrão
  IF role_extraido = 'admin' THEN
    role_final := 'admin'::public.user_role;
  ELSE
    role_final := 'teacher'::public.user_role;
  END IF;

  RAISE LOG 'Role final: %', role_final;

  -- Cria o perfil (ou atualiza se já existir)
  INSERT INTO public.profiles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, role_final, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET role = role_final, updated_at = NOW();

  RAISE LOG 'Perfil criado/atualizado com sucesso para user_id: %', NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro ao criar perfil para user_id %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Trigger que cria perfil na tabela profiles quando um novo usuário Auth é criado. '
  'Extrai o role de raw_user_meta_data e usa "teacher" como padrão.';

-- ------------------------------------------------
-- 4.3 Busca de professores disponíveis (simples)
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_available_teachers(
  p_day_of_week INTEGER,
  p_hour INTEGER,
  p_level TEXT DEFAULT NULL,
  p_has_certification BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  level TEXT,
  has_international_certification BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $fn$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.*
  FROM public.teachers t
  WHERE EXISTS (
    SELECT 1 FROM public.schedules s
    WHERE s.teacher_id = t.id
      AND s.day_of_week = p_day_of_week
      AND s.hour = p_hour
      AND s.status::TEXT = 'livre'
  )
  AND (p_level IS NULL OR t.level::TEXT = p_level)
  AND (p_has_certification IS NULL OR t.has_international_certification = p_has_certification)
  ORDER BY t.name;
END;
$fn$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.search_available_teachers IS
  'Busca professores disponíveis em um dia/hora específico. Usa cast explícito para enum.';

-- ------------------------------------------------
-- 4.4 Busca avançada de professores (com múltiplos filtros)
-- ------------------------------------------------
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
$fn$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

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

-- ------------------------------------------------
-- 4.5 Obter tipos de aula de um professor
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_teacher_lesson_types(teacher_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT
) AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    lt.id,
    lt.name,
    lt.description
  FROM public.lesson_types lt
  INNER JOIN public.teacher_lesson_types tlt ON lt.id = tlt.lesson_type_id
  WHERE tlt.teacher_id = teacher_id_param
  ORDER BY lt.name;
END;
$fn$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_teacher_lesson_types IS
  'Retorna os tipos de aula de um professor específico.';

-- ------------------------------------------------
-- 4.6 Contar horários livres de um professor
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_free_hours(p_teacher_id UUID)
RETURNS INTEGER AS $fn$
DECLARE
  free_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO free_count
  FROM public.schedules
  WHERE teacher_id = p_teacher_id
    AND status::TEXT = 'livre';
  RETURN free_count;
END;
$fn$ LANGUAGE plpgsql;

-- ------------------------------------------------
-- 4.7 Verificar se professor está em lista especial ativa
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_teacher_in_special_list(
  p_teacher_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $fn$
DECLARE
  in_list BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.special_lists
    WHERE teacher_id = p_teacher_id
  ) INTO in_list;
  RETURN in_list;
END;
$fn$ LANGUAGE plpgsql;

-- ------------------------------------------------
-- 4.8 Registrar ação de auditoria (LGPD)
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_user_id UUID,
  p_action VARCHAR(100),
  p_table_name VARCHAR(100) DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $fn$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values, details)
  VALUES (p_user_id, p_action, p_table_name, p_record_id, p_old_values, p_new_values, p_details)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_audit_action IS
  'Registra uma ação de auditoria no log (conformidade LGPD).';

-- ------------------------------------------------
-- 4.9 Obter role do usuário
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS public.user_role AS $fn$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE user_id = p_user_id;
  RETURN v_role;
END;
$fn$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_role IS
  'Retorna o role (admin/teacher) de um usuário pelo seu ID.';

-- ------------------------------------------------
-- 4.10 Reset de senha padrao por admin (sem e-mail)
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reset_user_password_to_default(
  p_user_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_target_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem resetar senhas';
  END IF;

  SELECT id
  INTO v_target_user_id
  FROM auth.users
  WHERE email = p_user_email
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao encontrado para o e-mail informado';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt('123456', extensions.gen_salt('bf')),
    updated_at = NOW()
  WHERE id = v_target_user_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_reset_user_password_to_default(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password_to_default(TEXT) TO authenticated;

COMMENT ON FUNCTION public.admin_reset_user_password_to_default(TEXT) IS
  'Permite que admin resete senha para o padrao 123456 sem envio de e-mail.';

-- ------------------------------------------------
-- 4.11 Listar todos os usuarios (admin/professor) - apenas admin
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT,
  role public.user_role,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuarios';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    COALESCE(t.name, au.raw_user_meta_data->>'name', 'Sem nome') AS name,
    COALESCE(t.email, au.email, '') AS email,
    p.role,
    au.created_at
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.teachers t ON t.user_id = p.user_id
  ORDER BY p.role DESC, name;
END;
$fn$;

REVOKE ALL ON FUNCTION public.list_all_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated;

COMMENT ON FUNCTION public.list_all_users() IS
  'Retorna lista de todos os usuarios (admin e professor) para visualizacao administrativa.';

-- ------------------------------------------------
-- 4.12 RPC: Admin delete user with cascading data
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  admin_count INT;
  target_role public.user_role;
BEGIN
  -- Verifica se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar usuarios';
  END IF;

  -- Impede auto-deleção
  IF auth.uid() = user_id_to_delete THEN
    RAISE EXCEPTION 'Nao e permitido deletar sua propria conta';
  END IF;

  -- Obtém o role do usuário a ser deletado
  SELECT role INTO target_role FROM public.profiles WHERE user_id = user_id_to_delete;
  
  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Usuario nao encontrado';
  END IF;

  -- Se é admin, verifica se há outros admins
  IF target_role = 'admin' THEN
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE role = 'admin' AND user_id != user_id_to_delete;
    
    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Nao e permitido deletar o ultimo administrador do sistema';
    END IF;
  END IF;

  -- Deleta em cascata
  DELETE FROM public.schedules
  WHERE teacher_id IN (
    SELECT id FROM public.teachers WHERE user_id = user_id_to_delete
  );

  DELETE FROM public.special_lists
  WHERE teacher_id IN (
    SELECT id FROM public.teachers WHERE user_id = user_id_to_delete
  );

  DELETE FROM public.teachers WHERE user_id = user_id_to_delete;
  DELETE FROM public.profiles WHERE user_id = user_id_to_delete;
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

COMMENT ON FUNCTION public.admin_delete_user(UUID) IS
  'Deleta um usuario (admin ou professor) com validacoes de seguranca e cascata de dados relacionados.';


-- ================================================================
-- 5. TRIGGERS
-- ================================================================

-- ------------------------------------------------
-- 5.1 Trigger: criar perfil automático ao criar usuário
-- ------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------
-- 5.2 Triggers: updated_at automático em todas as tabelas
-- ------------------------------------------------
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teachers_updated_at ON public.teachers;
CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_special_lists_updated_at ON public.special_lists;
CREATE TRIGGER update_special_lists_updated_at
  BEFORE UPDATE ON public.special_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_addresses_updated_at ON public.teacher_addresses;
CREATE TRIGGER update_teacher_addresses_updated_at
  BEFORE UPDATE ON public.teacher_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_types_updated_at ON public.lesson_types;
CREATE TRIGGER update_lesson_types_updated_at
  BEFORE UPDATE ON public.lesson_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_consents_updated_at ON public.user_consents;
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_subject_requests_updated_at ON public.data_subject_requests;
CREATE TRIGGER update_data_subject_requests_updated_at
  BEFORE UPDATE ON public.data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ================================================================

-- ------------------------------------------------
-- 6.1 PROFILES
-- ------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON public.profiles;

-- Leitura: próprio perfil OU admin lê todos
-- Usa get_user_role() (SECURITY DEFINER) para evitar recursão infinita
CREATE POLICY "Users can read profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Atualização do próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin pode atualizar qualquer perfil
-- Usa get_user_role() (SECURITY DEFINER) para evitar recursão infinita
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Permitir INSERT pelo trigger (SECURITY DEFINER)
CREATE POLICY "Allow service role to insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

COMMENT ON POLICY "Allow service role to insert profiles" ON public.profiles IS
  'Permite que o trigger crie perfis automaticamente quando um novo usuário é registrado';

-- ------------------------------------------------
-- 6.2 TEACHERS
-- ------------------------------------------------
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own teacher profile" ON public.teachers;
DROP POLICY IF EXISTS "Users can read own teacher profile" ON public.teachers;
DROP POLICY IF EXISTS "Admins can read all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Users can update own teacher profile" ON public.teachers;
DROP POLICY IF EXISTS "Admins can update all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can delete teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can insert teachers" ON public.teachers;

-- Professor pode inserir seu próprio registro
CREATE POLICY "Users can insert own teacher profile"
  ON public.teachers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin pode inserir qualquer professor
CREATE POLICY "Admins can insert teachers"
  ON public.teachers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Professor pode ler seu próprio registro
CREATE POLICY "Users can read own teacher profile"
  ON public.teachers FOR SELECT
  USING (auth.uid() = user_id);

-- Admin pode ler todos os professores
CREATE POLICY "Admins can read all teachers"
  ON public.teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Professor pode atualizar seu próprio registro
CREATE POLICY "Users can update own teacher profile"
  ON public.teachers FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin pode atualizar todos os professores
CREATE POLICY "Admins can update all teachers"
  ON public.teachers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin pode deletar professores
CREATE POLICY "Admins can delete teachers"
  ON public.teachers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ------------------------------------------------
-- 6.3 SCHEDULES
-- ------------------------------------------------
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage own schedule" ON public.schedules;
DROP POLICY IF EXISTS "Admins can manage all schedules" ON public.schedules;
DROP POLICY IF EXISTS "Anyone can view schedules" ON public.schedules;

-- Professor pode gerenciar seus próprios horários
CREATE POLICY "Teachers can manage own schedule"
  ON public.schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.id = schedules.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Admin pode gerenciar todos os horários
CREATE POLICY "Admins can manage all schedules"
  ON public.schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Qualquer autenticado pode visualizar horários
CREATE POLICY "Anyone can view schedules"
  ON public.schedules FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ------------------------------------------------
-- 6.4 SPECIAL_LISTS
-- ------------------------------------------------
ALTER TABLE public.special_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage own lists" ON public.special_lists;
DROP POLICY IF EXISTS "Admins can manage all lists" ON public.special_lists;
DROP POLICY IF EXISTS "Anyone can view lists" ON public.special_lists;
DROP POLICY IF EXISTS "Admins can select all lists" ON public.special_lists;
DROP POLICY IF EXISTS "Admins can insert lists" ON public.special_lists;
DROP POLICY IF EXISTS "Admins can update lists" ON public.special_lists;
DROP POLICY IF EXISTS "Admins can delete lists" ON public.special_lists;
DROP POLICY IF EXISTS "Teachers can select own lists" ON public.special_lists;
DROP POLICY IF EXISTS "Teachers can insert own lists" ON public.special_lists;
DROP POLICY IF EXISTS "Teachers can update own lists" ON public.special_lists;
DROP POLICY IF EXISTS "Teachers can delete own lists" ON public.special_lists;

-- Admin: SELECT
CREATE POLICY "Admins can select all lists"
  ON public.special_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin: INSERT
CREATE POLICY "Admins can insert lists"
  ON public.special_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin: UPDATE
CREATE POLICY "Admins can update lists"
  ON public.special_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin: DELETE
CREATE POLICY "Admins can delete lists"
  ON public.special_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Teacher: SELECT próprias listas
CREATE POLICY "Teachers can select own lists"
  ON public.special_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.id = special_lists.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Teacher: INSERT próprias listas
CREATE POLICY "Teachers can insert own lists"
  ON public.special_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.id = teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Teacher: UPDATE próprias listas
CREATE POLICY "Teachers can update own lists"
  ON public.special_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.id = special_lists.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Teacher: DELETE próprias listas
CREATE POLICY "Teachers can delete own lists"
  ON public.special_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.id = special_lists.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- ------------------------------------------------
-- 6.5 TEACHER_ADDRESSES (acesso restrito a admin)
-- ------------------------------------------------
ALTER TABLE public.teacher_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view all addresses" ON public.teacher_addresses;
DROP POLICY IF EXISTS "Admin can insert addresses" ON public.teacher_addresses;
DROP POLICY IF EXISTS "Admin can update addresses" ON public.teacher_addresses;
DROP POLICY IF EXISTS "Admin can delete addresses" ON public.teacher_addresses;

CREATE POLICY "Admin can view all addresses"
  ON public.teacher_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert addresses"
  ON public.teacher_addresses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update addresses"
  ON public.teacher_addresses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete addresses"
  ON public.teacher_addresses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ------------------------------------------------
-- 6.6 LESSON_TYPES
-- ------------------------------------------------
ALTER TABLE public.lesson_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view lesson types" ON public.lesson_types;
DROP POLICY IF EXISTS "Admin can insert lesson types" ON public.lesson_types;
DROP POLICY IF EXISTS "Admin can update lesson types" ON public.lesson_types;
DROP POLICY IF EXISTS "Admin can delete lesson types" ON public.lesson_types;

CREATE POLICY "Everyone can view lesson types"
  ON public.lesson_types FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert lesson types"
  ON public.lesson_types FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update lesson types"
  ON public.lesson_types FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete lesson types"
  ON public.lesson_types FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ------------------------------------------------
-- 6.7 TEACHER_LESSON_TYPES
-- ------------------------------------------------
ALTER TABLE public.teacher_lesson_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view teacher lesson types" ON public.teacher_lesson_types;
DROP POLICY IF EXISTS "Admin can insert teacher lesson types" ON public.teacher_lesson_types;
DROP POLICY IF EXISTS "Admin can delete teacher lesson types" ON public.teacher_lesson_types;
DROP POLICY IF EXISTS "Teachers can insert own teacher lesson types" ON public.teacher_lesson_types;
DROP POLICY IF EXISTS "Teachers can delete own teacher lesson types" ON public.teacher_lesson_types;

CREATE POLICY "Everyone can view teacher lesson types"
  ON public.teacher_lesson_types FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert teacher lesson types"
  ON public.teacher_lesson_types FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete teacher lesson types"
  ON public.teacher_lesson_types FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can insert own teacher lesson types"
  ON public.teacher_lesson_types FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.id = teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete own teacher lesson types"
  ON public.teacher_lesson_types FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.id = public.teacher_lesson_types.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- ------------------------------------------------
-- 6.8 USER_CONSENTS (LGPD)
-- ------------------------------------------------
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can update own consents" ON public.user_consents;

CREATE POLICY "Users can view own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
  ON public.user_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- ------------------------------------------------
-- 6.9 AUDIT_LOGS (LGPD - somente admin lê)
-- ------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ------------------------------------------------
-- 6.10 DATA_SUBJECT_REQUESTS (LGPD)
-- ------------------------------------------------
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests" ON public.data_subject_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON public.data_subject_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.data_subject_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON public.data_subject_requests;

CREATE POLICY "Users can view own requests"
  ON public.data_subject_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests"
  ON public.data_subject_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.data_subject_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update requests"
  ON public.data_subject_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


-- ================================================================
-- 7. ÍNDICES PARA OTIMIZAÇÃO
-- ================================================================

-- PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role ON public.profiles(user_id, role);

-- TEACHERS
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_level ON public.teachers(level);
CREATE INDEX IF NOT EXISTS idx_teachers_certification ON public.teachers(has_international_certification);
CREATE INDEX IF NOT EXISTS idx_teachers_performance ON public.teachers(performance);
CREATE INDEX IF NOT EXISTS idx_teachers_academic_background ON public.teachers USING gin(to_tsvector('portuguese', academic_background));

-- SCHEDULES
CREATE INDEX IF NOT EXISTS idx_schedules_teacher_id ON public.schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_day_hour ON public.schedules(day_of_week, hour);
CREATE INDEX IF NOT EXISTS idx_schedules_hour_minute ON public.schedules(hour, minute);
CREATE INDEX IF NOT EXISTS idx_schedules_time_range ON public.schedules(hour, minute, end_hour, end_minute);

-- SPECIAL_LISTS
CREATE INDEX IF NOT EXISTS idx_special_lists_teacher_id ON public.special_lists(teacher_id);
CREATE INDEX IF NOT EXISTS idx_special_lists_type ON public.special_lists(list_type);

-- TEACHER_ADDRESSES
CREATE INDEX IF NOT EXISTS idx_teacher_addresses_teacher_id ON public.teacher_addresses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_addresses_cep ON public.teacher_addresses(cep);
CREATE INDEX IF NOT EXISTS idx_teacher_addresses_city ON public.teacher_addresses(city);
CREATE INDEX IF NOT EXISTS idx_teacher_addresses_state ON public.teacher_addresses(state);

-- TEACHER_LESSON_TYPES
CREATE INDEX IF NOT EXISTS idx_teacher_lesson_types_teacher_id ON public.teacher_lesson_types(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_lesson_types_lesson_type_id ON public.teacher_lesson_types(lesson_type_id);

-- LGPD
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_user_id ON public.data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_status ON public.data_subject_requests(status);


-- ================================================================
-- 8. VIEWS
-- ================================================================

-- View: professores com contagem de horários
DROP VIEW IF EXISTS public.teachers_with_free_hours;
CREATE VIEW public.teachers_with_free_hours
WITH (security_invoker = true)
AS
SELECT
  t.*,
  COUNT(s.id) FILTER (WHERE s.status = 'livre'::schedule_status) AS free_hours_count,
  COUNT(s.id) FILTER (WHERE s.status = 'com_aluno'::schedule_status) AS occupied_hours_count
FROM public.teachers t
LEFT JOIN public.schedules s ON s.teacher_id = t.id
GROUP BY t.id;

COMMENT ON VIEW public.teachers_with_free_hours IS
  'View de professores com contagem de horários. Usa SECURITY INVOKER para respeitar RLS.';

-- View: dados públicos do professor (sem campo performance)
DROP VIEW IF EXISTS public.teachers_public;
CREATE VIEW public.teachers_public
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  name,
  email,
  phone,
  level,
  has_international_certification,
  academic_background,
  last_schedule_access,
  created_at,
  updated_at
FROM public.teachers;

COMMENT ON VIEW public.teachers_public IS
  'View pública de professores sem campos sensíveis (performance). Usa SECURITY INVOKER para respeitar RLS.';

-- Limpar view legada (se existir)
DROP VIEW IF EXISTS public.active_special_lists;


-- ================================================================
-- 9. SEED DATA (DADOS INICIAIS)
-- ================================================================

-- Tipos de aula padrão
INSERT INTO public.lesson_types (name, description) VALUES
  ('Conversação', 'Aulas focadas em prática de conversação'),
  ('Gramática', 'Aulas focadas em estruturas gramaticais'),
  ('Preparação para Exames', 'Preparação para TOEFL, IELTS, Cambridge, etc.'),
  ('Business English', 'Inglês para negócios e ambientes corporativos'),
  ('Inglês para Crianças', 'Aulas adaptadas para público infantil'),
  ('Inglês Técnico', 'Vocabulário e situações específicas de áreas técnicas'),
  ('Literatura', 'Estudo de obras literárias em inglês'),
  ('Pronúncia', 'Foco em fonética e pronúncia correta')
ON CONFLICT (name) DO NOTHING;


-- ================================================================
-- 10. VERIFICAÇÃO DE INTEGRIDADE
-- ================================================================

-- Criar perfis para usuários auth.users que não têm perfil
-- (útil se o trigger falhou em algum momento)
INSERT INTO public.profiles (user_id, role, created_at, updated_at)
SELECT
  au.id,
  COALESCE(
    (au.raw_user_meta_data->>'role')::public.user_role,
    'teacher'::public.user_role
  ),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;


-- ================================================================
-- FIM DO SCRIPT DE SETUP INICIAL
-- ================================================================
--
-- PRÓXIMOS PASSOS:
--   1. Crie o primeiro usuário admin pelo app (signUp com role 'admin')
--   2. Faça login como admin
--   3. Comece a cadastrar professores
--
-- TROUBLESHOOTING:
--   - Se o trigger não criar o perfil, verifique em:
--     Supabase Dashboard > Logs > Postgres
--   - Para re-executar, os DROP IF EXISTS garantem idempotência
--   - Teste as políticas RLS com diferentes usuários
--   - Monitore a performance com EXPLAIN ANALYZE
-- ================================================================
