# 📋 Novas Funcionalidades - Informações Estendidas do Professor

## 📝 Resumo das Alterações

Este documento descreve as **novas funcionalidades** adicionadas ao sistema AgendaPro para gerenciar informações adicionais dos professores.

### 🎯 Objetivo
Adicionar funcionalidades de gestão administrativa e busca avançada de professores, incluindo:
- **Endereço** (acesso restrito a admin)
- **Desempenho em sala** (acesso restrito a admin)
- **Tipos de aula** que o professor pode lecionar
- **Formação acadêmica**

---

## 🗃️ Mudanças no Banco de Dados

### 1. Novas Tabelas

#### `teacher_addresses`
Armazena endereços dos professores (acesso restrito a admin).

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| id | UUID | Chave primária | ✅ |
| teacher_id | UUID | FK para teachers | ✅ |
| cep | VARCHAR(9) | CEP no formato 12345-678 | ✅ |
| street | VARCHAR(255) | Nome da rua/avenida | ✅ |
| number | VARCHAR(20) | Número do imóvel | ✅ |
| complement | VARCHAR(100) | Complemento (apto, bloco, etc.) | ❌ |
| neighborhood | VARCHAR(100) | Bairro | ✅ |
| city | VARCHAR(100) | Cidade | ✅ |
| state | VARCHAR(2) | UF (ex: SP, RJ) | ✅ |
| created_at | TIMESTAMP | Data de criação | ✅ |
| updated_at | TIMESTAMP | Data de atualização | ✅ |

**Constraints:**
- `teacher_id` é UNIQUE (apenas um endereço por professor)
- DELETE CASCADE ao remover professor

---

#### `lesson_types`
Catálogo de tipos de aula disponíveis.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| id | UUID | Chave primária | ✅ |
| name | VARCHAR(100) | Nome do tipo de aula | ✅ |
| description | TEXT | Descrição detalhada | ❌ |
| created_at | TIMESTAMP | Data de criação | ✅ |
| updated_at | TIMESTAMP | Data de atualização | ✅ |

**Constraints:**
- `name` é UNIQUE

**Dados iniciais (seed):**
- Conversação
- Gramática
- Preparação para Exames
- Business English
- Inglês para Crianças
- Inglês Técnico
- Literatura
- Pronúncia

---

#### `teacher_lesson_types`
Relacionamento muitos-para-muitos entre professores e tipos de aula.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| id | UUID | Chave primária | ✅ |
| teacher_id | UUID | FK para teachers | ✅ |
| lesson_type_id | UUID | FK para lesson_types | ✅ |
| created_at | TIMESTAMP | Data de criação | ✅ |

**Constraints:**
- UNIQUE(teacher_id, lesson_type_id) - evita duplicatas
- DELETE CASCADE ao remover professor ou tipo de aula

---

### 2. Novos Campos na Tabela `teachers`

| Campo | Tipo | Descrição | Acesso |
|-------|------|-----------|--------|
| performance | ENUM | Desempenho em sala: 'ruim', 'regular', 'bom', 'excelente' | 🔒 Admin apenas |
| academic_background | TEXT | Formação acadêmica do professor | 👀 Todos |

---

### 3. Novo ENUM: `teacher_performance`

```sql
CREATE TYPE public.teacher_performance AS ENUM (
  'ruim',
  'regular',
  'bom',
  'excelente'
);
```

---

## 🔒 Segurança (RLS Policies)

### `teacher_addresses` - Acesso Restrito

| Operação | Permissão |
|----------|-----------|
| SELECT | ✅ APENAS Admin |
| INSERT | ✅ APENAS Admin |
| UPDATE | ✅ APENAS Admin |
| DELETE | ✅ APENAS Admin |

**Justificativa:** Endereço é informação sensível, visível apenas para secretária e coordenação.

---

### `lesson_types` - Público para leitura

| Operação | Permissão |
|----------|-----------|
| SELECT | ✅ Todos (autenticados) |
| INSERT | ✅ APENAS Admin |
| UPDATE | ✅ APENAS Admin |
| DELETE | ✅ APENAS Admin |

---

### `teacher_lesson_types` - Público para leitura

