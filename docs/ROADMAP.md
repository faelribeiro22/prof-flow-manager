# 🗺️ Roadmap de Desenvolvimento - AgendaPro

## Visão Geral

Este roadmap apresenta o planejamento de desenvolvimento do AgendaPro em sprints de 2 semanas.

---

## ✅ Sprint 0 - Configuração Inicial (CONCLUÍDO)

**Período:** Antes de 02/11/2025  
**Status:** ✅ Completo

### Entregas
- [x] Setup do projeto (Vite + React + TypeScript)
- [x] Configuração do Supabase
- [x] Estrutura de pastas
- [x] Componentes UI básicos (shadcn/ui)
- [x] Sistema de temas (dark/light)
- [x] Layout responsivo (Header + Sidebar)
- [x] Autenticação básica (Login/Register)
- [x] Context API para auth

---

## 🚀 Sprint 1 - Fundação do Sistema (ATUAL)

**Período:** 02/11/2025 - 15/11/2025  
**Status:** 🔄 Em Progresso (30%)

### Objetivos
Completar a autenticação e preparar banco de dados para features core.

### Tasks

#### Autenticação e Segurança
- [x] ✅ Implementar logout funcional
- [x] ✅ Corrigir fluxo de autenticação
- [ ] ⚠️ Implementar triggers do Supabase
  - [ ] Trigger para criar profile automaticamente
  - [ ] Trigger para updated_at
- [ ] Implementar políticas RLS completas
  - [ ] Políticas para schedules
  - [ ] Políticas para special_lists
- [ ] Adicionar recuperação de senha
- [ ] Testes de autenticação

#### Modelo de Dados
- [ ] Criar índices otimizados
- [ ] Validar constraints das tabelas
- [ ] Seed data para testes
- [ ] Documentar queries principais

#### Documentação
- [x] ✅ Documentação do projeto
- [x] ✅ Diagrama de dados
- [x] ✅ Checklist de features
- [x] ✅ Roadmap

### Critérios de Aceite
- [ ] Usuário consegue fazer login/logout sem erros
- [ ] Perfil é criado automaticamente ao registrar
- [ ] RLS protege dados corretamente
- [ ] Documentação está atualizada

---

## 📅 Sprint 2 - Gerenciamento de Agenda (Core)

**Período:** 16/11/2025 - 29/11/2025  
**Status:** 📋 Planejada

### Objetivos
Implementar a funcionalidade principal: gerenciamento de agenda.

### Tasks

#### ScheduleGrid Completo
- [ ] Criar grade 7x15 (dias x horas)
- [ ] Estilizar horários (livre/ocupado)
- [ ] Adicionar indicadores visuais
- [ ] Implementar tooltip com info do horário
- [ ] Responsividade mobile

#### CRUD de Horários
- [ ] API: Criar horários em lote
- [ ] API: Atualizar status do horário
- [ ] API: Adicionar/remover aluno
- [ ] API: Buscar horários por professor
- [ ] Frontend: Modal para editar horário
- [ ] Frontend: Confirmar ações
- [ ] Validações (horário único, etc.)

#### Operações em Lote
- [ ] Selecionar múltiplos horários
- [ ] Marcar/desmarcar em lote
- [ ] Copiar horários entre dias

#### Testes
- [ ] Testes unitários das funções
- [ ] Testes de integração com Supabase
- [ ] Testes E2E do fluxo principal

### Critérios de Aceite
- [ ] Professor consegue ver sua agenda completa
- [ ] Professor consegue marcar/desmarcar horários
- [ ] Professor consegue adicionar nome de aluno
- [ ] Admin consegue ver agenda de qualquer professor
- [ ] Dados são persistidos corretamente
- [ ] Interface é intuitiva e responsiva

---

## 🔍 Sprint 3 - Busca de Professores

**Período:** 30/11/2025 - 13/12/2025  
**Status:** 📋 Planejada

### Objetivos
Implementar sistema de busca de professores disponíveis.

### Tasks

#### Interface de Busca
- [ ] Formulário de filtros
  - [ ] Seletor de dia da semana
  - [ ] Seletor de horário
  - [ ] Filtro por nível
  - [ ] Filtro por certificação
- [ ] Botão de buscar
- [ ] Reset de filtros

#### Lógica de Busca
- [ ] Query SQL otimizada
- [ ] Function no Supabase (se necessário)
- [ ] API para busca
- [ ] Ordenação de resultados
- [ ] Paginação

#### Exibição de Resultados
- [ ] Cards de professores
- [ ] Informações do professor
- [ ] Horários disponíveis
- [ ] Detalhes ao clicar
- [ ] Empty state (sem resultados)

#### Otimizações
- [ ] Cache de resultados
- [ ] Debounce na busca
- [ ] Loading states
- [ ] Error handling

### Critérios de Aceite
- [ ] Busca retorna professores corretos
- [ ] Filtros funcionam isoladamente e combinados
- [ ] Performance é aceitável (< 1s)
- [ ] Interface é clara e responsiva
- [ ] Tratamento de erros adequado

---

