-- ============================================
-- FIX: Profiles RLS Policies
-- ============================================
-- Problema: As políticas de RLS da tabela profiles estavam muito restritivas,
-- impedindo admins de ler perfis de outros usuários e causando queries que
-- nunca retornavam, resultando em loading infinito na aplicação.
-- ============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Usuários podem ler seu próprio perfil OU admins podem ler todos
CREATE POLICY "Users can read profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.role = 'admin'
    )
  );

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.role = 'admin'
    )
  );

-- ============================================
-- Garantir que todos os usuários tenham perfil
-- ============================================
-- Cria perfis para usuários que não têm (caso o trigger tenha falho)
INSERT INTO profiles (user_id, role, created_at, updated_at)
SELECT 
  id,
  'teacher',
  now(),
  now()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;
