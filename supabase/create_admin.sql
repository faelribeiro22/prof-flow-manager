-- ================================================================
-- AGENDAPRO - CRIAR USUÁRIO ADMIN
-- ================================================================
-- Este script cria um usuário admin diretamente no banco de dados.
--
-- COMO USAR:
--   1. Altere o email e senha abaixo (linhas marcadas com ⚠️)
--   2. Cole no SQL Editor do Supabase
--   3. Execute (RUN)
--   4. Faça login no app com o email e senha definidos
--
-- IMPORTANTE:
--   - Use uma senha forte (mínimo 6 caracteres)
--   - O email NÃO pode já estar cadastrado
--   - O usuário é criado já confirmado (sem necessidade de email)
-- ================================================================

DO $admin$
DECLARE
  -- ⚠️ ALTERE AQUI: Email e senha do admin
  admin_email    TEXT := 'admin@agendapro.com';    -- ⚠️ Troque pelo email desejado
  admin_password TEXT := 'SuaSenhaForte123!';      -- ⚠️ Troque pela senha desejada

  -- Variáveis internas (não alterar)
  new_user_id    UUID;
  encrypted_pw   TEXT;
BEGIN
  -- ============================================
  -- 1. Verificar se o email já existe
  -- ============================================
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    RAISE EXCEPTION 'O email "%" já está cadastrado. Use outro email ou remova o usuário existente.', admin_email;
  END IF;

  -- ============================================
  -- 2. Gerar ID e criptografar a senha
  -- ============================================
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(admin_password, gen_salt('bf'));

  -- ============================================
  -- 3. Criar o usuário no auth.users
  -- ============================================
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',  -- instance_id padrão do Supabase
    new_user_id,
    'authenticated',
    'authenticated',
    admin_email,
    encrypted_pw,
    NOW(),  -- email já confirmado
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('name', 'Administrador', 'role', 'admin'),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- ============================================
  -- 4. Criar a identidade (necessário para login)
  -- ============================================
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::text,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', admin_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- ============================================
  -- 5. Garantir que o perfil admin existe
  -- (o trigger handle_new_user já cria, mas
  --  garantimos aqui como fallback)
  -- ============================================
  INSERT INTO public.profiles (user_id, role, created_at, updated_at)
  VALUES (new_user_id, 'admin'::user_role, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'admin'::user_role, updated_at = NOW();

  -- ============================================
  -- 6. Resultado
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '✅ Usuário admin criado com sucesso!';
  RAISE NOTICE '   ID:    %', new_user_id;
  RAISE NOTICE '   Email: %', admin_email;
  RAISE NOTICE '   Role:  admin';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Faça login no app com o email e senha definidos.';

END $admin$;
