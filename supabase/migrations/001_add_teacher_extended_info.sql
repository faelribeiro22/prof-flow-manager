-- ============================================
-- MIGRATION: Add Extended Teacher Information
-- ============================================
-- Adiciona funcionalidades de:
-- - Endereço do professor (acesso restrito)
-- - Desempenho em sala
-- - Tipos de aula
-- - Formação acadêmica
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================

-- Enum para desempenho em sala
CREATE TYPE public.teacher_performance AS ENUM (
  'ruim',
  'regular',
  'bom',
  'excelente'
);

-- ============================================
-- 2. TABELAS
-- ============================================

-- Tabela de Endereços dos Professores
-- Acesso restrito: apenas admin (secretária/coordenação)
CREATE TABLE public.teacher_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  cep VARCHAR(9) NOT NULL, -- Formato: 12345-678
  street VARCHAR(255) NOT NULL, -- Nome da rua/avenida
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(100),
  neighborhood VARCHAR(100) NOT NULL, -- Bairro
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL, -- UF (ex: SP, RJ, MG)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: apenas um endereço por professor
  CONSTRAINT unique_teacher_address UNIQUE (teacher_id)
);

-- Tabela de Tipos de Aula
-- Um professor pode ter vários tipos de aula
CREATE TABLE public.lesson_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relacionamento Professor-Tipo de Aula (muitos para muitos)
CREATE TABLE public.teacher_lesson_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  lesson_type_id UUID NOT NULL REFERENCES public.lesson_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: evitar duplicatas
  CONSTRAINT unique_teacher_lesson_type UNIQUE (teacher_id, lesson_type_id)
);

-- ============================================
-- 3. ADICIONAR CAMPOS À TABELA TEACHERS
-- ============================================

-- Adicionar campo de desempenho em sala (acesso restrito)
ALTER TABLE public.teachers 
ADD COLUMN performance public.teacher_performance DEFAULT NULL;

-- Adicionar campo de formação acadêmica
ALTER TABLE public.teachers 
ADD COLUMN academic_background TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.teachers.performance IS 'Desempenho em sala de aula - acesso restrito a admin';
COMMENT ON COLUMN public.teachers.academic_background IS 'Formação acadêmica do professor';

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger para updated_at em teacher_addresses
DROP TRIGGER IF EXISTS update_teacher_addresses_updated_at ON public.teacher_addresses;
CREATE TRIGGER update_teacher_addresses_updated_at
  BEFORE UPDATE ON public.teacher_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at em lesson_types
DROP TRIGGER IF EXISTS update_lesson_types_updated_at ON public.lesson_types;
CREATE TRIGGER update_lesson_types_updated_at
  BEFORE UPDATE ON public.lesson_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ÍNDICES
-- ============================================

-- Índices para melhorar performance de busca
CREATE INDEX idx_teacher_addresses_teacher_id ON public.teacher_addresses(teacher_id);
CREATE INDEX idx_teacher_addresses_cep ON public.teacher_addresses(cep);
CREATE INDEX idx_teacher_addresses_city ON public.teacher_addresses(city);
CREATE INDEX idx_teacher_addresses_state ON public.teacher_addresses(state);

CREATE INDEX idx_teachers_performance ON public.teachers(performance);
CREATE INDEX idx_teachers_academic_background ON public.teachers USING gin(to_tsvector('portuguese', academic_background));

CREATE INDEX idx_teacher_lesson_types_teacher_id ON public.teacher_lesson_types(teacher_id);
CREATE INDEX idx_teacher_lesson_types_lesson_type_id ON public.teacher_lesson_types(lesson_type_id);

-- ============================================
-- 6. RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.teacher_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_lesson_types ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6.1 RLS: teacher_addresses
-- ============================================

-- APENAS ADMIN pode visualizar endereços
CREATE POLICY "Admin can view all addresses"
  ON public.teacher_addresses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- APENAS ADMIN pode inserir endereços
CREATE POLICY "Admin can insert addresses"
  ON public.teacher_addresses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- APENAS ADMIN pode atualizar endereços
CREATE POLICY "Admin can update addresses"
  ON public.teacher_addresses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- APENAS ADMIN pode deletar endereços
CREATE POLICY "Admin can delete addresses"
  ON public.teacher_addresses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 6.2 RLS: lesson_types