| Operação | Permissão |
|----------|-----------|
| SELECT | ✅ Todos (autenticados) |
| INSERT | ✅ APENAS Admin |
| DELETE | ✅ APENAS Admin |

---

## 🔍 Novas Funções de Busca

### `search_teachers_advanced()`

Função para busca avançada de professores com múltiplos filtros.

**Parâmetros:**
- `p_day_of_week` (INT) - Dia da semana (0-6)
- `p_hour` (INT) - Horário (8-22)
- `p_level` (TEXT) - Nível do professor
- `p_has_certification` (BOOLEAN) - Possui certificação internacional
- `p_performance` (TEXT) - Desempenho em sala (admin apenas)
- `p_lesson_type_ids` (UUID[]) - IDs dos tipos de aula
- `p_academic_background` (TEXT) - Busca textual na formação

**Retorna:**
- Dados do professor
- Quantidade de horários livres (`free_hours_count`)

**Exemplo de uso:**
```sql
SELECT * FROM search_teachers_advanced(
  p_day_of_week := 1,
  p_hour := 14,
  p_level := 'avancado',
  p_lesson_type_ids := ARRAY['uuid1', 'uuid2']::UUID[]
);
```

---

### `get_teacher_lesson_types(teacher_id)`

Retorna os tipos de aula que um professor pode lecionar.

**Parâmetros:**
- `teacher_id_param` (UUID) - ID do professor

**Retorna:**
- id, name, description dos tipos de aula

---

## 📦 Novos Arquivos Criados

### Backend / Database

1. **`supabase/migrations/001_add_teacher_extended_info.sql`**
   - Migration completa com tabelas, enums, RLS, índices e funções
   - Pronto para executar no Supabase SQL Editor

### Frontend / Types

2. **`src/integrations/supabase/extended-types.ts`**
   - Tipos TypeScript para as novas entidades
   - Interfaces para formulários e busca
   - Constantes (labels, estados brasileiros)

3. **`src/integrations/supabase/types.ts`** (atualizado)
   - Adicionadas tabelas: `teacher_addresses`, `lesson_types`, `teacher_lesson_types`
   - Adicionado enum: `teacher_performance`
   - Atualizados campos da tabela `teachers`

### API Layer

4. **`src/lib/api/teacher-extended.ts`**
   - CRUD completo para endereços
   - CRUD completo para tipos de aula
   - Gerenciamento de relacionamento professor-tipo de aula
   - Busca avançada de professores
   - Integração com API ViaCEP para busca de endereço por CEP

### Components

5. **`src/components/Teachers/TeacherAddressForm.tsx`**
   - Formulário para cadastro/edição de endereço
   - Busca automática por CEP (ViaCEP API)
   - Select de estados brasileiros
   - Validação de campos obrigatórios
   - Acesso restrito a admin

6. **`src/components/Teachers/TeacherAdvancedSearch.tsx`**
   - Interface de busca avançada
   - Filtros por:
     - Disponibilidade (dia/horário)
     - Nível e certificação
     - Desempenho (admin apenas)
     - Tipos de aula (seleção múltipla)
     - Formação acadêmica (busca textual)
   - Exibição de resultados com badges

---

## 🚀 Como Usar

### 1. Executar Migration

```bash
# Copie o conteúdo de supabase/migrations/001_add_teacher_extended_info.sql
# Cole no SQL Editor do Supabase
# Execute o script
```

### 2. Verificar Tabelas Criadas

```sql
-- Verificar tabelas
SELECT * FROM teacher_addresses;
SELECT * FROM lesson_types;
SELECT * FROM teacher_lesson_types;

-- Verificar tipos de aula padrão
SELECT * FROM lesson_types ORDER BY name;
```

### 3. Usar Componentes no Frontend

```typescript
// Importar busca avançada
import { TeacherAdvancedSearch } from '@/components/Teachers/TeacherAdvancedSearch';

// Usar no Dashboard (admin view)
<TeacherAdvancedSearch />
```

```typescript
// Importar formulário de endereço
import { TeacherAddressForm } from '@/components/Teachers/TeacherAddressForm';

// Usar na página de edição do professor (admin apenas)
<TeacherAddressForm 
  teacherId={teacherId} 
  address={currentAddress}
  onSuccess={() => console.log('Endereço salvo!')}
/>
```

