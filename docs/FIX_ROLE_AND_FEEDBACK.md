# Guia de Correção: Role de Admin e Feedback de Cadastro

## Problemas Identificados

1. **Role não estava sendo salvo corretamente**: O role personalizado (admin/teacher) estava sendo enviado mas não persistido corretamente na tabela `profiles`
2. **Falta de feedback no formulário**: Usuário não sabia se o cadastro foi bem-sucedido
3. **Policy de INSERT faltando**: A tabela `profiles` não tinha policy permitindo INSERT, o que poderia causar problemas com o trigger

## O que foi alterado?

### 1. Arquivo: `src/integrations/supabase/auth.ts`
- ✅ Adicionados logs detalhados para rastrear o processo de criação
- ✅ Aumentado tempo de espera de 100ms para 500ms para o trigger executar
- ✅ Verificação explícita se o perfil foi criado e se o role está correto
- ✅ Atualização forçada do role caso esteja incorreto
- ✅ Logs mais detalhados para criação de professores

### 2. Arquivo: `src/components/Auth/RegisterForm.tsx`
- ✅ Validação de senha mínima (6 caracteres)
- ✅ Mensagem de sucesso melhorada mostrando o tipo de usuário criado
- ✅ Feedback diferenciado se email precisa ser confirmado
- ✅ Formulário é limpo após sucesso
- ✅ Logs para debug do processo

### 3. Nova Migration: `004_fix_profiles_insert_policy.sql`
- ✅ Policy de INSERT criada para permitir que o trigger funcione
- ✅ Função do trigger melhorada com logs
- ✅ ON CONFLICT adicionado para evitar duplicações
- ✅ Script de verificação de integridade para criar perfis faltantes

## Como aplicar a correção?

### Passo 1: Aplicar a Migration no Supabase

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `supabase/migrations/004_fix_profiles_insert_policy.sql`
6. Clique em **Run** ou pressione `Ctrl+Enter`
7. Verifique se não houve erros

### Passo 2: Testar a Aplicação

1. Abra a aplicação em modo desenvolvimento:
```bash
bun run dev
```

2. Abra o console do navegador (F12) para ver os logs

3. Tente criar um novo usuário com role **admin**:
   - Nome: Teste Admin
   - Email: admin@teste.com
   - Senha: 123456
   - Tipo: Administrador

4. Verifique nos logs do console se aparece:
```
[RegisterForm] Iniciando cadastro: { email: 'admin@teste.com', name: 'Teste Admin', role: 'admin' }
[signUp] Iniciando registro: { email: 'admin@teste.com', name: 'Teste Admin', role: 'admin' }
[signUp] Perfil atualizado com sucesso
[signUp] Registro completo com sucesso
```

5. Você deve ver um toast verde com a mensagem: **"✅ Conta criada com sucesso!"**

### Passo 3: Verificar no Supabase

1. Vá em **Table Editor** > **profiles**
2. Procure pelo usuário recém-criado
3. Verifique se a coluna `role` está como **admin** (não como "teacher")

4. Vá em **Authentication** > **Users**
5. Procure o usuário pelo email
6. Clique nele e veja os **User Metadata**
7. Confirme que `role: "admin"` está presente nos metadados

### Passo 4: Verificar Logs do Supabase (Opcional)

1. Vá em **Logs** > **Postgres Logs**
2. Procure por mensagens como:
```
Trigger handle_new_user executado para user_id: [uuid]
Role extraído: admin
Role final: admin
Perfil criado/atualizado com sucesso
```

## Importante: Sobre o campo `role` em auth.users

⚠️ **ATENÇÃO**: O campo `role` na tabela `auth.users` do Supabase é usado pelo sistema de autenticação para papéis como `authenticated`, `anon`, `service_role`, etc. 

**O role personalizado (admin/teacher) do nosso sistema está armazenado em:**
- ✅ `auth.users.raw_user_meta_data` (JSON com `role: "admin"` ou `role: "teacher"`)
- ✅ `public.profiles.role` (coluna do tipo enum)

**NÃO devemos modificar** `auth.users.role` - ele sempre será `authenticated` para usuários normais.

## Testando com Diferentes Roles

### Criar Admin:
```typescript
// No formulário de registro
{
  name: "João Admin",
  email: "joao.admin@teste.com",
  password: "senha123",
  role: "admin" // Selecionar "Administrador"
}
```

### Criar Professor:
```typescript
// No formulário de registro
{
  name: "Maria Professora",
  email: "maria.prof@teste.com",
  password: "senha123",
  role: "teacher" // Selecionar "Professor"
}
```

## Logs Esperados (Sucesso)

### Console do Navegador:
```
[RegisterForm] Iniciando cadastro: { email: '...', name: '...', role: 'admin' }
[signUp] Iniciando registro: { email: '...', name: '...', role: 'admin' }
[signUp] Resposta do auth: { user: '[uuid]', error: null }
[signUp] Usuário criado com ID: [uuid]
[signUp] Metadados do usuário: { name: '...', role: 'admin' }
[signUp] Perfil existente: { profile: { user_id: '...', role: 'admin', ... }, error: null }
[signUp] Registro completo com sucesso
[RegisterForm] Cadastro concluído com sucesso
```

### Toast na Tela:
```
✅ Conta criada com sucesso!
Usuário Administrador cadastrado. Verifique seu email para confirmar o cadastro.
```

## Problemas Conhecidos e Soluções

### Problema: "Perfil existente: { profile: null, error: {...} }"
**Solução**: O trigger não executou a tempo. A correção atualiza o perfil após verificar.

### Problema: "Role está como 'teacher' mas criei como 'admin'"
**Solução**: Aplique a migration 004. Ela corrige o trigger e adiciona a policy.

### Problema: "Erro ao atualizar perfil"
**Solução**: Verifique as policies RLS. Execute a migration 003 se necessário.

### Problema: "Não vejo logs no console"
**Solução**: Abra o DevTools (F12) antes de submeter o formulário.

## Limpeza de Dados de Teste

Se precisar remover usuários de teste:

```sql
-- No SQL Editor do Supabase
-- CUIDADO: Isso remove TODOS os dados do usuário

-- 1. Deletar da tabela teachers (se for professor)
DELETE FROM teachers WHERE email = 'teste@exemplo.com';

-- 2. Deletar da tabela profiles
DELETE FROM profiles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'teste@exemplo.com'
);

-- 3. Deletar usuário do auth (via Dashboard UI é mais seguro)
-- Vá em Authentication > Users > Encontre o usuário > Delete
```

## Próximos Passos

Após confirmar que tudo está funcionando:

1. ✅ Remova ou comente os `console.log` de produção (opcional)
2. ✅ Documente os novos usuários admin criados
3. ✅ Configure email confirmation no Supabase se necessário
4. ✅ Teste o fluxo completo de login com admin e teacher

## Suporte

Se os problemas persistirem:
1. Verifique os logs do Supabase (Dashboard > Logs)
2. Confirme que todas as migrations foram aplicadas
3. Teste em modo incógnito para evitar cache
4. Verifique se o email já não existe no sistema
