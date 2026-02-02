# 📅 AgendaPro - Sistema de Gestão de Agendas

> Sistema de gestão de agendas para professores de idiomas, desenvolvido com React, TypeScript e Supabase.

[![Status](https://img.shields.io/badge/status-MVP%20em%20desenvolvimento-yellow)](docs/ROADMAP.md)
[![Progresso](https://img.shields.io/badge/progresso-30%25-orange)](docs/FEATURES_CHECKLIST.md)
[![Licença](https://img.shields.io/badge/licença-TBD-blue)]()

---

## 📖 Sobre o Projeto

**AgendaPro** é uma aplicação web moderna para gestão de agendas de professores de idiomas, oferecendo:

- 📅 **Gestão de Agenda** - Controle completo de horários livres e ocupados
- 👥 **Gerenciamento de Professores** - Cadastro e perfil de professores com níveis e certificações
- 🔍 **Busca Inteligente** - Encontre professores disponíveis por horário, nível e certificação
- 📝 **Listas Especiais** - Gerencie férias, licenças médicas e afastamentos
- 🔐 **Controle de Acesso** - Sistema com dois níveis: Admin e Professor

---

## 🚀 Status do Projeto

**Versão Atual:** 0.3.0 (MVP em Desenvolvimento)  
**Progresso Geral:** ~30%  
**Sprint Atual:** Sprint 1 - Fundação do Sistema  
**Próximo Marco:** MVP Agenda (29/11/2025)

### ✅ O que está pronto
- Autenticação (Login/Register/Logout)
- Layout responsivo com tema dark/light
- Navegação entre páginas
- Visualização básica de professores
- Estrutura de componentes

### 🔄 Em desenvolvimento
- CRUD completo de agenda
- Busca de professores disponíveis
- Políticas RLS completas
- Sistema de triggers

### 📋 Backlog
- Listas especiais
- Edição de perfil
- Relatórios e analytics
- Notificações

[Ver Roadmap Completo →](docs/ROADMAP.md)

---

## 📚 Documentação

A documentação completa está disponível na pasta [`docs/`](docs/):

- **[📖 Índice da Documentação](docs/README.md)** - Início
- **[📋 Documentação do Projeto](docs/PROJECT_DOCUMENTATION.md)** - Visão geral
- **[📊 Modelo de Dados](docs/DATA_MODEL.md)** - Diagramas ER e estrutura
- **[✅ Checklist de Features](docs/FEATURES_CHECKLIST.md)** - Status de implementação
- **[🗺️ Roadmap](docs/ROADMAP.md)** - Planejamento de sprints

---

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Componentes UI
- **React Router** - Roteamento

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL (Database)
  - Auth (Autenticação)
  - RLS (Row Level Security)
  - Storage (Planejado)

### DevOps
- **Bun** - Runtime e package manager
- **Git** - Controle de versão
- **Vercel** - Hosting (planejado)

---

## 🏃 Quick Start

### Pré-requisitos
- [Bun](https://bun.sh/) instalado (ou Node.js + npm)
- Conta no [Supabase](https://supabase.com/)

### Instalação

```sh
# 1. Clone o repositório
git clone https://github.com/faelribeiro22/prof-flow-manager.git
cd prof-flow-manager

# 2. Instale as dependências
bun install

# 3. Configure as variáveis de ambiente
# Copie .env.example para .env e preencha com suas credenciais do Supabase
cp .env.example .env

# 4. Configure o banco de dados
# Execute o script SQL em supabase/setup.sql no SQL Editor do Supabase

# 5. Inicie o servidor de desenvolvimento
bun run dev
```

A aplicação estará disponível em `http://localhost:5173`

---

## 📦 Scripts Disponíveis

```sh
# Desenvolvimento
bun run dev          # Inicia servidor de desenvolvimento

# Build
bun run build        # Cria build de produção
bun run preview      # Preview do build de produção

# Linting
bun run lint         # Executa ESLint
```

---

## 🗄️ Estrutura do Projeto

```
prof-flow-manager/
├── docs/                      # Documentação completa
│   ├── README.md             # Índice da documentação
│   ├── PROJECT_DOCUMENTATION.md
│   ├── DATA_MODEL.md
│   ├── FEATURES_CHECKLIST.md
│   └── ROADMAP.md
├── src/
│   ├── components/           # Componentes React
│   │   ├── Auth/            # Autenticação
│   │   ├── Dashboard/       # Dashboard e views
│   │   ├── Layout/          # Header, Sidebar
│   │   ├── Schedule/        # Componentes de agenda
│   │   └── ui/              # Componentes UI (shadcn)
│   ├── hooks/               # Custom hooks
│   ├── integrations/
│   │   └── supabase/        # Cliente e tipos do Supabase
│   ├── lib/                 # Utilitários
│   ├── pages/               # Páginas
│   └── main.tsx             # Entry point
├── supabase/
│   ├── config.toml          # Configuração do Supabase
│   └── setup.sql            # Script de setup do banco
└── package.json
```

---

## 🔐 Configuração do Supabase

### 1. Crie um projeto no Supabase

### 2. Execute o script SQL
Acesse o SQL Editor e execute o arquivo [`supabase/setup.sql`](supabase/setup.sql). Este script irá:
- Criar triggers automáticos
- Configurar políticas RLS
- Criar índices otimizados
- Adicionar constraints
- Criar funções auxiliares

### 3. Configure as variáveis de ambiente
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

[Ver Documentação Completa de Setup →](docs/PROJECT_DOCUMENTATION.md#configuração-do-ambiente)

---

## 👥 Como Contribuir

1. **Leia a documentação**
   - [Checklist de Features](docs/FEATURES_CHECKLIST.md)
   - [Roadmap](docs/ROADMAP.md)
   - [Modelo de Dados](docs/DATA_MODEL.md)

2. **Escolha uma feature** do roadmap atual

3. **Crie uma branch**
   ```sh
   git checkout -b feature/nome-da-feature
   ```

4. **Desenvolva e teste**

5. **Atualize a documentação**

6. **Commit e Push**
   ```sh
   git commit -m "feat: descrição da feature"
   git push origin feature/nome-da-feature
   ```

7. **Abra um Pull Request**

---

## 🎯 Próximos Passos

Confira as próximas entregas no [Roadmap](docs/ROADMAP.md):

### Sprint 1 (Atual) - Fundação
- [ ] Implementar triggers do Supabase
- [ ] Completar políticas RLS
- [ ] Adicionar recuperação de senha

### Sprint 2 - Agenda (Core Feature)
- [ ] ScheduleGrid completo (7x15)
- [ ] CRUD de horários
- [ ] Marcar/desmarcar como ocupado
- [ ] Adicionar nome do aluno

### Sprint 3 - Busca de Professores
- [ ] Implementar busca funcional
- [ ] Filtros (horário, nível, certificação)
- [ ] Exibição de resultados

[Ver Roadmap Completo →](docs/ROADMAP.md)

---

## 📊 Progresso por Categoria

| Categoria | Completo | Status |
|-----------|----------|--------|
| Autenticação | 70% | 🟢 Em Andamento |
| Professores | 40% | 🟡 Parcial |
| Agenda | 10% | 🔴 Inicial |
| Busca | 5% | 🔴 Inicial |
| Interface | 60% | 🟢 Boa Base |
| **TOTAL** | **~30%** | 🟡 **MVP em Desenvolvimento** |

---

## 📝 Changelog

### [0.3.0] - 2025-11-02
#### Adicionado
- ✅ Documentação completa do projeto
- ✅ Diagramas de dados (ER e Classes)
- ✅ Checklist de features
- ✅ Roadmap de 10 sprints
- ✅ Script SQL de setup do banco

#### Corrigido
- ✅ Logout funcional implementado
- ✅ Fluxo de autenticação corrigido
- ✅ Context API otimizado

### [0.2.0] - Anterior
#### Adicionado
- ✅ Autenticação básica (Login/Register)
- ✅ Layout responsivo
- ✅ Tema dark/light
- ✅ Estrutura de componentes

### [0.1.0] - Inicial
#### Adicionado
- ✅ Setup do projeto
- ✅ Configuração do Supabase
- ✅ Estrutura de pastas

[Ver histórico completo →](docs/README.md#-changelog)

---

## 📞 Suporte

- 📚 **Documentação:** [/docs](docs/)
- 🐛 **Issues:** [GitHub Issues](https://github.com/faelribeiro22/prof-flow-manager/issues)
- 💬 **Discussões:** [GitHub Discussions](https://github.com/faelribeiro22/prof-flow-manager/discussions)

---

## 📜 Licença

TBD

---

## 🙏 Agradecimentos

- [Shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Supabase](https://supabase.com/) - Backend as a Service
- [Lucide](https://lucide.dev/) - Ícones
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

<div align="center">

**[📖 Documentação](docs/) • [🗺️ Roadmap](docs/ROADMAP.md) • [✅ Features](docs/FEATURES_CHECKLIST.md)**

Feito com ❤️ pela equipe AgendaPro

</div>

- Edit files directly within the Codespace and commit and push your changes once you're done.

Professor:
  Email: professor@escola.com
  Senha: prof123
```

## 📂 Estrutura do Projeto

```
prof-flow-manager/
├── docs/                              # 📚 Documentação (3.175+ linhas)
│   ├── INDEX.md                       # 🎯 Ponto de entrada para LLMs
│   ├── features/
│   │   ├── implemented/               # ✅ Features implementadas
│   │   │   ├── 01-authentication.md
│   │   │   ├── 02-teachers-management.md
│   │   │   └── 03-schedule-management.md
│   │   └── planned/                   # 📋 Features planejadas
│   │       └── 01-whatsapp-messaging.md
│   ├── user-stories/                  # User stories por módulo
│   │   └── authentication/
│   ├── technical/                     # Documentação técnica
│   │   └── architecture/
│   │       └── overview.md
│   └── whatsapp-messaging/            # Docs WhatsApp (5.400+ linhas)
│
├── src/
│   ├── components/                    # Componentes React
│   │   ├── Auth/                      # LoginForm
│   │   ├── Dashboard/                 # TeachersView, ScheduleView
│   │   ├── Schedule/                  # ScheduleGrid
│   │   └── ui/                        # shadcn/ui components
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useAuth.tsx                # Hook de autenticação
│   │   ├── useTeachers.ts             # React Query - Teachers
│   │   └── useSchedules.ts            # React Query - Schedules
│   │
│   ├── services/                      # Business Logic Layer
│   │   ├── teacher.service.ts         # Teacher CRUD
│   │   └── schedule.service.ts        # Schedule CRUD
│   │
│   ├── lib/                           # Utilidades
│   │   ├── validators.ts              # Zod schemas
│   │   ├── colors.ts                  # Color helpers
│   │   └── utils.ts                   # General helpers
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts              # Cliente configurado
│   │       └── types.ts               # Types gerados
│   │
│   ├── pages/                         # Route pages
│   │   └── Index.tsx
│   │
│   ├── App.tsx                        # Root component
│   └── main.tsx                       # Entry point
│
├── supabase/
│   ├── functions/                     # Edge Functions (futuro)
│   └── config.toml                    # Supabase config
│
├── .env.example                       # Template de variáveis
├── .env.local                         # Suas credenciais (gitignored)
├── package.json
├── tsconfig.json                      # TypeScript strict mode
├── vite.config.ts
└── tailwind.config.ts
```

## 🗄️ Schema do Banco de Dados

```sql
-- Perfis de usuários (extends auth.users)
profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')),
  ...
)

-- Professores
teachers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  level TEXT CHECK (level IN ('iniciante', 'intermediario', 'avancado', 'nativo')),
  has_certification BOOLEAN,
  ...
)

-- Horários e agendamentos
schedules (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  hour INTEGER CHECK (hour BETWEEN 0 AND 23),
  status TEXT CHECK (status IN ('livre', 'com_aluno', 'indisponivel')),
  student_name TEXT,
  ...
)
```

**Ver schema completo**: [docs/technical/database/schema.md](./docs/technical/database/schema.md) (futuro)

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server (porta 8080)

# Build
npm run build            # Build para produção
npm run preview          # Preview do build

# Qualidade de Código
npm run lint             # ESLint check
npm run type-check       # TypeScript check

# Testes (futuro)
npm run test             # Rodar testes
npm run test:watch       # Testes em watch mode
npm run test:coverage    # Cobertura de testes
```

## 📖 Documentação

O projeto possui **documentação completa** otimizada para humanos e LLMs:

### Para Desenvolvedores

- **[Este README](./README.md)** - Visão geral e quick start
- **[Revisão Completa](./docs/REVISAO-COMPLETA.md)** - Análise detalhada do projeto
- **[Implementações Realizadas](./docs/IMPLEMENTACOES-REALIZADAS.md)** - Guia de código implementado

### Para LLMs (IA)

- **[INDEX.md](./docs/INDEX.md)** - 🎯 **COMECE AQUI** - Ponto de entrada para LLMs
- **[Features Implementadas](./docs/features/implemented/)** - Código e arquitetura
- **[Features Planejadas](./docs/features/planned/)** - Roadmap com exemplos
- **[User Stories](./docs/user-stories/)** - Requisitos detalhados
- **[Arquitetura](./docs/technical/architecture/)** - Padrões e convenções

### WhatsApp Messaging (5.400+ linhas)

Documentação completa para implementação futura:

1. **[Arquitetura](./docs/whatsapp-messaging/01-ARQUITETURA.md)** - Design da solução
2. **[Guia de Implementação](./docs/whatsapp-messaging/02-GUIA-IMPLEMENTACAO.md)** - Passo a passo
3. **[API e Integração](./docs/whatsapp-messaging/03-API-INTEGRACAO.md)** - Endpoints e webhooks
4. **[Configuração](./docs/whatsapp-messaging/04-CONFIGURACAO-DEPLOYMENT.md)** - Deploy e produção
5. **[Alternativas](./docs/whatsapp-messaging/05-ALTERNATIVAS.md)** - Comparação (Chatwoot, WAHA, Evolution API)

## 🔐 Segurança

### Implementações de Segurança ✅

- ✅ **Credenciais em .env** - Não commitadas no git
- ✅ **Row Level Security (RLS)** - Políticas no banco de dados
- ✅ **Validação de Input** - Zod schemas em todos os forms
- ✅ **TypeScript Strict Mode** - Type safety rigoroso
- ✅ **XSS Protection** - React escaping automático
- ✅ **CSRF Protection** - JWT tokens do Supabase

### Variáveis de Ambiente

Crie `.env.local` baseado em `.env.example`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

**⚠️ IMPORTANTE**: Nunca commite `.env.local` no git!

## 🧪 Testes (Em Desenvolvimento)

```bash
# Rodar todos os testes
npm run test

# Watch mode
npm run test:watch

# Cobertura
npm run test:coverage
```

**Meta de Cobertura**: 80%+

## 🚢 Deploy

### Recomendações de Hosting

- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Supabase (incluído)
- **Edge Functions**: Supabase Edge Functions

### Build para Produção

```bash
# 1. Build otimizado
npm run build

# 2. Testar build localmente
npm run preview

# 3. Deploy (exemplo com Vercel)
npx vercel --prod
```

## 📊 Status do Projeto

### Completado ✅ (80%)

- [x] Autenticação com Supabase Auth
- [x] CRUD de Professores com React Query
- [x] CRUD de Agenda/Horários
- [x] Dashboard responsivo
- [x] Validação Zod em formulários
- [x] Sistema de cores centralizado
- [x] TypeScript strict mode
- [x] Segurança (env vars + RLS)
- [x] Documentação completa (8.500+ linhas)

### Em Progresso 🚧 (15%)

- [ ] WhatsApp Messaging (documentado)
- [ ] Testes automatizados
- [ ] ProfileView com dados reais
- [ ] SearchView com dados reais

### Planejado 📋 (5%)

- [ ] Gestão de Alunos
- [ ] Sistema de Pagamentos
- [ ] Relatórios e Analytics
- [ ] App Mobile (React Native)

## 🗺️ Roadmap

### Sprint 1-2 (Atual) ✅
- ✅ Autenticação real
- ✅ Integração com Supabase
- ✅ React Query hooks
- ✅ Documentação LLM-friendly

### Sprint 3-4 (Próximos)
- [ ] Testes unitários (Vitest)
- [ ] Componentes restantes com dados reais
- [ ] Limpeza de dependências
- [ ] Melhoria de acessibilidade

### Sprint 5-6 (Futuro)
- [ ] WhatsApp Messaging
- [ ] Notificações automáticas
- [ ] Relatórios básicos
- [ ] Testes E2E

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estes passos:

1. **Fork** o projeto
2. **Crie uma branch** (`git checkout -b feature/nova-feature`)
3. **Commit** suas mudanças (`git commit -m 'feat: adicionar nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. **Abra um Pull Request**

### Convenções de Commit

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração de código
docs: atualização de documentação
test: adição/modificação de testes
chore: tarefas de manutenção
```

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja [LICENSE](./LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvimento & Documentação** - Equipe ProfFlow Manager
- **Contribuidores** - [Ver contribuidores](https://github.com/msoutole/prof-flow-manager/graphs/contributors)

## 🙏 Agradecimentos

Agradecimentos especiais às tecnologias que tornaram este projeto possível:

- [React](https://react.dev/) - The library for web and native user interfaces
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Supabase](https://supabase.com/) - The Open Source Firebase Alternative
- [TanStack Query](https://tanstack.com/query) - Powerful asynchronous state management
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components built with Radix UI and Tailwind
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Zod](https://zod.dev/) - TypeScript-first schema validation

## 📞 Suporte

- 📧 **Email**: [Criar issue no GitHub](https://github.com/msoutole/prof-flow-manager/issues)
- 📚 **Documentação**: [docs/INDEX.md](./docs/INDEX.md)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/msoutole/prof-flow-manager/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/msoutole/prof-flow-manager/discussions)

## 📈 Métricas do Projeto

- **Linhas de Código**: ~15.000+
- **Linhas de Documentação**: 8.500+
- **Componentes React**: 25+
- **Hooks Customizados**: 17+
- **Funções de Serviço**: 20+
- **Zod Schemas**: 5+
- **Tempo de Build**: ~2-3s
- **Bundle Size**: ~350KB (gzipped)

---

<div align="center">

**Última Atualização**: 17 de Novembro de 2025

Feito com ❤️ pela equipe ProfFlow Manager

[⬆ Voltar ao topo](#-profflow-manager-agendapro)

</div>
