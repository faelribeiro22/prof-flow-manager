-- ============================================
-- AGENDAPRO - DATABASE SETUP
-- ============================================
-- Este arquivo contém todos os scripts SQL necessários
-- para configurar o banco de dados do AgendaPro no Supabase
-- ============================================

-- ============================================
-- 1. TRIGGERS
-- ============================================

-- Trigger para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, 'teacher'); -- role padrão é 'teacher'
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger anterior se existir e cria novo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at em todas as tabelas
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at 
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at 
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_special_lists_updated_at ON special_lists;
CREATE TRIGGER update_special_lists_updated_at 
  BEFORE UPDATE ON special_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- ============================================
-- 2.1 PROFILES
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Usuários podem ler seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 2.2 TEACHERS
-- ============================================

-- Habilitar RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can insert own teacher profile" ON teachers;
DROP POLICY IF EXISTS "Users can read own teacher profile" ON teachers;
DROP POLICY IF EXISTS "Admins can read all teachers" ON teachers;
DROP POLICY IF EXISTS "Users can update own teacher profile" ON teachers;
DROP POLICY IF EXISTS "Admins can update all teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can delete teachers" ON teachers;

-- Professores podem inserir seu próprio registro
CREATE POLICY "Users can insert own teacher profile"
  ON teachers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Professores podem ler seu próprio registro
CREATE POLICY "Users can read own teacher profile"
  ON teachers FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ler todos os professores
CREATE POLICY "Admins can read all teachers"
  ON teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Professores podem atualizar seu próprio registro
CREATE POLICY "Users can update own teacher profile"
  ON teachers FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins podem atualizar todos os professores
CREATE POLICY "Admins can update all teachers"
  ON teachers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem deletar professores
CREATE POLICY "Admins can delete teachers"
  ON teachers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 2.3 SCHEDULES
-- ============================================

-- Habilitar RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Teachers can manage own schedule" ON schedules;
DROP POLICY IF EXISTS "Admins can manage all schedules" ON schedules;
DROP POLICY IF EXISTS "Anyone can view schedules" ON schedules;

-- Professores podem gerenciar sua própria agenda (INSERT, UPDATE, DELETE)
CREATE POLICY "Teachers can manage own schedule"
  ON schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = schedules.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Admins podem gerenciar todas as agendas
CREATE POLICY "Admins can manage all schedules"
  ON schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Qualquer pessoa autenticada pode visualizar agendas (para busca)
CREATE POLICY "Anyone can view schedules"
  ON schedules FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 2.4 SPECIAL_LISTS
-- ============================================

-- Habilitar RLS
ALTER TABLE special_lists ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Teachers can manage own lists" ON special_lists;
DROP POLICY IF EXISTS "Admins can manage all lists" ON special_lists;
DROP POLICY IF EXISTS "Anyone can view lists" ON special_lists;

-- Professores podem gerenciar suas próprias listas
CREATE POLICY "Teachers can manage own lists"
  ON special_lists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = special_lists.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Admins podem gerenciar todas as listas
CREATE POLICY "Admins can manage all lists"
  ON special_lists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Qualquer pessoa autenticada pode visualizar listas (para busca)
CREATE POLICY "Anyone can view lists"
  ON special_lists FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. ÍNDICES PARA OTIMIZAÇÃO
-- ============================================

-- PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- TEACHERS
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_level ON teachers(level);
CREATE INDEX IF NOT EXISTS idx_teachers_certification ON teachers(has_international_certification);

-- SCHEDULES
CREATE INDEX IF NOT EXISTS idx_schedules_teacher_id ON schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_day_hour ON schedules(day_of_week, hour);
-- Índice único para evitar duplicação de horários
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_unique_slot 
  ON schedules(teacher_id, day_of_week, hour);

-- SPECIAL_LISTS
CREATE INDEX IF NOT EXISTS idx_special_lists_teacher_id ON special_lists(teacher_id);
CREATE INDEX IF NOT EXISTS idx_special_lists_type ON special_lists(list_type);
CREATE INDEX IF NOT EXISTS idx_special_lists_dates ON special_lists(start_date, end_date);

