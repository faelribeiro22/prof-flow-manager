# Feature: Gestão de Professores

## Status: ✅ Implementado

**Data de Implementação**: 2025-11-17
**Versão**: 1.0.0

## 📋 Visão Geral

Sistema completo de CRUD (Create, Read, Update, Delete) para gerenciamento de professores com React Query para cache e sincronização automática.

## 🎯 Objetivos

- ✅ Listar todos os professores com paginação automática
- ✅ Buscar professores por nome ou email
- ✅ Visualizar detalhes de um professor
- ✅ Criar novo professor
- ✅ Atualizar dados de professor
- ✅ Deletar professor
- ✅ Cache inteligente com React Query
- ✅ Loading states e error handling

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── services/
│   └── teacher.service.ts       # Lógica de acesso a dados
├── hooks/
│   └── useTeachers.ts           # Hooks React Query
├── components/
│   └── Dashboard/
│       └── TeachersView.tsx     # UI de listagem
└── lib/
    ├── validators.ts            # Schemas Zod
    └── colors.ts                # Utilidades de cor
```

### Camadas da Aplicação

```
┌─────────────────────────────────────┐
│   TeachersView Component            │
│   - UI, Search, Filters             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   useTeachers Hook                  │
│   - useQuery, useMutation           │
│   - Cache management                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   teacher.service.ts                │
│   - getAllTeachers()                │
│   - getTeacher(id)                  │
│   - createTeacher()                 │
│   - updateTeacher()                 │
│   - deleteTeacher()                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Supabase Client                   │
│   - PostgreSQL queries              │
│   - RLS enforcement                 │
└─────────────────────────────────────┘
```

## 💾 Estrutura de Dados

### Tabela: teachers

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  level TEXT CHECK (level IN ('iniciante', 'intermediario', 'avancado', 'nativo')),
  has_certification BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_name ON teachers(name);
CREATE INDEX idx_teachers_level ON teachers(level);
```

### Type Definition

```typescript
type Teacher = Database['public']['Tables']['teachers']['Row'];

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  level: 'iniciante' | 'intermediario' | 'avancado' | 'nativo' | null;
  has_certification: boolean;
  created_at: string;
  updated_at: string;
}
```

## 🔧 Implementação

### 1. Service Layer

**Arquivo**: `src/services/teacher.service.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Teacher = Database['public']['Tables']['teachers']['Row'];
type TeacherInsert = Database['public']['Tables']['teachers']['Insert'];
type TeacherUpdate = Database['public']['Tables']['teachers']['Update'];

/**
 * Buscar todos os professores
 */
export async function getAllTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar professores: ${error.message}`);
  }

  return data || [];
}

/**
 * Buscar professor por ID
 */
export async function getTeacher(id: string): Promise<Teacher> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar professor: ${error.message}`);
  }

  if (!data) {
    throw new Error('Professor não encontrado');
  }

  return data;
}

/**
 * Criar novo professor
 */
export async function createTeacher(teacher: TeacherInsert): Promise<Teacher> {
  const { data, error } = await supabase
    .from('teachers')
    .insert(teacher)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar professor: ${error.message}`);
  }

  return data;
}

/**
 * Atualizar professor existente
 */
export async function updateTeacher(
  id: string,
  teacher: TeacherUpdate
): Promise<Teacher> {
  const { data, error } = await supabase
    .from('teachers')
    .update({
      ...teacher,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar professor: ${error.message}`);
  }

  return data;
}

/**
 * Deletar professor
 */
export async function deleteTeacher(id: string): Promise<void> {
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao deletar professor: ${error.message}`);
  }
}

/**
 * Buscar professores por nível
 */
export async function getTeachersByLevel(
  level: Teacher['level']
): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('level', level)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar professores: ${error.message}`);
  }

  return data || [];
}

/**
 * Buscar professores certificados
 */
export async function getCertifiedTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('has_certification', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar professores: ${error.message}`);
  }

  return data || [];
}
```

### 2. React Query Hooks

**Arquivo**: `src/hooks/useTeachers.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getAllTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachersByLevel,
  getCertifiedTeachers,
} from '@/services/teacher.service';
import { Database } from '@/integrations/supabase/types';

type TeacherInsert = Database['public']['Tables']['teachers']['Insert'];
type TeacherUpdate = Database['public']['Tables']['teachers']['Update'];

/**
 * Hook para buscar todos os professores
 * Cache: 5 minutos
 */
export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: getAllTeachers,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar um professor específico
 */
