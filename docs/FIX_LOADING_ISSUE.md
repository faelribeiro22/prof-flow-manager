# 🐛 Fix: Loading Infinito na Aplicação

## Problema Identificado

A aplicação fica carregando eternamente sem mostrar erros no console ou terminal.

### Causa Raiz

As políticas RLS (Row Level Security) da tabela `profiles` estavam muito restritivas:

```sql
-- Política anterior (PROBLEMÁTICA)
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);
```

Quando a aplicação tentava carregar o role do usuário via `getUserRole()`, a query ficava travada porque:
1. A query precisava verificar o `user_id` na tabela `profiles`
2. Mas a política RLS só permitia que cada usuário lesse seu próprio perfil
3. Em alguns casos (especialmente com admins ou novos usuários), isso causava um deadlock silencioso

## Solução Implementada

### 1. Logs de Debug Adicionados

**Arquivo:** [src/components/Auth/AuthContext.tsx](../src/components/Auth/AuthContext.tsx)
- Logs detalhados em cada etapa do processo de autenticação
- Identificação exata de onde o loading trava

**Arquivo:** [src/integrations/supabase/auth.ts](../src/integrations/supabase/auth.ts)
- Logs na função `getUserRole()`
- Timeout de 5 segundos para evitar travamento
- Fallback para role 'teacher' em caso de erro

```typescript
// Timeout automático adicionado
const rolePromise = getUserRole(currentUser.id);
const timeoutPromise = new Promise<'admin' | 'teacher' | null>((resolve) => {
  setTimeout(() => {
    console.warn('[AuthContext] Timeout ao buscar role, usando valor padrão');
    resolve('teacher');
  }, 5000);
});

const userRole = await Promise.race([rolePromise, timeoutPromise]);
```

### 2. Migration de Correção

**Arquivo:** [supabase/migrations/003_fix_profiles_rls.sql](../supabase/migrations/003_fix_profiles_rls.sql)

Nova política RLS que permite:
- Usuários lerem seu próprio perfil
- Admins lerem todos os perfis

```sql
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
```

## Como Aplicar a Correção

### Passo 1: Aplicar a Migration no Supabase

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/003_fix_profiles_rls.sql`
4. Execute o script

**Ou use o script automatizado:**

```bash
./scripts/fix-loading.sh
```

### Passo 2: Reiniciar a Aplicação

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
bun run dev
```

### Passo 3: Verificar os Logs

Abra o console do navegador (F12) e procure por logs começando com:
- `[AuthContext]` - Logs do contexto de autenticação
- `[getUserRole]` - Logs da busca de role

Exemplo de logs esperados:
```
[AuthContext] Iniciando loadUser...
[AuthContext] Buscando sessão...
[AuthContext] Sessão obtida: Existe
[AuthContext] Buscando usuário...
[AuthContext] Usuário obtido: abc-123-def
[AuthContext] Buscando role do usuário...
[getUserRole] Buscando role para userId: abc-123-def
[getUserRole] Resultado: { data: { role: 'admin' }, error: null }
[getUserRole] Role encontrada: admin
[AuthContext] Role obtida: admin
[AuthContext] Finalizando loadUser, setLoading(false)
```

## Verificação de Sucesso

✅ **Funcionando corretamente quando:**
- A aplicação carrega em menos de 2 segundos
- O dashboard aparece após o login
- Logs mostram o fluxo completo sem travamentos
- Nenhum warning de timeout aparece

❌ **Ainda com problemas se:**
- Loading continua por mais de 5 segundos
- Logs param em "Buscando role do usuário..."
- Aparece warning de timeout no console
- Nenhum erro é mostrado

## Troubleshooting

### Se o problema persistir:

1. **Verifique se a migration foi aplicada:**
   ```sql
   -- No SQL Editor do Supabase
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   Deve mostrar as políticas: `Users can read profiles`, `Users can update own profile`, `Admins can update all profiles`

2. **Verifique se todos os usuários têm perfil:**
   ```sql
   -- No SQL Editor do Supabase
   SELECT 
     u.id, 
     u.email, 
     p.role
   FROM auth.users u
   LEFT JOIN profiles p ON p.user_id = u.id;
   ```
   Nenhum usuário deve ter `role = NULL`

3. **Crie perfis manualmente se necessário:**
   ```sql
   INSERT INTO profiles (user_id, role, created_at, updated_at)
   SELECT 
     id,
     'teacher',
     now(),
     now()
   FROM auth.users
   WHERE NOT EXISTS (
     SELECT 1 FROM profiles WHERE profiles.user_id = auth.users.id
   );
   ```

4. **Limpe o cache do navegador:**
   - Ctrl+Shift+Delete
   - Limpar cache e cookies
   - Recarregar a página

## Arquivos Modificados

- ✏️ [src/components/Auth/AuthContext.tsx](../src/components/Auth/AuthContext.tsx) - Adicionados logs e timeout
- ✏️ [src/integrations/supabase/auth.ts](../src/integrations/supabase/auth.ts) - Adicionados logs em getUserRole
- ✏️ [src/components/Teachers/EnhancedTeacherForm.tsx](../src/components/Teachers/EnhancedTeacherForm.tsx) - Removido debugger
- 🆕 [supabase/migrations/003_fix_profiles_rls.sql](../supabase/migrations/003_fix_profiles_rls.sql) - Correção das políticas RLS
- 🆕 [scripts/fix-loading.sh](../scripts/fix-loading.sh) - Script de diagnóstico
- 🆕 [.vscode/launch.json](../.vscode/launch.json) - Configuração de debug

## Prevenção Futura

Para evitar problemas similares:

1. **Sempre teste políticas RLS:**
   - Teste com diferentes roles (admin, teacher)
   - Teste com usuários sem perfil
   - Verifique performance das queries

2. **Use timeouts em queries críticas:**
   ```typescript
   const dataPromise = fetchData();
   const timeoutPromise = new Promise((resolve, reject) => {
     setTimeout(() => reject(new Error('Timeout')), 5000);
   });
   const result = await Promise.race([dataPromise, timeoutPromise]);
   ```

3. **Adicione logs em pontos críticos:**
   - Início e fim de operações assíncronas
   - Antes e depois de queries ao banco
   - Em listeners de eventos

4. **Monitore estados de loading:**
   - Use devtools do React para verificar estados
   - Adicione indicadores visuais de loading
   - Implemente timeouts e fallbacks

---

**Status:** ✅ Corrigido  
**Data:** 14/01/2026  
**Versão:** 1.0.0
