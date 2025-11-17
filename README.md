# ProfFlow Manager (AgendaPro)

Sistema de gerenciamento de agendamentos para professores, desenvolvido com React, TypeScript, Vite e Supabase.

## 🚀 Features

- ✅ Gerenciamento de horários de professores
- ✅ Agendamento de aulas
- ✅ Busca por disponibilidade
- ✅ Gerenciamento de perfis
- ✅ Sistema de listas especiais (melhores professores/restritos)
- ✅ Tema escuro/claro
- ✅ Design responsivo (mobile-first)
- 📝 Sistema de mensagens WhatsApp (documentado, em desenvolvimento)

## 🏗️ Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions + Realtime)
- **Forms:** React Hook Form + Zod
- **State:** React Query (TanStack Query)
- **Routing:** React Router v6

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/msoutole/prof-flow-manager.git
cd prof-flow-manager
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite .env.local com suas credenciais do Supabase
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

**IMPORTANTE:** O arquivo `.env.local` contém credenciais sensíveis e não deve ser commitado no git.

### 4. Execute o projeto

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

A aplicação estará disponível em `http://localhost:8080`

## 📂 Estrutura do Projeto

```
prof-flow-manager/
├── docs/                          # Documentação técnica
│   ├── whatsapp-messaging/        # Docs da funcionalidade WhatsApp
│   │   ├── README.md
│   │   ├── 01-ARQUITETURA.md
│   │   ├── 02-GUIA-IMPLEMENTACAO.md
│   │   ├── 03-API-INTEGRACAO.md
│   │   ├── 04-CONFIGURACAO-DEPLOYMENT.md
│   │   └── 05-ALTERNATIVAS.md
│   └── REVISAO-COMPLETA.md        # Análise e melhorias do projeto
├── src/
│   ├── components/                # Componentes React
│   │   ├── Auth/                  # Autenticação
│   │   ├── Dashboard/             # Views do dashboard
│   │   ├── Layout/                # Header, Sidebar
│   │   ├── Schedule/              # Componentes de agenda
│   │   └── ui/                    # shadcn/ui components
│   ├── hooks/                     # Custom React hooks
│   ├── integrations/
│   │   └── supabase/              # Cliente e types do Supabase
│   ├── lib/                       # Utilitários
│   │   ├── colors.ts              # Helpers de cores
│   │   ├── validators.ts          # Schemas Zod
│   │   └── utils.ts               # Funções gerais
│   ├── pages/                     # Páginas principais
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── config.toml                # Configuração Supabase
├── .env.example                   # Exemplo de variáveis de ambiente
├── .env.local                     # Credenciais reais (NÃO commitado)
├── package.json
├── tsconfig.json                  # TypeScript strict mode
├── vite.config.ts
└── tailwind.config.ts
```

## 🗄️ Banco de Dados

O projeto usa Supabase com PostgreSQL. Schema principal:

- `profiles` - Perfis de usuários (admin/teacher)
- `teachers` - Dados dos professores
- `schedules` - Horários e agendamentos
- `special_lists` - Listas especiais de professores

## 🧪 Testes

```bash
# Rodar testes (quando implementado)
npm run test

# Cobertura de testes
npm run test:coverage
```

## 📖 Documentação

A documentação completa está disponível na pasta `docs/`:

- **[Revisão Completa](./docs/REVISAO-COMPLETA.md)** - Análise detalhada do projeto, problemas identificados e melhorias propostas
- **[Mensagens WhatsApp](./docs/whatsapp-messaging/README.md)** - Documentação completa da funcionalidade de mensagens WhatsApp

### Documentação WhatsApp (5.400+ linhas)

1. [Arquitetura](./docs/whatsapp-messaging/01-ARQUITETURA.md) - Design e estrutura da solução
2. [Guia de Implementação](./docs/whatsapp-messaging/02-GUIA-IMPLEMENTACAO.md) - Passo a passo técnico
3. [API e Integração](./docs/whatsapp-messaging/03-API-INTEGRACAO.md) - Documentação de APIs
4. [Configuração e Deploy](./docs/whatsapp-messaging/04-CONFIGURACAO-DEPLOYMENT.md) - Setup e produção
5. [Alternativas](./docs/whatsapp-messaging/05-ALTERNATIVAS.md) - Comparação de soluções (Chatwoot, WAHA, etc.)

## 🔐 Segurança

- ✅ Credenciais armazenadas em variáveis de ambiente
- ✅ Row Level Security (RLS) no Supabase
- ✅ Validação de formulários com Zod
- ✅ TypeScript strict mode ativado
- ⚠️ Autenticação mock (substituir por Supabase Auth)

## 🚧 Status do Projeto

- ✅ Frontend completo e funcional
- ✅ Design system implementado
- ✅ Responsividade mobile
- ✅ Tema escuro/claro
- 📝 Autenticação mock (migrar para Supabase Auth)
- 📝 Dados mockados (conectar ao banco real)
- 📝 Funcionalidade WhatsApp (documentada, não implementada)
- ❌ Testes automatizados (pendente)

## 📝 Roadmap

### Prioridade Alta (Semana 1-2)
- [ ] Implementar autenticação real com Supabase Auth
- [ ] Conectar dados reais do banco
- [ ] Implementar validações com Zod
- [ ] Remover dependências não utilizadas

### Prioridade Média (Semana 3-4)
- [ ] Adicionar testes unitários (Vitest)
- [ ] Melhorar acessibilidade (WCAG 2.1)
- [ ] Documentação inline (JSDoc)
- [ ] Implementar funcionalidade WhatsApp

### Prioridade Baixa (Futuro)
- [ ] Testes E2E (Playwright/Cypress)
- [ ] CI/CD com GitHub Actions
- [ ] Analytics e métricas
- [ ] PWA support

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

- **Equipe ProfFlow Manager** - Desenvolvimento e Documentação

## 🙏 Agradecimentos

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Última atualização:** Novembro 2024