## 👥 Sprint 4 - CRUD de Professores

**Período:** 14/12/2025 - 27/12/2025  
**Status:** 📋 Planejada

### Objetivos
Completar gerenciamento de professores.

### Tasks

#### Formulários
- [ ] Formulário de criação
- [ ] Formulário de edição
- [ ] Validações com Zod
- [ ] React Hook Form
- [ ] Mensagens de erro claras

#### Upload de Foto
- [ ] Configurar Supabase Storage
- [ ] Componente de upload
- [ ] Crop/resize de imagem
- [ ] Preview da foto
- [ ] Exclusão de foto antiga

#### CRUD Completo
- [ ] API: Criar professor
- [ ] API: Editar professor
- [ ] API: Excluir professor
- [ ] API: Buscar professores
- [ ] Frontend: Lista com paginação
- [ ] Frontend: Confirmação de exclusão
- [ ] Frontend: Feedback de sucesso/erro

#### Melhorias na Lista
- [ ] Ordenação (nome, nível, etc.)
- [ ] Filtros avançados
- [ ] Busca por nome/email
- [ ] Export para CSV/PDF

### Critérios de Aceite
- [ ] Admin consegue criar professores
- [ ] Admin consegue editar professores
- [ ] Admin consegue excluir professores
- [ ] Professores conseguem editar próprio perfil
- [ ] Upload de foto funciona
- [ ] Validações impedem dados inválidos

---

## 📝 Sprint 5 - Listas Especiais

**Período:** 28/12/2025 - 10/01/2026  
**Status:** 📋 Planejada

### Objetivos
Implementar sistema de listas especiais (férias, licenças, etc.).

### Tasks

#### CRUD Completo
- [ ] API: Criar lista especial
- [ ] API: Editar lista especial
- [ ] API: Excluir lista especial
- [ ] API: Buscar listas
- [ ] Frontend: Formulário de criação
- [ ] Frontend: Formulário de edição
- [ ] Frontend: Confirmação de exclusão

#### Validações e Regras
- [ ] Validação de datas
- [ ] Tipos de lista (dropdown)
- [ ] Campos obrigatórios
- [ ] Validação de sobreposição (opcional)

#### Visualização
- [ ] Lista de listas especiais
- [ ] Filtro por professor
- [ ] Filtro por tipo
- [ ] Filtro por período
- [ ] Indicação de listas ativas
- [ ] Cards com detalhes

#### Integrações
- [ ] Destacar listas na agenda
- [ ] Considerar listas na busca de professores
- [ ] Alertas de listas próximas ao fim

### Critérios de Aceite
- [ ] Professores conseguem criar listas
- [ ] Admin consegue ver todas as listas
- [ ] Validações impedem dados inválidos
- [ ] Listas são consideradas em outras features
- [ ] Interface é intuitiva

---

## 👤 Sprint 6 - Perfil e Configurações

**Período:** 11/01/2026 - 24/01/2026  
**Status:** 📋 Planejada

### Objetivos
Completar funcionalidades de perfil do usuário.

### Tasks

#### Edição de Perfil
- [ ] Formulário de edição
- [ ] Editar dados pessoais
- [ ] Upload de avatar
- [ ] Validações
- [ ] Feedback de sucesso/erro

#### Segurança
- [ ] Alterar senha
- [ ] Validar senha atual
- [ ] Requisitos de senha forte
- [ ] Confirmação de senha

#### Configurações
- [ ] Preferências de notificação
- [ ] Preferências de visualização
- [ ] Tema (já implementado)
- [ ] Fuso horário
- [ ] Idioma (preparar i18n)

#### Melhorias
- [ ] Estatísticas pessoais
- [ ] Histórico de atividades
- [ ] Logs de acesso

### Critérios de Aceite
- [ ] Usuário consegue editar seu perfil
- [ ] Usuário consegue alterar senha
- [ ] Upload de avatar funciona
- [ ] Configurações são persistidas
- [ ] Validações impedem dados inválidos

---

## 📊 Sprint 7 - Relatórios e Analytics

**Período:** 25/01/2026 - 07/02/2026  
**Status:** 📋 Planejada

### Objetivos
Adicionar dashboard com estatísticas e relatórios.

### Tasks

#### Dashboard
- [ ] Estatísticas gerais
- [ ] Professores mais ocupados
- [ ] Horários de pico
- [ ] Taxa de ocupação
- [ ] Gráficos visuais (Chart.js/Recharts)

#### Relatórios
- [ ] Relatório de agenda por professor
- [ ] Relatório de ocupação por período
- [ ] Relatório de listas especiais
- [ ] Export para PDF
- [ ] Export para Excel

#### Analytics
- [ ] Comparação de períodos
- [ ] Tendências
- [ ] Insights automáticos
- [ ] Filtros avançados

### Critérios de Aceite
- [ ] Dashboard exibe estatísticas corretas
- [ ] Gráficos são visuais e informativos
- [ ] Relatórios podem ser exportados
- [ ] Performance é aceitável

---

## 🔔 Sprint 8 - Notificações

