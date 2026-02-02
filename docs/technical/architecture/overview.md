# Arquitetura do ProfFlow Manager

## Visão Geral

O ProfFlow Manager é uma aplicação web moderna construída com React, TypeScript, e Supabase seguindo uma arquitetura em camadas com separação clara de responsabilidades.

## Stack Tecnológico

### Frontend
- **React 18.3.1** - Library para UI
- **TypeScript 5.6.2** - Type safety
- **Vite 6.0.1** - Build tool e dev server
- **TailwindCSS 3.4.17** - Utility-first CSS
- **shadcn/ui** - Componentes acessíveis

### State Management
- **TanStack Query 5.62.11** - Server state (cache, sync, mutations)
- **React Context API** - Client state (auth, theme)

### Backend (Supabase)
- **PostgreSQL** - Banco de dados relacional
- **Supabase Auth** - Autenticação e autorização
- **Row Level Security** - Segurança em nível de linha
- **Edge Functions** - Serverless functions (Deno)
- **Realtime** - Subscriptions WebSocket (futuro)

### Validação e Utilidades
- **Zod 3.24.1** - Schema validation
- **date-fns** - Date utilities
- **lucide-react** - Icon system

## Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                     │
│                    (Components)                         │
│                                                         │
│  - Views (TeachersView, ScheduleView)                  │
│  - Forms (LoginForm)                                    │
│  - UI Components (shadcn/ui)                            │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                  STATE MANAGEMENT                       │
│              (React Query + Context)                    │
│                                                         │
│  - Hooks (useTeachers, useSchedules, useAuth)          │
│  - Query Client configuration                           │
│  - Cache management                                     │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                  BUSINESS LOGIC                         │
│                  (Services Layer)                       │
│                                                         │
│  - teacher.service.ts                                   │
│  - schedule.service.ts                                  │
│  - Validation (Zod schemas)                             │
│  - Data transformation                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                  DATA ACCESS                            │
│                 (Supabase Client)                       │
│                                                         │
│  - Database queries                                     │
│  - Authentication                                       │
│  - RLS enforcement                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                    DATABASE                             │
│                  (PostgreSQL)                           │
│                                                         │
│  - Tables (profiles, teachers, schedules)               │
│  - Indexes                                              │
│  - Triggers                                             │
│  - RLS Policies                                         │
└─────────────────────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
prof-flow-manager/
├── src/
│   ├── components/         # Componentes React
│   │   ├── Auth/          # Autenticação
│   │   ├── Dashboard/     # Views principais
│   │   ├── Schedule/      # Componentes de agenda
│   │   └── ui/            # shadcn/ui components
│   │
│   ├── hooks/             # Custom hooks
│   │   ├── useAuth.tsx    # Hook de autenticação
│   │   ├── useTeachers.ts # React Query hooks
│   │   └── useSchedules.ts
│   │
│   ├── services/          # Business logic
│   │   ├── teacher.service.ts
│   │   └── schedule.service.ts
│   │
│   ├── lib/               # Utilidades
│   │   ├── validators.ts  # Zod schemas
│   │   ├── colors.ts      # Color utilities
│   │   └── utils.ts       # Helpers gerais
│   │
│   ├── integrations/      # Integrações externas
│   │   └── supabase/
│   │       ├── client.ts  # Cliente configurado
│   │       └── types.ts   # Types gerados
│   │
│   ├── pages/             # Route pages
│   │   └── Index.tsx      # Página principal
│   │
│   └── App.tsx            # Root component
│
├── docs/                  # Documentação
│   ├── features/
│   ├── user-stories/
│   └── technical/
│
├── supabase/              # Supabase config
│   ├── functions/         # Edge Functions
│   └── migrations/        # Database migrations
│
└── public/                # Assets estáticos
```

## Padrões de Design

### 1. Service Layer Pattern

Toda lógica de acesso a dados fica nos services:

```typescript
// ✅ CORRETO - Service layer
// src/services/teacher.service.ts
export async function getAllTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

// ❌ INCORRETO - Acesso direto no componente
function TeachersView() {
  const fetchTeachers = async () => {
    const { data } = await supabase.from('teachers').select('*');
    // ...
  };
}
```

### 2. React Query for Server State

Todo estado do servidor gerenciado pelo React Query:

```typescript
// ✅ CORRETO - React Query hook
export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: getAllTeachers,
    staleTime: 5 * 60 * 1000,
  });
}

// Uso no componente
function TeachersView() {
  const { data: teachers, isLoading, error } = useTeachers();
  // ...
}

// ❌ INCORRETO - useState para server data
function TeachersView() {
  const [teachers, setTeachers] = useState([]);
  useEffect(() => {
    fetchTeachers().then(setTeachers);
  }, []);
}
```

### 3. Zod for Validation

Validação type-safe com Zod:

```typescript
// ✅ CORRETO - Zod schema
export const teacherSchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
});

const result = teacherSchema.safeParse(formData);
if (!result.success) {
  // Handle errors
}

