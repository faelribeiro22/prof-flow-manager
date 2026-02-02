# Funcionalidade de Mensagens WhatsApp - ProfFlow Manager

## 📱 Visão Geral

Esta documentação descreve a implementação completa da funcionalidade de mensagens via WhatsApp para o **ProfFlow Manager (AgendaPro)**, permitindo comunicação automatizada e manual entre administradores, professores e alunos.

### Funcionalidades Principais

✅ **Notificações Automáticas**
- Confirmação de agendamento
- Lembretes de aula (24h antes)
- Cancelamentos e alterações

✅ **Mensagens Manuais**
- Envio personalizado para alunos
- Templates pré-aprovados
- Envio em massa

✅ **Histórico e Rastreamento**
- Registro de todas as mensagens
- Status de entrega (enviado, entregue, lido)
- Logs detalhados

✅ **Gerenciamento de Templates**
- Criação e edição de templates
- Variáveis dinâmicas
- Aprovação via WhatsApp Business

✅ **Dashboard de Métricas**
- Taxa de entrega
- Mensagens enviadas por período
- Templates mais utilizados

---

## 📚 Documentação

Esta funcionalidade está documentada em 5 documentos principais:

### 1️⃣ [Arquitetura](./01-ARQUITETURA.md)
**O que você vai encontrar:**
- Visão geral da solução
- Modelo de dados (tabelas, enums, relacionamentos)
- Fluxos de dados (automático, manual, webhooks)
- Componentes de frontend e backend
- Políticas de segurança (RLS)
- Escalabilidade e custos

**Quando usar:**
- Para entender a estrutura geral da solução
- Ao planejar modificações na arquitetura
- Para revisar decisões técnicas

### 2️⃣ [Guia de Implementação](./02-GUIA-IMPLEMENTACAO.md)
**O que você vai encontrar:**
- Passo a passo da implementação
- Configuração do banco de dados (migrations)
- Desenvolvimento de Edge Functions
- Criação de componentes React
- Hooks e integrações

**Quando usar:**
- Durante o desenvolvimento da funcionalidade
- Para implementar novas features
- Ao fazer code review

### 3️⃣ [API e Integração](./03-API-INTEGRACAO.md)
**O que você vai encontrar:**
- Documentação da WhatsApp Business API
- Endpoints das Edge Functions
- Formato de mensagens e templates
- Webhooks e eventos
- Tratamento de erros
- Exemplos de código

**Quando usar:**
- Ao integrar com WhatsApp API
- Para debug de problemas de envio
- Ao criar novos templates
- Para entender os webhooks

### 4️⃣ [Configuração e Deploy](./04-CONFIGURACAO-DEPLOYMENT.md)
**O que você vai encontrar:**
- Setup completo do ambiente
- Configuração WhatsApp Business
- Deploy de Edge Functions
- Configuração de webhooks
- Testes e monitoramento
- Troubleshooting

**Quando usar:**
- Ao configurar o ambiente pela primeira vez
- Para fazer deploy em produção
- Ao resolver problemas
- Para configurar CI/CD

### 5️⃣ [Alternativas de Integração](./05-ALTERNATIVAS.md) ⭐ NOVO
**O que você vai encontrar:**
- Comparação de 8+ soluções (Chatwoot, WAHA, Twilio, Evolution API, etc.)
- Análise de custos e benefícios
- Tabelas comparativas de features
- Guias de implementação para cada alternativa
- Matriz de decisão
- Recomendações por caso de uso

**Quando usar:**
- **Antes de começar a implementação** (escolher a melhor solução)
- Ao avaliar alternativas mais baratas
- Se precisar de mensagens livres (sem templates)
- Para comparar soluções oficiais vs não-oficiais
- Ao considerar plataformas completas (Chatwoot)

---

## 🤔 Qual Solução de WhatsApp Escolher?

Existem **diversas alternativas** para integrar WhatsApp. Antes de começar, consulte nosso [**Guia de Alternativas**](./05-ALTERNATIVAS.md) para escolher a melhor opção:

### Comparação Rápida

| Solução | Oficial | Custo/mês | Melhor Para |
|---------|---------|-----------|-------------|
| **WhatsApp Business API** ⭐ | ✅ Sim | $10-50 | Produção, compliance |
| **Chatwoot** | ✅ Sim | $40-100 | Atendimento multi-agente |
| **WAHA** | ❌ Não | $5-20 | Protótipos, MVP |
| **Twilio** | ✅ Sim | $50-200 | Fácil integração |
| **Evolution API** | ❌ Não | $10-30 | Projetos brasileiros |