**Período:** 08/02/2026 - 21/02/2026  
**Status:** 📋 Planejada

### Objetivos
Implementar sistema de notificações.

### Tasks

#### Email
- [ ] Configurar serviço de email (SendGrid/Resend)
- [ ] Templates de email
- [ ] Email de boas-vindas
- [ ] Email de confirmação
- [ ] Lembretes de aulas
- [ ] Alertas de listas especiais

#### In-App
- [ ] Centro de notificações
- [ ] Badge com contador
- [ ] Notificações em tempo real
- [ ] Marcar como lida
- [ ] Filtros de notificação

#### Preferências
- [ ] Configurar quais notificações receber
- [ ] Frequência de emails
- [ ] Horários de notificação

### Critérios de Aceite
- [ ] Emails são enviados corretamente
- [ ] Notificações in-app funcionam
- [ ] Usuário pode configurar preferências
- [ ] Performance não é impactada

---

## 🚀 Sprint 9 - Performance e Testes

**Período:** 22/02/2026 - 07/03/2026  
**Status:** 📋 Planejada

### Objetivos
Otimizar performance e adicionar testes.

### Tasks

#### Performance
- [ ] Code splitting
- [ ] Lazy loading de rotas
- [ ] Memoization de componentes
- [ ] Otimização de queries
- [ ] Virtual scrolling (se necessário)
- [ ] Otimização de imagens
- [ ] Service Worker (PWA)

#### Testes
- [ ] Unit tests (> 80% coverage)
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] Visual regression tests
- [ ] Performance tests
- [ ] Security tests

#### Monitoramento
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel/Google)
- [ ] Performance monitoring
- [ ] Logging estruturado

### Critérios de Aceite
- [ ] Lighthouse score > 90
- [ ] Coverage de testes > 80%
- [ ] Tempo de carregamento < 2s
- [ ] Erros são rastreados
- [ ] Métricas são coletadas

---

## 🎯 Sprint 10 - Polish e Deploy

**Período:** 08/03/2026 - 21/03/2026  
**Status:** 📋 Planejada

### Objetivos
Finalizar e preparar para produção.

### Tasks

#### UX/UI Polish
- [ ] Revisão de toda a interface
- [ ] Animações e transições
- [ ] Micro-interações
- [ ] Feedback visual consistente
- [ ] Acessibilidade (WCAG 2.1)
- [ ] Testes de usabilidade

#### DevOps
- [ ] CI/CD pipeline
- [ ] Environments (dev/staging/prod)
- [ ] Backups automáticos
- [ ] Disaster recovery plan
- [ ] Documentação de deploy

#### Segurança
- [ ] Audit de segurança
- [ ] HTTPS configurado
- [ ] Headers de segurança
- [ ] Rate limiting
- [ ] CORS configurado

#### Documentação
- [ ] README completo
- [ ] Guia de instalação
- [ ] Guia de contribuição
- [ ] API documentation
- [ ] User manual

### Critérios de Aceite
- [ ] Aplicação está em produção
- [ ] Todos os testes passam
- [ ] Documentação está completa
- [ ] Segurança está validada
- [ ] Performance está otimizada

---

## 🔮 Backlog Futuro (Post-Launch)

### Integrações
- [ ] Google Calendar
- [ ] Microsoft Outlook
- [ ] WhatsApp API
- [ ] Zoom/Google Meet
- [ ] Payment Gateway (Stripe/PayPal)

### Features Avançadas
- [ ] Agendamento online para alunos
- [ ] Sistema de avaliações
- [ ] Chat professor/aluno
- [ ] Materiais didáticos
- [ ] Controle financeiro
- [ ] Multi-tenant (múltiplas escolas)
- [ ] Mobile app (React Native)

### Internacionalização
- [ ] i18n setup
- [ ] Traduções (PT, EN, ES)
- [ ] Formatos de data/hora por locale
- [ ] Moedas por região

---

## 📈 Métricas de Sucesso

### Sprint-level
- Velocity: 20-30 story points por sprint
- Bug rate: < 5 bugs críticos por sprint
- Code review: 100% do código revisado
- Coverage: > 80% após Sprint 9

### Project-level
- MVP launch: Sprint 6 (24/01/2026)
- Production release: Sprint 10 (21/03/2026)
- User satisfaction: > 4.5/5
- Performance: Lighthouse > 90
- Uptime: > 99.5%

---

## 🎯 Marcos Importantes

| Marco | Data | Status |
|-------|------|--------|
| MVP Planning | 02/11/2025 | ✅ Completo |
| Autenticação Completa | 15/11/2025 | 🔄 Em Progresso |
| **MVP Agenda** | 29/11/2025 | 📋 Planejado |
| **MVP Busca** | 13/12/2025 | 📋 Planejado |
| **MVP Release** | 24/01/2026 | 📋 Planejado |
| Production Ready | 21/03/2026 | 📋 Planejado |
| V1.0 Launch | 01/04/2026 | 📋 Planejado |

---

**Última atualização:** 02/11/2025  
**Próxima revisão:** 15/11/2025 (fim da Sprint 1)