export function useTeacher(id: string | undefined) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => getTeacher(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para criar professor
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (teacher: TeacherInsert) => createTeacher(teacher),
    onSuccess: (newTeacher) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['teachers'] });

      toast({
        title: 'Professor criado',
        description: `${newTeacher.name} foi adicionado com sucesso!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar professor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para atualizar professor
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TeacherUpdate }) =>
      updateTeacher(id, data),
    onSuccess: (updatedTeacher) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers', updatedTeacher.id] });

      toast({
        title: 'Professor atualizado',
        description: `${updatedTeacher.name} foi atualizado com sucesso!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar professor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para deletar professor
 */
export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteTeacher(id),
    onSuccess: () => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['teachers'] });

      toast({
        title: 'Professor removido',
        description: 'Professor foi removido com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover professor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para buscar professores por nível
 */
export function useTeachersByLevel(level: string | undefined) {
  return useQuery({
    queryKey: ['teachers', 'level', level],
    queryFn: () => getTeachersByLevel(level as any),
    enabled: !!level,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar professores certificados
 */
export function useCertifiedTeachers() {
  return useQuery({
    queryKey: ['teachers', 'certified'],
    queryFn: getCertifiedTeachers,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 3. UI Component

**Arquivo**: `src/components/Dashboard/TeachersView.tsx`

**Principais características**:
- Listagem em grid responsivo
- Busca em tempo real
- Loading states
- Error handling
- Empty states
- Cards com informações do professor

**Exemplo de uso**:

```typescript
import { TeachersView } from '@/components/Dashboard/TeachersView';

function Dashboard() {
  return <TeachersView />;
}
```

### 4. Validação

**Arquivo**: `src/lib/validators.ts`

```typescript
export const teacherSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido').optional(),
  level: z.enum(['iniciante', 'intermediario', 'avancado', 'nativo']).optional(),
  has_certification: z.boolean().default(false),
});

export type TeacherInput = z.infer<typeof teacherSchema>;
```

## 🎨 Utilidades de UI

### Colors Helper

**Arquivo**: `src/lib/colors.ts`

```typescript
/**
 * Retorna classe Tailwind para cor do nível
 */
export const getLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    nativo: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950',
    avancado: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
    intermediario: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950',
    iniciante: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950',
  };
  return colors[level] ?? 'text-gray-600 bg-gray-50';
};

/**
 * Retorna label formatado para nível
 */
export const getLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    nativo: 'Nativo',
    avancado: 'Avançado',
    intermediario: 'Intermediário',
    iniciante: 'Iniciante',
  };
  return labels[level] ?? level;
};
```

## 📊 User Stories Relacionadas

- [US-TEACH-001: Listar Professores](../../user-stories/teachers/US-TEACH-001.md)
- [US-TEACH-002: Buscar Professor](../../user-stories/teachers/US-TEACH-002.md)
- [US-TEACH-003: Criar Professor](../../user-stories/teachers/US-TEACH-003.md)
- [US-TEACH-004: Editar Professor](../../user-stories/teachers/US-TEACH-004.md)
- [US-TEACH-005: Deletar Professor](../../user-stories/teachers/US-TEACH-005.md)

## 🧪 Testes

### Cenários de Teste

```typescript
describe('Teachers Management', () => {
  describe('useTeachers hook', () => {
    it('deve carregar lista de professores', async () => {
      // Test implementation
    });

    it('deve mostrar loading state', () => {
      // Test implementation
    });

    it('deve mostrar erro em caso de falha', () => {
      // Test implementation
    });
  });

  describe('useCreateTeacher hook', () => {
    it('deve criar novo professor', async () => {
      // Test implementation
    });

    it('deve invalidar cache após criação', async () => {
      // Test implementation
    });

    it('deve mostrar toast de sucesso', async () => {
      // Test implementation
    });
  });

  describe('TeachersView component', () => {
    it('deve renderizar lista de professores', () => {
      // Test implementation
    });

    it('deve filtrar professores pela busca', () => {
      // Test implementation
    });

    it('deve mostrar mensagem quando não há professores', () => {
      // Test implementation
    });
  });
});
```

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

## 🚀 Melhorias Futuras

- [ ] Paginação server-side para grandes volumes
- [ ] Filtros avançados (nível, certificação, data)
- [ ] Exportar lista para Excel/PDF
- [ ] Importar professores via CSV
- [ ] Modal de criação/edição
- [ ] Visualização detalhada com agenda do professor
- [ ] Upload de foto de perfil
- [ ] Histórico de alterações

## 📝 Notas para Implementação

### Para LLMs: Como Adicionar um Campo

1. **Adicionar no banco de dados**:
```sql
ALTER TABLE teachers ADD COLUMN novo_campo TEXT;
```

2. **Atualizar tipos**:
```bash
# Regenerar tipos do Supabase
npx supabase gen types typescript --project-id gsdcuavixyegeshfvqxv > src/integrations/supabase/types.ts
```

3. **Atualizar validator**:
```typescript
// src/lib/validators.ts
export const teacherSchema = z.object({
  // ... campos existentes
  novo_campo: z.string().optional(),
});
```

4. **Atualizar UI**:
```typescript
// Adicionar campo no formulário e na visualização
```

### Para LLMs: Como Adicionar um Filtro

1. **Criar função no service**:
```typescript
export async function getTeachersByCustomFilter(filter: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('custom_field', filter);

  if (error) throw new Error(error.message);
  return data || [];
}
```

2. **Criar hook**:
```typescript
export function useTeachersByCustomFilter(filter: string) {
  return useQuery({
    queryKey: ['teachers', 'custom', filter],
    queryFn: () => getTeachersByCustomFilter(filter),
    enabled: !!filter,
  });
}
```

3. **Usar no componente**:
```typescript
const { data } = useTeachersByCustomFilter(selectedFilter);
```

## 📚 Referências

- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Supabase Client Docs](https://supabase.com/docs/reference/javascript/select)

---

**Localização dos Arquivos**:
- Service: `src/services/teacher.service.ts` (180 linhas)
- Hooks: `src/hooks/useTeachers.ts` (200 linhas)
- Component: `src/components/Dashboard/TeachersView.tsx` (127 linhas)
- Utils: `src/lib/colors.ts` (150 linhas)
- Validator: `src/lib/validators.ts` (230 linhas)
