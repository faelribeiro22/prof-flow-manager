-- ============================================
-- FIX: Profiles INSERT Policy
-- ============================================
-- Problema: Não havia policy para permitir INSERT na tabela profiles,
-- o que impedia o trigger de criar perfis automaticamente.
-- Adicionalmente, melhoramos a função do trigger para garantir que
-- o role seja extraído corretamente dos metadados.
-- ============================================

-- Adicionar policy para permitir que o trigger crie perfis
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON profiles;
CREATE POLICY "Allow service role to insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Melhorar a função do trigger para garantir role correto
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_extraido text;
  role_final public.user_role;
BEGIN
  -- Log para debug (visível no Supabase Dashboard > Logs)
  RAISE LOG 'Trigger handle_new_user executado para user_id: %', NEW.id;
  RAISE LOG 'raw_user_meta_data: %', NEW.raw_user_meta_data;
  
  -- Extrai o role do metadado de forma segura
  role_extraido := NEW.raw_user_meta_data->>'role';
  RAISE LOG 'Role extraído: %', role_extraido;
  
  -- Verifica se é um role válido, senão usa teacher como padrão
  IF role_extraido = 'admin' THEN
    role_final := 'admin'::public.user_role;
  ELSE
    role_final := 'teacher'::public.user_role;
  END IF;
  
  RAISE LOG 'Role final: %', role_final;

  -- Insere o perfil com o role correto
  INSERT INTO public.profiles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, role_final, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET role = role_final, updated_at = NOW();
  
  RAISE LOG 'Perfil criado/atualizado com sucesso para user_id: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro ao criar perfil para user_id %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Retorna NEW mesmo em caso de erro para não bloquear o registro
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger existe e está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Adicionar índice para melhorar performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role ON profiles(user_id, role);

-- ============================================
-- Verificação de integridade
-- ============================================

-- Criar perfis para usuários auth.users que não têm perfil
-- (útil se o trigger falhou no passado)
INSERT INTO profiles (user_id, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    (au.raw_user_meta_data->>'role')::user_role,
    'teacher'::user_role
  ),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- Comentários explicativos
-- ============================================

COMMENT ON POLICY "Allow service role to insert profiles" ON profiles IS 
'Permite que o trigger crie perfis automaticamente quando um novo usuário é registrado';

COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function que cria automaticamente um perfil na tabela profiles quando um novo usuário é criado em auth.users. Extrai o role dos metadados (raw_user_meta_data) e usa "teacher" como padrão se o role não for "admin".';
