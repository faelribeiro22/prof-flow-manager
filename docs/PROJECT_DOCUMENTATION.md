# 📚 Documentação do Projeto - AgendaPro

## 📋 Visão Geral

**AgendaPro** é um sistema de gestão de agendas para professores de idiomas, permitindo controle de horários, alunos e listas especiais.

### Objetivos do Sistema
- Gerenciar agenda de professores com controle de horários livres e ocupados
- Cadastrar e gerenciar professores (nome, nível, certificações)
- Buscar professores disponíveis por horário
- Gerenciar listas especiais (férias, licenças médicas, etc.)
- Controle de acesso diferenciado (Admin e Professor)

---

## 👥 Tipos de Usuário

### 1. Administrador
- **Permissões:**
  - Visualizar e gerenciar todos os professores
  - Visualizar e editar agendas de todos os professores
  - Criar e editar listas especiais
  - Buscar professores disponíveis
  - Gerenciar próprio perfil

### 2. Professor
- **Permissões:**
  - Visualizar e editar própria agenda
  - Visualizar próprias listas especiais
  - Gerenciar próprio perfil
  - **Restrições:** Não pode acessar dados de outros professores

---

## 🎯 Funcionalidades Principais

### 1. Autenticação e Autorização
- ✅ Login com email/senha
- ✅ Registro de novos usuários (admin/professor)
- ✅ Logout
- ✅ Controle de sessão
- ✅ RLS (Row Level Security) no Supabase

### 2. Gerenciamento de Professores
- ✅ Listagem de professores (admin)
- ⚠️ Cadastro de professores (parcial)
- ⚠️ Edição de dados do professor (parcial)
- ❌ Exclusão de professores
- ✅ Perfil do professor

**Campos do Professor:**
- Nome
- Email
- Telefone
- Nível (Iniciante, Intermediário, Avançado)
- Certificação Internacional (Sim/Não)

### 3. Gerenciamento de Agenda
- ⚠️ Visualização da grade horária (parcial)
- ❌ Marcar horário como ocupado
- ❌ Adicionar nome do aluno no horário
- ❌ Liberar horário
- ❌ Edição em lote de horários

**Estrutura da Agenda:**
- Dias da semana (Segunda a Domingo)
- Horários (8h às 22h)
- Status: Livre, Ocupado
- Nome do aluno (quando ocupado)

### 4. Busca de Professores
- ⚠️ Interface de busca (parcial)
- ❌ Buscar por horário disponível
- ❌ Filtrar por nível
- ❌ Filtrar por certificação internacional
- ❌ Visualizar resultados com dados do professor

### 5. Listas Especiais
- ⚠️ Interface básica (parcial)
- ❌ Criar lista especial (férias, licença médica, etc.)
- ❌ Associar professor à lista
- ❌ Definir período da lista
- ❌ Adicionar observações
- ❌ Visualizar listas ativas
- ❌ Editar/Excluir listas

**Tipos de Listas:**
- Férias
- Licença Médica
- Afastamento
- Outros

### 6. Perfil do Usuário
- ⚠️ Visualização de dados (parcial)
- ❌ Edição de dados pessoais
- ❌ Alteração de senha
- ❌ Upload de foto de perfil

---

## 🗃️ Modelo de Dados

### Entidades Principais

#### 1. **auth.users** (Supabase Auth)
```typescript
{
  id: uuid (PK)
  email: string
  created_at: timestamp
  // Gerenciado pelo Supabase Auth
}
```

#### 2. **profiles**
```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → auth.users) UNIQUE
  role: enum('admin', 'teacher')
  created_at: timestamp
  updated_at: timestamp
}
```