⭐ **Nossa recomendação**: WhatsApp Business API (documentado aqui)

📖 **Ver comparação completa:** [05-ALTERNATIVAS.md](./05-ALTERNATIVAS.md)

### Quando Considerar Alternativas?

- 💰 **Orçamento muito limitado** → WAHA ou Evolution API
- 👥 **Equipe de atendimento** → Chatwoot
- 📝 **Mensagens livres (sem templates)** → WAHA, Evolution API
- 🚀 **Implementação rápida** → Twilio
- 🤖 **Automações complexas** → N8N + WhatsApp

---

## 🚀 Quick Start

### Para Desenvolvedores

```bash
# 1. Clone e instale dependências
git clone https://github.com/seu-usuario/prof-flow-manager.git
cd prof-flow-manager
npm install

# 2. Configure ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 3. Aplique migrations
supabase db push

# 4. Deploy Edge Functions
supabase functions deploy

# 5. Rode o projeto
npm run dev
```

📖 **Documentação completa:** [Guia de Implementação](./02-GUIA-IMPLEMENTACAO.md)

### Para Administradores

1. **Configure WhatsApp Business**
   - Crie conta no Meta Business Suite
   - Configure número de telefone
   - Obtenha credenciais (API Key, Phone ID)
   - 📖 [Ver passo a passo](./04-CONFIGURACAO-DEPLOYMENT.md#whatsapp-business-api-setup)

2. **Crie Templates de Mensagem**
   - Acesse WhatsApp Manager
   - Crie templates seguindo guidelines
   - Aguarde aprovação (24-48h)
   - 📖 [Ver exemplos de templates](./03-API-INTEGRACAO.md#templates)

3. **Configure no Sistema**
   - Acesse Configurações > WhatsApp
   - Insira credenciais
   - Habilite envios automáticos
   - Configure limites diários

---

## 🏗️ Arquitetura em Resumo

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│  - Dashboard de Mensagens               │
│  - Gerenciador de Templates             │
│  - Histórico e Métricas                 │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│       Supabase Backend                  │
│  - PostgreSQL Database                  │
│  - Edge Functions                       │
│  - Realtime Subscriptions               │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│      WhatsApp Business API              │
│  - Envio de Mensagens                   │
│  - Gerenciamento de Templates           │
│  - Webhooks de Status                   │
└─────────────────────────────────────────┘
```

📖 **Arquitetura detalhada:** [01-ARQUITETURA.md](./01-ARQUITETURA.md)

---

## 💾 Modelo de Dados

### Tabelas Principais

| Tabela | Descrição | Principais Campos |
|--------|-----------|-------------------|
| `whatsapp_messages` | Mensagens enviadas | recipient_phone, message_content, status, whatsapp_message_id |
| `whatsapp_templates` | Templates de mensagens | name, content, variables, is_approved |
| `whatsapp_config` | Configurações gerais | is_enabled, daily_message_limit, messages_sent_today |
| `whatsapp_delivery_logs` | Logs de entrega | message_id, event_type, event_data |

### Status de Mensagens

- `pending` - Aguardando envio
- `sent` - Enviada ao WhatsApp
- `delivered` - Entregue ao destinatário
- `read` - Lida pelo destinatário
- `failed` - Falha no envio

📖 **Schema completo:** [01-ARQUITETURA.md#modelo-de-dados](./01-ARQUITETURA.md#modelo-de-dados)

---

## 🔧 Componentes Técnicos

### Edge Functions (Supabase)

**`send-whatsapp-message`**
- Envia mensagens via WhatsApp API
- Valida telefone e dados
- Gerencia limites diários
- Registra mensagens no banco

**`whatsapp-webhook`**
- Recebe webhooks do WhatsApp
- Processa status de entrega
- Atualiza mensagens no banco
- Registra logs detalhados

**`schedule-whatsapp-reminders`** (futuro)
- Execução agendada (cron)
- Envia lembretes automáticos
- Verifica aulas nas próximas 24h

📖 **Implementação:** [02-GUIA-IMPLEMENTACAO.md#fase-3-supabase-edge-functions](./02-GUIA-IMPLEMENTACAO.md#fase-3-supabase-edge-functions)

### Componentes React

```
src/components/WhatsApp/
├── Messaging/
│   ├── MessagingDashboard.tsx
│   ├── MessagesList.tsx
│   └── MessageStats.tsx
├── Templates/
│   ├── TemplatesManager.tsx
│   ├── TemplateEditor.tsx
│   └── TemplatePreview.tsx
├── Compose/
│   ├── ComposeMessage.tsx
│   └── RecipientSelector.tsx
└── Settings/
    ├── WhatsAppSettings.tsx
    └── APICredentials.tsx
```

📖 **Detalhes dos componentes:** [01-ARQUITETURA.md#componentes-de-frontend](./01-ARQUITETURA.md#componentes-de-frontend)

---

## 📊 Fluxos de Uso

### 1. Envio Automático (Confirmação de Agendamento)

```
Usuário agenda aula
    ↓
Sistema detecta mudança de status
    ↓
Edge Function é invocada automaticamente
    ↓
Busca template de confirmação
    ↓
Substitui variáveis (nome, data, horário)
    ↓
Envia para WhatsApp Business API
    ↓
Salva registro no banco
    ↓
Frontend atualiza em tempo real
```

### 2. Envio Manual

```
Admin/Professor clica "Enviar Mensagem"
    ↓
Seleciona template ou escreve mensagem
    ↓
Preenche variáveis (se template)
    ↓
Visualiza preview
    ↓
Confirma envio
    ↓
Edge Function processa
    ↓
WhatsApp API envia
    ↓
Status atualizado em tempo real
```

### 3. Processamento de Status (Webhook)

```
WhatsApp envia webhook
    ↓
Edge Function valida e processa
    ↓
Atualiza status da mensagem
    ↓
Registra log de entrega
    ↓
Frontend recebe atualização via Realtime
```

📖 **Fluxos detalhados:** [01-ARQUITETURA.md#fluxos-de-dados](./01-ARQUITETURA.md#fluxos-de-dados)

---

## 🔐 Segurança

### Proteção de Dados

✅ **Row Level Security (RLS)**
- Professores veem apenas suas mensagens
- Admins têm acesso total
- Templates públicos para visualização

✅ **Credenciais Seguras**
- API Keys armazenadas como Supabase Secrets
- Nunca expostas no frontend
- Webhook com token de verificação

✅ **Validações**
- Formato de telefone (E.164)
- Limites diários
- Rate limiting
- Verificação JWT em Edge Functions

📖 **Políticas de segurança:** [01-ARQUITETURA.md#segurança](./01-ARQUITETURA.md#segurança)

---

## 💰 Custos Estimados

### WhatsApp Business API

| Tipo de Mensagem | Custo Aproximado |
|------------------|------------------|
| Template (Utilidade) | $0.005 - $0.02 por mensagem |
| Conversas iniciadas | Primeiras 1.000/mês grátis |

### Supabase

| Recurso | Limite Grátis | Custo Pro |
|---------|---------------|-----------|
| Edge Functions | 500k invocações/mês | Incluído ($25/mês) |
| Database | 500 MB | Incluído |
| Bandwidth | 5 GB | Incluído |

**Estimativa para 1.000 mensagens/mês:**
- WhatsApp API: ~$10-20/mês
- Supabase: Incluído no plano atual
- **Total: ~$10-20/mês**

📖 **Análise de custos:** [01-ARQUITETURA.md#custos-estimados](./01-ARQUITETURA.md#custos-estimados)

---

## 📈 Métricas e Monitoramento

### Métricas Principais

- **Taxa de entrega**: % de mensagens entregues com sucesso
- **Taxa de leitura**: % de mensagens lidas
- **Tempo de entrega**: Tempo médio até entrega
- **Taxa de falha**: % de mensagens com falha
- **Uso de templates**: Templates mais utilizados
- **Mensagens/dia**: Volume diário de envios

### Monitoramento

```bash
# Ver logs em tempo real
supabase functions logs send-whatsapp-message -f

# Consultar métricas no banco
SELECT status, COUNT(*) FROM whatsapp_messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

📖 **Guia de monitoramento:** [04-CONFIGURACAO-DEPLOYMENT.md#monitoramento](./04-CONFIGURACAO-DEPLOYMENT.md#monitoramento)

---

## 🧪 Testes

### Testes Locais

```bash
# Testar migrations
supabase db reset

# Testar Edge Functions
supabase functions serve send-whatsapp-message --debug

# Rodar testes unitários
npm run test
```

### Testes de Integração

```typescript
// Exemplo de teste
it('should send WhatsApp message', async () => {
  const result = await sendMessage({
    recipientPhone: '+5511999999999',
    messageContent: 'Teste',
    messageType: 'custom',
  });

  expect(result.success).toBe(true);
  expect(result.messageId).toBeDefined();
});
```

📖 **Guia de testes:** [04-CONFIGURACAO-DEPLOYMENT.md#testes](./04-CONFIGURACAO-DEPLOYMENT.md#testes)

---

## ❓ FAQ

### Como obter credenciais do WhatsApp Business?

1. Crie conta no Meta Business Suite
2. Configure WhatsApp Business Platform
3. Obtenha Phone Number ID e Access Token
4. 📖 [Ver passo a passo completo](./04-CONFIGURACAO-DEPLOYMENT.md#whatsapp-business-api-setup)

### Como criar um novo template?

1. Acesse WhatsApp Manager > Modelos de Mensagem
2. Clique em "Criar Modelo"
3. Defina nome, categoria e conteúdo
4. Aguarde aprovação (24-48h)
5. Adicione no banco de dados
6. 📖 [Ver exemplos e boas práticas](./03-API-INTEGRACAO.md#templates)

### Por que minha mensagem falhou?

Principais causas:
- Número de telefone inválido ou sem WhatsApp
- Template não aprovado
- Limite diário atingido
- Credenciais incorretas
- 📖 [Ver troubleshooting completo](./04-CONFIGURACAO-DEPLOYMENT.md#troubleshooting)

### Como testar sem enviar mensagens reais?

1. Use ambiente local do Supabase
2. Mock da WhatsApp API em desenvolvimento
3. Use número de teste fornecido pelo Meta
4. 📖 [Ver guia de testes](./04-CONFIGURACAO-DEPLOYMENT.md#testes)

### Posso personalizar os templates?

Sim! Você pode:
- Criar templates customizados
- Usar variáveis dinâmicas
- Adicionar emojis e formatação
- ⚠️ Atenção: Templates precisam ser aprovados pelo WhatsApp
- 📖 [Ver criação de templates](./03-API-INTEGRACAO.md#criação-de-templates-no-whatsapp)

---

## 🛠️ Troubleshooting Rápido

| Problema | Solução Rápida |
|----------|----------------|
| Webhook não funciona | Verifique se JWT está desabilitado para `whatsapp-webhook` |
| Mensagem não envia | Verifique logs: `supabase functions logs send-whatsapp-message` |
| Template não encontrado | Confirme aprovação no Meta e nome no banco |
| Telefone inválido | Use formato E.164: `+5511999999999` |
| Limite diário atingido | Aguarde reset automático à meia-noite |

📖 **Troubleshooting completo:** [04-CONFIGURACAO-DEPLOYMENT.md#troubleshooting](./04-CONFIGURACAO-DEPLOYMENT.md#troubleshooting)

---

## 📞 Suporte

### Recursos

- **Documentação WhatsApp**: https://developers.facebook.com/docs/whatsapp
- **Supabase Docs**: https://supabase.com/docs
- **Meta Business Help**: https://business.facebook.com/help

### Contribuindo

Para contribuir com melhorias nesta funcionalidade:

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -am 'Add: nova feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## 📝 Changelog

### Versão 1.0.0 (Planejado)

**Features:**
- ✅ Envio de mensagens via WhatsApp Business API
- ✅ Templates de confirmação, lembrete e cancelamento
- ✅ Dashboard de mensagens
- ✅ Histórico e rastreamento
- ✅ Webhooks para status de entrega
- ✅ Configurações administrativas

**Próximas Features (Backlog):**
- 🔜 Lembretes automáticos (cron job)
- 🔜 Envio em massa
- 🔜 Respostas automáticas
- 🔜 Chatbot básico
- 🔜 Integração com calendário
- 🔜 Analytics avançado

---

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo LICENSE para mais detalhes.

---

## 👥 Autores

- **Equipe ProfFlow Manager** - Desenvolvimento e Documentação

---

## 🙏 Agradecimentos

- Meta / WhatsApp Business Team
- Supabase Team
- Comunidade Open Source

---

**Última atualização:** 2024-01-XX

**Versão da Documentação:** 1.0.0