-- ============================================

-- Todos podem visualizar tipos de aula
CREATE POLICY "Everyone can view lesson types"
  ON public.lesson_types
  FOR SELECT
  USING (true);

-- APENAS ADMIN pode inserir tipos de aula
CREATE POLICY "Admin can insert lesson types"
  ON public.lesson_types
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- APENAS ADMIN pode atualizar tipos de aula
CREATE POLICY "Admin can update lesson types"
  ON public.lesson_types
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- APENAS ADMIN pode deletar tipos de aula
CREATE POLICY "Admin can delete lesson types"
  ON public.lesson_types
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 6.3 RLS: teacher_lesson_types
-- ============================================

-- Todos podem visualizar relação professor-tipo de aula
CREATE POLICY "Everyone can view teacher lesson types"
  ON public.teacher_lesson_types
  FOR SELECT
  USING (true);

-- APENAS ADMIN pode inserir relação
CREATE POLICY "Admin can insert teacher lesson types"
  ON public.teacher_lesson_types
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- APENAS ADMIN pode deletar relação
CREATE POLICY "Admin can delete teacher lesson types"
  ON public.teacher_lesson_types
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 6.4 RLS: Proteger campos sensíveis em teachers
-- ============================================

-- Nota: Como não é possível aplicar RLS em colunas específicas,
-- vamos criar uma VIEW para professores que oculta campos sensíveis

CREATE OR REPLACE VIEW public.teachers_public AS
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
  -- performance NÃO é incluído (acesso restrito)
FROM public.teachers;

-- Comentário explicativo
COMMENT ON VIEW public.teachers_public IS 'View pública de professores sem campos sensíveis (performance)';

-- ============================================
-- 7. DADOS INICIAIS (SEED)
-- ============================================

-- Inserir tipos de aula comuns
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

-- ============================================
-- 8. FUNÇÕES AUXILIARES
-- ============================================

-- Função para buscar professores com filtros avançados
CREATE OR REPLACE FUNCTION public.search_teachers_advanced(
  p_day_of_week INT DEFAULT NULL,
  p_hour INT DEFAULT NULL,
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
    t.level::TEXT,
    t.has_international_certification,
    t.performance::TEXT,
    t.academic_background,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'livre') AS free_hours_count
  FROM public.teachers t
  LEFT JOIN public.schedules s ON t.id = s.teacher_id
  LEFT JOIN public.teacher_lesson_types tlt ON t.id = tlt.teacher_id
  WHERE
    -- Filtro por horário disponível
    (p_day_of_week IS NULL OR p_hour IS NULL OR (
      s.day_of_week = p_day_of_week 
      AND s.hour = p_hour 
      AND s.status = 'livre'
    ))
    -- Filtro por nível
    AND (p_level IS NULL OR t.level::TEXT = p_level)
    -- Filtro por certificação
    AND (p_has_certification IS NULL OR t.has_international_certification = p_has_certification)
    -- Filtro por desempenho (apenas admin pode filtrar)
    AND (p_performance IS NULL OR t.performance::TEXT = p_performance)
    -- Filtro por tipo de aula
    AND (p_lesson_type_ids IS NULL OR tlt.lesson_type_id = ANY(p_lesson_type_ids))
    -- Filtro por formação acadêmica (busca textual)
    AND (p_academic_background IS NULL OR t.academic_background ILIKE '%' || p_academic_background || '%')
  GROUP BY t.id, t.user_id, t.name, t.email, t.phone, t.level, 
           t.has_international_certification, t.performance, t.academic_background
  ORDER BY free_hours_count DESC, t.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Função para obter tipos de aula de um professor
CREATE OR REPLACE FUNCTION public.get_teacher_lesson_types(teacher_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT
) AS $$
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 9. COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON TABLE public.teacher_addresses IS 'Endereços dos professores - acesso restrito a admin';
COMMENT ON TABLE public.lesson_types IS 'Tipos de aula disponíveis no sistema';
COMMENT ON TABLE public.teacher_lesson_types IS 'Relação muitos-para-muitos entre professores e tipos de aula';
COMMENT ON FUNCTION public.search_teachers_advanced IS 'Busca avançada de professores com múltiplos filtros';
COMMENT ON FUNCTION public.get_teacher_lesson_types IS 'Retorna os tipos de aula de um professor específico';
