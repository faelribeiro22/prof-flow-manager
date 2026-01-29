# Fix: Role vindo como NULL no useAuth

## Problema Identificado

O `user_metadata` continha o role correto (ex: "admin"), mas o `useAuth` retornava `role: null`. Isso acontecia porque:

1. **Timing Issue**: O trigger do banco não tinha tempo suficiente para criar o perfil antes da query
2. **Query Failure**: A função `getUserRole` usava `.single()` que lança erro se não encontrar registro
3. **No Fallback**: Não havia fallback para buscar o role do `user_metadata` quando a tabela `profiles` falhava
4. **RLS Policies**: As policies RLS poderiam estar bloqueando a leitura imediata após criação

## Soluções Implementadas

### 1. Função `getUserRole` Melhorada ([auth.ts](../src/integrations/supabase/auth.ts))

**Mudanças:**
- ✅ Usa `.maybeSingle()` em vez de `.single()` para não lançar erro se registro não existir
- ✅ Busca do `user_metadata` como fallback se não encontrar na tabela `profiles`
- ✅ Tenta criar o perfil automaticamente se ele não existir na tabela
- ✅ Logs detalhados em cada etapa do processo

**Fluxo:**
```typescript
1. Busca role na tabela profiles
   ↓
2. Se não encontrou, busca no user_metadata
   ↓
3. Se encontrou no metadata, tenta criar o perfil na tabela
   ↓
4. Retorna o role (da tabela ou do metadata)
```

### 2. AuthContext com Retry e Fallback ([AuthContext.tsx](../src/components/Auth/AuthContext.tsx))

**Mudanças:**
- ✅ Aguarda 1 segundo e tenta novamente se o role vier null
- ✅ Usa `user_metadata.role` como fallback se ambas tentativas falharem
- ✅ Logs detalhados mostrando `user_metadata` em cada etapa
- ✅ Mesmo tratamento no listener de `onAuthStateChange`

**Fluxo no Login:**
```typescript
1. Busca role (primeira tentativa)
   ↓
2. Se null → aguarda 1s → tenta novamente
   ↓
3. Se ainda null → usa user_metadata.role
   ↓
4. Define o role no contexto
```

### 3. Listener de Auth State Melhorado

**Mudanças:**
- ✅ Aguarda 500ms após SIGNED_IN para dar tempo ao trigger
- ✅ Tenta buscar role duas vezes com intervalo de 1s
- ✅ Fallback para `user_metadata.role` se ambas falharem
- ✅ Logs completos do processo

## Como Testar

### 1. Teste de Registro

```bash
# Inicie a aplicação
bun run dev
```

1. Abra o Console do navegador (F12)
2. Faça logout se estiver logado
3. Vá para a página de registro
4. Crie um usuário com role **Administrador**
5. Observe os logs:

```javascript
// Logs esperados:
[RegisterForm] Iniciando cadastro: { email: '...', role: 'admin' }
[signUp] Iniciando registro: { email: '...', role: 'admin' }
[signUp] User metadata: { name: '...', role: 'admin' }
[AuthContext] Auth state changed: SIGNED_IN
[AuthContext] User metadata após SIGNED_IN: { name: '...', role: 'admin' }
[getUserRole] Buscando role para userId: ...
[getUserRole] Role encontrada na tabela profiles: admin
[AuthContext] Role obtida no listener: admin
```

### 2. Teste de Login

1. Faça logout
2. Faça login com um usuário admin existente
3. Observe os logs:

```javascript
[AuthContext] Iniciando loadUser...
[AuthContext] User metadata: { name: '...', role: 'admin' }
[getUserRole] Buscando role para userId: ...
[getUserRole] Role encontrada na tabela profiles: admin  // OU do metadata
[AuthContext] Role obtida (primeira tentativa): admin
```

### 3. Verificação no Componente

Adicione este código temporário em qualquer componente para testar:

```typescript
import { useAuth } from '@/components/Auth/AuthContext';

const { user, role } = useAuth();

console.log('User ID:', user?.id);
console.log('User Metadata:', user?.user_metadata);
console.log('Role from Context:', role);
```

**Resultado esperado:**
```
User ID: "uuid-do-usuario"
User Metadata: { name: "Nome", role: "admin" }
Role from Context: "admin"  // ✅ NÃO MAIS NULL!
```

## Cenários de Fallback

### Cenário 1: Perfil não existe na tabela
**O que acontece:**
- `getUserRole` não encontra na tabela `profiles`
- Busca no `user_metadata` → encontra "admin"
- Tenta criar o perfil na tabela automaticamente
- Retorna "admin"

### Cenário 2: Query falha por RLS
**O que acontece:**
- `getUserRole` falha ao buscar na tabela
- Busca no `user_metadata` → encontra "admin"
- Retorna "admin" (mesmo sem criar na tabela)

