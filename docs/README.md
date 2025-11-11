# 📚 Documentação do AgendaPro

Bem-vindo à documentação do **AgendaPro** - Sistema de Gestão de Agendas para Professores de Idiomas.

---

## 📖 Índice da Documentação

### 1. [Documentação do Projeto](./PROJECT_DOCUMENTATION.md)
**Visão geral completa do sistema**
- 📋 Objetivos e funcionalidades
- 👥 Tipos de usuário e permissões
- 🗃️ Modelo de dados
- 🔐 Segurança e RLS
- 🏗️ Arquitetura e stack tecnológico
- 🎨 Design system e temas
- 📱 Responsividade

### 2. [Modelo de Dados](./DATA_MODEL.md)
**Diagramas e estrutura do banco de dados**
- 📊 Diagrama ER (Entity Relationship)
- 🔄 Relacionamentos entre entidades
- 💻 Interfaces TypeScript
- 📐 Regras de negócio
- 🔍 Índices e otimizações
- ⚡ Triggers necessários

### 3. [Checklist de Features](./FEATURES_CHECKLIST.md)
**Status de implementação de todas as funcionalidades**
- ✅ Features implementadas
- ⚠️ Features parcialmente implementadas
- ❌ Features pendentes
- 🎯 Prioridades de desenvolvimento
- 📈 Status geral do projeto (30%)

### 4. [Roadmap](./ROADMAP.md)
**Planejamento de sprints e marcos**
- 📅 Sprints planejadas (10 sprints)
- 🎯 Objetivos e entregas
- 📊 Métricas de sucesso
- 🔮 Backlog futuro
- 🚀 Marcos importantes

---

## 🚀 Quick Start

### Informações Essenciais

**Status do Projeto:** MVP em desenvolvimento (30% completo)  
**Stack:** React + TypeScript + Vite + Supabase + Tailwind CSS  
**Período Atual:** Sprint 1 - Fundação do Sistema  
**Próximo Marco:** MVP Agenda (29/11/2025)

### O que está funcionando agora?
- ✅ Autenticação (Login/Register/Logout)
- ✅ Layout responsivo com tema dark/light
- ✅ Navegação entre páginas
- ✅ Visualização básica de professores
- ✅ Estrutura de agenda (interface)

### O que falta implementar?
- 🔴 CRUD completo de agenda (Prioridade Alta)
- 🔴 Busca de professores disponíveis (Prioridade Alta)
- 🟡 CRUD de listas especiais (Prioridade Média)
- 🟡 Edição de perfil completa (Prioridade Média)

---

## 📂 Estrutura dos Documentos

```
docs/
├── README.md                    # Este arquivo (índice)
├── PROJECT_DOCUMENTATION.md     # Documentação geral
├── DATA_MODEL.md               # Modelo de dados e diagramas
├── FEATURES_CHECKLIST.md       # Lista de features
└── ROADMAP.md                  # Planejamento de sprints
```

---

## 🎯 Para Desenvolvedores

### Antes de começar uma nova feature:

1. ✅ **Leia a documentação relevante**
   - Verifique [FEATURES_CHECKLIST.md](./FEATURES_CHECKLIST.md) para ver o status
   - Consulte [DATA_MODEL.md](./DATA_MODEL.md) para entender as entidades
   - Revise [ROADMAP.md](./ROADMAP.md) para ver a prioridade

2. ✅ **Entenda o modelo de dados**
   - Veja os diagramas ER
   - Revise as interfaces TypeScript
   - Entenda os relacionamentos

3. ✅ **Verifique as regras de negócio**
   - Validações necessárias
   - Políticas RLS
   - Constraints do banco

4. ✅ **Siga o padrão do projeto**
   - Estrutura de pastas
   - Naming conventions
   - Componentes reutilizáveis

### Ao finalizar uma feature:

1. ✅ **Atualize a documentação**
   - Marque como concluído em [FEATURES_CHECKLIST.md](./FEATURES_CHECKLIST.md)
   - Atualize [ROADMAP.md](./ROADMAP.md) se necessário
   - Documente decisões técnicas

2. ✅ **Teste adequadamente**
   - Testes unitários
   - Testes de integração
   - Validações manuais

3. ✅ **Code review**
   - Revise seu próprio código
   - Peça revisão de pares
   - Siga as guidelines

---

## 🔍 Navegação Rápida

### Por Funcionalidade

