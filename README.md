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

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/317926c3-3097-4dfe-bd28-ce0b2518a098) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