// ❌ INCORRETO - Validação manual
if (formData.name.length < 3) {
  errors.name = 'Nome muito curto';
}
```

### 4. Context for Client State

Context API para estado do cliente (auth, theme):

```typescript
// ✅ CORRETO - Context para auth
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ...
  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ❌ INCORRETO - Props drilling
<App>
  <Dashboard user={user} signOut={signOut}>
    <Header user={user} signOut={signOut} />
    <Content user={user} />
  </Dashboard>
</App>
```

## Fluxo de Dados

### Query (Read)

```
Component → useHook → Service → Supabase → Database
    ↑         ↑         ↑          ↑
    └─────────┴─────────┴──────────┘
         React Query Cache
```

### Mutation (Write)

```
Component → Mutation → Service → Supabase → Database
    ↓                                           ↓
    └───────────────────────────────────────────┘
              Invalidate Cache
                    ↓
            Automatic Refetch
```

## Convenções de Código

### Nomenclatura

```typescript
// Components: PascalCase
export const TeachersView = () => { };

// Hooks: camelCase com 'use'
export function useTeachers() { }

// Services: camelCase com '.service'
// teacher.service.ts
export async function getAllTeachers() { }

// Types: PascalCase
type Teacher = { ... };

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Utilities: camelCase
export function getLevelColor() { }
```

### Imports

```typescript
// 1. React e hooks
import { useState, useEffect } from 'react';

// 2. Bibliotecas externas
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Componentes UI
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Hooks e services internos
import { useTeachers } from '@/hooks/useTeachers';
import { getAllTeachers } from '@/services/teacher.service';

// 5. Types e utils
import { Teacher } from '@/integrations/supabase/types';
import { getLevelColor } from '@/lib/colors';
```

### Comentários

```typescript
/**
 * Buscar todos os professores ordenados por nome
 *
 * @returns Array de professores
 * @throws Error se falhar ao buscar
 */
export async function getAllTeachers(): Promise<Teacher[]> {
  // Implementação
}
```

## Error Handling

### Pattern Padrão

```typescript
try {
  // 1. Validação
  const validated = schema.parse(input);

  // 2. Operação
  const result = await operation(validated);

  // 3. Sucesso
  toast({ title: 'Sucesso!' });
  return result;

} catch (error) {
  // 4. Tratamento de erros específicos
  if (error instanceof z.ZodError) {
    // Erro de validação
    handleValidationError(error);
  } else if (error instanceof Error) {
    // Erro de operação
    toast({
      title: 'Erro',
      description: error.message,
      variant: 'destructive',
    });
  }
  throw error;

} finally {
  // 5. Cleanup
  setLoading(false);
}
```

## Performance

### Otimizações Implementadas

1. **React Query Caching**
   - staleTime: 5 minutos para dados estáveis
   - Invalidação inteligente após mutations

2. **Code Splitting** (futuro)
   - Lazy loading de rotas
   - Dynamic imports para features grandes

3. **Memoization**
   - useMemo para cálculos pesados
   - useCallback para funções em deps

4. **Database Indexes**
   - Índices em colunas frequentemente consultadas
   - Índices compostos para queries complexas

## Segurança

### Implementações de Segurança

1. **Environment Variables**
   - Credenciais em .env.local
   - Validação na inicialização

2. **Row Level Security (RLS)**
   ```sql
   CREATE POLICY "Users can read own data"
     ON profiles FOR SELECT
     USING (auth.uid() = id);
   ```

3. **Input Validation**
   - Zod schemas em todos os formulários
   - Sanitização automática

4. **XSS Protection**
   - React escaping automático
   - Nenhum uso de dangerouslySetInnerHTML

5. **CSRF Protection**
   - Tokens JWT do Supabase
   - Mesma origem

## Testing Strategy (Futuro)

### Pirâmide de Testes

```
        /\
       /  \      E2E Tests (10%)
      /    \     - Cypress
     /------\
    /        \   Integration Tests (30%)
   /          \  - React Testing Library
  /------------\
 /              \ Unit Tests (60%)
/________________\ - Vitest
```

### Cobertura Alvo

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths
- **E2E Tests**: User journeys principais

## Deployment

### Ambientes

1. **Development** (local)
   - Vite dev server
   - Supabase local (futuro)

2. **Staging** (Netlify/Vercel)
   - Preview deployments
   - Supabase projeto de staging

3. **Production** (Netlify/Vercel)
   - Optimized build
   - Supabase projeto de produção

## Monitoring (Futuro)

### Métricas Chave

- **Performance**: Web Vitals (LCP, FID, CLS)
- **Errors**: Sentry/LogRocket
- **Analytics**: Google Analytics
- **Database**: Supabase metrics

## Referencias

- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Query Guide](https://tanstack.com/query/latest/docs/react/overview)
- [Supabase Docs](https://supabase.com/docs)

---

**Última Atualização**: 2025-11-17