### 4. Exemplo de API Usage

```typescript
import {
  fetchTeacherWithDetails,
  searchTeachersAdvanced,
  updateTeacherLessonTypes,
} from '@/lib/api/teacher-extended';

// Buscar professor com todos os detalhes
const teacher = await fetchTeacherWithDetails('teacher-uuid');
console.log(teacher.address); // Endereço (se admin)
console.log(teacher.lesson_types); // Tipos de aula

// Busca avançada
const results = await searchTeachersAdvanced({
  dayOfWeek: 1, // Segunda
  hour: 14, // 14h
  level: 'avancado',
  hasCertification: true,
  lessonTypeIds: ['uuid1', 'uuid2'],
});

// Atualizar tipos de aula do professor
await updateTeacherLessonTypes('teacher-uuid', [
  'conversacao-uuid',
  'gramatica-uuid',
]);
```

---

## 🎨 Exemplos de UI

### Formulário de Endereço
- Campo CEP com busca automática (ViaCEP)
- Preenchimento automático de: rua, bairro, cidade, estado
- Select de estados brasileiros
- Campos obrigatórios marcados com *

### Busca Avançada
- **Seção Disponibilidade:** Dia da semana + Horário
- **Seção Características:** Nível + Certificação
- **Seção Desempenho:** (Visível apenas para admin)
- **Seção Tipos de Aula:** Badges clicáveis para seleção múltipla
- **Seção Formação:** Campo de busca textual

### Resultados da Busca
- Cards com informações do professor
- Badges de nível e certificação
- Exibição de formação acadêmica
- Exibição de desempenho (admin apenas)
- Contador de horários livres

---

## 📊 Índices Criados

Para otimizar performance das buscas:

```sql
-- teacher_addresses
CREATE INDEX idx_teacher_addresses_teacher_id ON teacher_addresses(teacher_id);
CREATE INDEX idx_teacher_addresses_cep ON teacher_addresses(cep);
CREATE INDEX idx_teacher_addresses_city ON teacher_addresses(city);
CREATE INDEX idx_teacher_addresses_state ON teacher_addresses(state);

-- teachers (novos campos)
CREATE INDEX idx_teachers_performance ON teachers(performance);
CREATE INDEX idx_teachers_academic_background ON teachers USING gin(to_tsvector('portuguese', academic_background));

-- teacher_lesson_types
CREATE INDEX idx_teacher_lesson_types_teacher_id ON teacher_lesson_types(teacher_id);
CREATE INDEX idx_teacher_lesson_types_lesson_type_id ON teacher_lesson_types(lesson_type_id);
```

---

## ✅ Checklist de Implementação

### Backend ✅
- [x] Migration SQL criada
- [x] Tabelas criadas com constraints
- [x] RLS policies configuradas
- [x] Triggers de updated_at
- [x] Índices para performance
- [x] Funções de busca avançada
- [x] Seed data para lesson_types

### Frontend ✅
- [x] Types TypeScript atualizados
- [x] API layer criada
- [x] Formulário de endereço
- [x] Componente de busca avançada
- [x] Integração com ViaCEP
- [x] Proteção de acesso (admin only)

### Próximos Passos 🎯
- [ ] Executar migration no Supabase
- [ ] Testar RLS policies
- [ ] Integrar TeacherAddressForm na página de edição
- [ ] Integrar TeacherAdvancedSearch no Dashboard
- [ ] Atualizar formulário de cadastro de professor para incluir novos campos
- [ ] Criar página de gerenciamento de tipos de aula (admin)
- [ ] Adicionar filtros avançados à tela de busca principal

---

## 🔗 Arquivos Relacionados

- `docs/DATA_MODEL.md` - Modelo de dados atualizado com novas entidades
- `docs/FEATURES_CHECKLIST.md` - Checklist de funcionalidades (atualizar)
- `.github/copilot-instructions.md` - Instruções para GitHub Copilot

---

**Data:** 10 de novembro de 2025  
**Versão:** 1.0.0