**Autenticação**
- [Documentação](./PROJECT_DOCUMENTATION.md#1-autenticação-e-autorização)
- [Features](./FEATURES_CHECKLIST.md#-1-autenticação-e-autorização)
- [Sprint](./ROADMAP.md#-sprint-1---fundação-do-sistema-atual)

**Agenda**
- [Documentação](./PROJECT_DOCUMENTATION.md#3-gerenciamento-de-agenda)
- [Modelo de Dados](./DATA_MODEL.md#3-teachers--schedules-1n)
- [Features](./FEATURES_CHECKLIST.md#-3-gerenciamento-de-agenda)
- [Sprint](./ROADMAP.md#-sprint-2---gerenciamento-de-agenda-core)

**Professores**
- [Documentação](./PROJECT_DOCUMENTATION.md#2-gerenciamento-de-professores)
- [Modelo de Dados](./DATA_MODEL.md#2-auth_users--teachers-101)
- [Features](./FEATURES_CHECKLIST.md#-2-gerenciamento-de-professores)
- [Sprint](./ROADMAP.md#-sprint-4---crud-de-professores)

**Busca**
- [Documentação](./PROJECT_DOCUMENTATION.md#4-busca-de-professores)
- [Features](./FEATURES_CHECKLIST.md#-4-busca-de-professores)
- [Sprint](./ROADMAP.md#-sprint-3---busca-de-professores)

**Listas Especiais**
- [Documentação](./PROJECT_DOCUMENTATION.md#5-listas-especiais)
- [Modelo de Dados](./DATA_MODEL.md#4-teachers--special_lists-1n)
- [Features](./FEATURES_CHECKLIST.md#-5-listas-especiais)
- [Sprint](./ROADMAP.md#-sprint-5---listas-especiais)

---

## 🛠️ Tecnologias

### Frontend
- **Framework:** React 18 com TypeScript
- **Build Tool:** Vite
- **UI Library:** Shadcn/ui (Radix UI)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod (planejado)
- **Routing:** React Router

### Backend
- **BaaS:** Supabase
- **Database:** PostgreSQL
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (planejado)
- **Real-time:** Supabase Realtime (planejado)

### DevOps
- **Package Manager:** Bun
- **Version Control:** Git
- **Hosting:** TBD (Vercel/Netlify planejado)
- **CI/CD:** TBD (planejado)

---

## 📊 Status Atual do Projeto

| Categoria | Progresso | Status |
|-----------|-----------|--------|
| Autenticação | 70% | 🟢 Em Andamento |
| Professores | 40% | 🟡 Parcial |
| Agenda | 10% | 🔴 Inicial |
| Busca | 5% | 🔴 Inicial |
| Listas Especiais | 5% | 🔴 Inicial |
| Perfil | 20% | 🟡 Parcial |
| Interface | 60% | 🟢 Boa Base |
| Backend | 25% | 🟡 Em Setup |
| **GERAL** | **~30%** | 🟡 **MVP em Desenvolvimento** |

---

## 🤝 Como Contribuir

1. **Clone o repositório**
2. **Leia toda a documentação** (especialmente este README e FEATURES_CHECKLIST)
3. **Escolha uma feature** do roadmap atual
4. **Crie uma branch** seguindo o padrão: `feature/nome-da-feature`
5. **Desenvolva e teste**
6. **Atualize a documentação**
7. **Abra um Pull Request**

---

## 📞 Contato e Suporte

Para dúvidas sobre o projeto, consulte:
1. Esta documentação
2. Issues no repositório
3. Código existente como referência

---

## 📝 Changelog

### v0.3.0 - 02/11/2025
- ✅ Documentação completa criada
- ✅ Logout funcional implementado
- ✅ Correções no fluxo de autenticação
- 📚 Diagramas de dados criados
- 📋 Checklist de features criada
- 🗺️ Roadmap de 10 sprints planejado

### v0.2.0 - Anterior
- ✅ Autenticação básica (Login/Register)
- ✅ Layout responsivo
- ✅ Tema dark/light
- ✅ Estrutura de componentes

### v0.1.0 - Inicial
- ✅ Setup do projeto
- ✅ Configuração do Supabase
- ✅ Estrutura de pastas

---

## 🎯 Próximos Passos Imediatos

1. **Completar Sprint 1** (até 15/11/2025)
   - Implementar triggers do Supabase
   - Completar políticas RLS
   - Adicionar recuperação de senha

2. **Iniciar Sprint 2** (16/11/2025)
   - ScheduleGrid completo
   - CRUD de horários
   - Operações em lote

3. **Manter documentação atualizada**
   - Atualizar checklist após cada feature
   - Revisar roadmap semanalmente
   - Documentar decisões técnicas

---

**Última atualização:** 02/11/2025  
**Versão da Documentação:** 1.0.0  
**Mantenedores:** Equipe AgendaPro

---

## 📜 Licença

TBD

---

**🚀 Happy Coding!**