#### 3. **teachers**
```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → auth.users) UNIQUE
  name: string
  email: string
  phone: string? (nullable)
  level: enum('iniciante', 'intermediario', 'avancado')
  has_international_certification: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

#### 4. **schedules**
```typescript
{
  id: uuid (PK)
  teacher_id: uuid (FK → teachers)
  day_of_week: integer (0-6, Domingo-Sábado)
  hour: integer (8-22)
  status: enum('livre', 'ocupado')
  student_name: string? (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

#### 5. **special_lists**
```typescript
{
  id: uuid (PK)
  teacher_id: uuid (FK → teachers)
  list_type: string ('ferias', 'licenca_medica', 'afastamento', etc.)
  start_date: date?
  end_date: date?
  observation: string? (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 🔐 Segurança (Row Level Security)

### Políticas Implementadas

#### profiles
```sql
-- Usuários podem ler seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

#### teachers
```sql
-- Professores podem inserir seu próprio registro
CREATE POLICY "Users can insert own teacher profile"
  ON teachers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Professores podem ler seu próprio registro
CREATE POLICY "Users can read own teacher profile"
  ON teachers FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ler todos os professores
CREATE POLICY "Admins can read all teachers"
  ON teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Professores podem atualizar seu próprio registro
CREATE POLICY "Users can update own teacher profile"
  ON teachers FOR UPDATE
  USING (auth.uid() = user_id);
```

#### schedules
```sql
-- Professores podem gerenciar sua própria agenda
CREATE POLICY "Teachers can manage own schedule"
  ON schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = schedules.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Admins podem gerenciar todas as agendas
CREATE POLICY "Admins can manage all schedules"
  ON schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

#### special_lists
```sql
-- Professores podem gerenciar suas próprias listas
CREATE POLICY "Teachers can manage own lists"
  ON special_lists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = special_lists.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Admins podem gerenciar todas as listas
CREATE POLICY "Admins can manage all lists"
  ON special_lists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico
- **Frontend:** React + TypeScript + Vite
- **UI:** Shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Estado:** React Context API
- **Roteamento:** React Router
- **Build:** Bun

### Estrutura de Pastas
```
src/
├── components/
│   ├── Auth/           # Autenticação (Login, Register, Context)
│   ├── Dashboard/      # Visões principais do dashboard
│   ├── Layout/         # Header, Sidebar
│   ├── Schedule/       # Componentes de agenda
│   └── ui/             # Componentes UI (shadcn)
├── hooks/              # Custom hooks
├── integrations/
│   └── supabase/       # Cliente e tipos do Supabase
├── lib/                # Utilitários
└── pages/              # Páginas da aplicação
```

---

## 📊 Fluxos de Dados

### Fluxo de Autenticação
```
1. Usuário acessa a aplicação
2. AuthContext verifica sessão ativa
3. Se autenticado → carrega user + role → Dashboard
4. Se não autenticado → LoginForm
5. Login bem-sucedido → atualiza AuthContext → redireciona
```

### Fluxo de Registro
```
1. Usuário preenche formulário (email, senha, nome, role)
2. signUp() cria usuário no Supabase Auth
3. Trigger automático cria registro em profiles
4. Se role='teacher' → cria registro em teachers
5. Retorna sucesso ou erro
```

### Fluxo de Logout
```
1. Usuário clica em "Sair"
2. Dashboard.handleLogout() → AuthContext.signOut()
3. Supabase.auth.signOut() limpa sessão
4. AuthContext limpa estado (user, role)
5. Listener detecta SIGNED_OUT → redireciona para login
```

---

## 🎨 Temas e Estilos

### Sistema de Temas
- ✅ Dark Mode
- ✅ Light Mode
- ✅ Toggle de tema
- ✅ Persistência no localStorage

### Design System
- **Cores:** Baseado em CSS Variables (Tailwind)
- **Componentes:** Shadcn/ui (customizáveis)
- **Responsividade:** Mobile-first
- **Ícones:** Lucide React

---

## 📱 Responsividade

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Adaptações
- ✅ Menu hamburguer em mobile
- ✅ Sidebar colapsável
- ✅ Grade de horários adaptativa
- ✅ Cards responsivos

---

## 🚀 Próximos Passos

### Prioridade Alta
1. **Implementar CRUD completo de Agenda**
   - Marcar/desmarcar horários
   - Adicionar nome do aluno
   - Edição em lote
   
2. **Implementar Busca de Professores**
   - Busca por horário disponível
   - Filtros (nível, certificação)
   - Visualização de resultados

3. **Implementar Listas Especiais**
   - CRUD completo
   - Associação com professores
   - Visualização de períodos

### Prioridade Média
4. **Melhorar Gestão de Professores**
   - CRUD completo
   - Upload de foto
   - Validações

5. **Implementar Edição de Perfil**
   - Alteração de dados
   - Mudança de senha
   - Upload de avatar

### Prioridade Baixa
6. **Relatórios e Dashboard**
   - Estatísticas de uso
   - Professores mais ocupados
   - Horários de pico

7. **Notificações**
   - Email de confirmação
   - Lembretes de aulas
   - Alertas de listas especiais

---

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=https://gsdcuavixyegeshfvqxv.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-chave>
```

### Instalação
```bash
# Instalar dependências
bun install

# Rodar em desenvolvimento
bun run dev

# Build para produção
bun run build
```

---

## 📝 Notas de Desenvolvimento

### Decisões Técnicas
1. **Supabase RLS** ao invés de middleware API para segurança
2. **Context API** ao invés de Redux para gerenciamento de estado
3. **Shadcn/ui** para componentes reutilizáveis e customizáveis
4. **Bun** como runtime e package manager por performance

### Limitações Conhecidas
- Trigger automático de profiles ainda precisa ser criado no Supabase
- Políticas RLS de schedules e special_lists precisam ser implementadas
- Validações de formulário podem ser melhoradas

### Débito Técnico
- Adicionar testes unitários
- Adicionar testes de integração
- Melhorar tratamento de erros
- Adicionar logging estruturado
- Implementar cache de dados

---

**Última atualização:** 02/11/2025