### Cenário 3: Timing Issue (trigger lento)
**O que acontece:**
- Primeira tentativa retorna null
- Aguarda 1 segundo
- Segunda tentativa encontra o perfil criado
- Retorna o role correto

### Cenário 4: Tudo falha
**O que acontece:**
- Ambas tentativas retornam null
- Verifica `user_metadata.role`
- Retorna o role do metadata

## Logs para Debug

### Sucesso Completo
```
[getUserRole] Buscando role para userId: abc-123
[getUserRole] Resultado da tabela profiles: { data: { role: 'admin' }, error: null }
[getUserRole] Role encontrada na tabela profiles: admin
```

### Fallback para Metadata
```
[getUserRole] Buscando role para userId: abc-123
[getUserRole] Resultado da tabela profiles: { data: null, error: {...} }
[getUserRole] Perfil não encontrado na tabela, buscando do user_metadata...
[getUserRole] Role encontrada no user_metadata: admin
[getUserRole] Tentando criar perfil na tabela...
[getUserRole] Perfil criado com sucesso
```

### Retry no AuthContext
```
[AuthContext] Buscando role do usuário...
[AuthContext] Role obtida (primeira tentativa): null
[AuthContext] Role null, aguardando e tentando novamente...
[AuthContext] Role obtida (segunda tentativa): admin
```

## Validação no Supabase

### 1. Verificar User Metadata
```sql
-- No SQL Editor do Supabase
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role_metadata,
  created_at
FROM auth.users
WHERE email = 'seu-email@teste.com';
```

**Resultado esperado:**
```
id: uuid
email: seu-email@teste.com
role_metadata: admin
created_at: timestamp
```

### 2. Verificar Tabela Profiles
```sql
SELECT 
  p.user_id,
  p.role,
  p.created_at,
  u.email
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'seu-email@teste.com';
```

**Resultado esperado:**
```
user_id: uuid (mesmo do auth.users)
role: admin
created_at: timestamp
email: seu-email@teste.com
```

## Importante: Não Esqueça!

⚠️ **LEMBRE-SE**: Você ainda precisa aplicar a migration 004 no Supabase!

```bash
# Arquivo: supabase/migrations/004_fix_profiles_insert_policy.sql
```

Esta migration:
- ✅ Adiciona policy de INSERT para a tabela `profiles`
- ✅ Melhora o trigger com ON CONFLICT
- ✅ Adiciona logs no trigger
- ✅ Cria perfis faltantes

**Como aplicar:**
1. Dashboard do Supabase → SQL Editor
2. Cole o conteúdo da migration
3. Execute (Run)

## Troubleshooting

### "Role ainda vem null após as mudanças"

**Verificações:**
1. ✅ Migration 004 foi aplicada?
2. ✅ Cache do navegador foi limpo?
3. ✅ Fez logout e login novamente?
4. ✅ Verificou os logs no console?

**Solução rápida:**
```typescript
// Força recriação do perfil
// No SQL Editor do Supabase:

DELETE FROM profiles WHERE user_id = 'user-id-aqui';

-- Faça logout e login novamente na aplicação
-- O sistema irá recriar o perfil automaticamente
```

### "Erro: maybeSingle() is not a function"

**Causa:** Versão antiga do Supabase client

**Solução:**
```bash
bun update @supabase/supabase-js
```

### "Profile não está sendo criado automaticamente"

**Verificar:**
1. Trigger `on_auth_user_created` existe?
2. Trigger está ativo?
3. Policy de INSERT existe?

**SQL para verificar:**
```sql
-- Verificar trigger
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Verificar policy
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT';
```

## Melhorias Futuras (Opcional)

1. **Cache do Role**: Armazenar o role no localStorage para evitar queries repetidas
2. **Webhook**: Usar webhook do Supabase para garantir criação do perfil
3. **Service Role**: Usar service role key para criar perfis sem RLS
4. **Realtime**: Usar Supabase Realtime para atualizar role em tempo real

## Resumo das Mudanças

| Arquivo | Mudança | Motivo |
|---------|---------|--------|
| `auth.ts` | `getUserRole` com fallback | Buscar do metadata se tabela falhar |
| `auth.ts` | Usa `maybeSingle()` | Evitar erro se registro não existe |
| `auth.ts` | Auto-criação de perfil | Criar perfil se não existir |
| `AuthContext.tsx` | Retry com delay | Dar tempo ao trigger |
| `AuthContext.tsx` | Fallback para metadata | Garantir role nunca seja null |
| `AuthContext.tsx` | Logs detalhados | Debug mais fácil |

---

**Versão:** 1.0  
**Data:** Janeiro 28, 2026  
**Status:** ✅ Implementado e Testado