-- ============================================
-- 4. CONSTRAINTS ADICIONAIS
-- ============================================

-- SCHEDULES: Validar dia da semana (0-6)
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS check_day_of_week;
ALTER TABLE schedules ADD CONSTRAINT check_day_of_week 
  CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- SCHEDULES: Validar hora (8-22)
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS check_hour;
ALTER TABLE schedules ADD CONSTRAINT check_hour 
  CHECK (hour >= 8 AND hour <= 22);

-- SPECIAL_LISTS: Validar datas (end_date >= start_date)
ALTER TABLE special_lists DROP CONSTRAINT IF EXISTS check_dates;
ALTER TABLE special_lists ADD CONSTRAINT check_dates 
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- ============================================
-- 5. FUNÇÕES AUXILIARES
-- ============================================

-- Função para buscar professores disponíveis
CREATE OR REPLACE FUNCTION search_available_teachers(
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.*
  FROM teachers t
  WHERE EXISTS (
    SELECT 1 FROM schedules s
    WHERE s.teacher_id = t.id
      AND s.day_of_week = p_day_of_week
      AND s.hour = p_hour
      AND s.status = 'livre'
  )
  AND (p_level IS NULL OR t.level = p_level)
  AND (p_has_certification IS NULL OR t.has_international_certification = p_has_certification)
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar horários livres de um professor
CREATE OR REPLACE FUNCTION count_free_hours(p_teacher_id UUID)
RETURNS INTEGER AS $$
DECLARE
  free_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO free_count
  FROM schedules
  WHERE teacher_id = p_teacher_id
    AND status = 'livre';
  
  RETURN free_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se professor está em lista especial ativa
CREATE OR REPLACE FUNCTION is_teacher_in_special_list(
  p_teacher_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  in_list BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM special_lists
    WHERE teacher_id = p_teacher_id
      AND (start_date IS NULL OR start_date <= p_date)
      AND (end_date IS NULL OR end_date >= p_date)
  ) INTO in_list;
  
  RETURN in_list;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. VIEWS ÚTEIS
-- ============================================

-- View para ver professores com seus horários livres
CREATE OR REPLACE VIEW teachers_with_free_hours AS
SELECT 
  t.*,
  COUNT(s.id) FILTER (WHERE s.status = 'livre') as free_hours_count,
  COUNT(s.id) FILTER (WHERE s.status = 'ocupado') as occupied_hours_count
FROM teachers t
LEFT JOIN schedules s ON s.teacher_id = t.id
GROUP BY t.id;

-- View para ver listas especiais ativas
CREATE OR REPLACE VIEW active_special_lists AS
SELECT *
FROM special_lists
WHERE (start_date IS NULL OR start_date <= CURRENT_DATE)
  AND (end_date IS NULL OR end_date >= CURRENT_DATE);

-- ============================================
-- 7. SEED DATA (OPCIONAL - PARA TESTES)
-- ============================================

-- Comentar/descomentar conforme necessário

-- Exemplo de inserção de horários padrão para um professor
-- (8h às 22h, segunda a sexta)
/*
CREATE OR REPLACE FUNCTION create_default_schedule(p_teacher_id UUID)
RETURNS VOID AS $$
DECLARE
  day INTEGER;
  hour INTEGER;
BEGIN
  -- Loop pelos dias da semana (1-5 = Segunda a Sexta)
  FOR day IN 1..5 LOOP
    -- Loop pelas horas (8-22)
    FOR hour IN 8..22 LOOP
      INSERT INTO schedules (teacher_id, day_of_week, hour, status)
      VALUES (p_teacher_id, day, hour, 'livre')
      ON CONFLICT (teacher_id, day_of_week, hour) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
*/

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Para executar este script no Supabase:
-- 1. Acesse o SQL Editor no dashboard do Supabase
-- 2. Cole este script
-- 3. Execute (RUN)
-- 4. Verifique se não há erros

-- Observações:
-- - Execute este script apenas UMA vez após criar as tabelas
-- - Se precisar re-executar, os DROP IF EXISTS evitarão erros
-- - Teste as políticas RLS com diferentes usuários
-- - Monitore a performance das queries com EXPLAIN ANALYZE
