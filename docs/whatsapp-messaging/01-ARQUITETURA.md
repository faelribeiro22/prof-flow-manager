# Arquitetura da Funcionalidade de Mensagens WhatsApp

## Visão Geral

Este documento descreve a arquitetura da funcionalidade de mensagens via WhatsApp para o ProfFlow Manager, permitindo a comunicação automatizada e manual entre administradores, professores e alunos.

## Objetivos

1. **Notificações Automáticas**: Enviar mensagens automáticas sobre agendamentos, cancelamentos e lembretes
2. **Comunicação Manual**: Permitir que administradores e professores enviem mensagens personalizadas
3. **Histórico**: Manter registro de todas as mensagens enviadas
4. **Templates**: Utilizar templates pré-aprovados para diferentes tipos de mensagens
5. **Integração**: Integrar-se perfeitamente com o fluxo existente de agendamentos

## Componentes da Solução

### 1. Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Messaging    │  │ Templates    │  │ Message      │      │
│  │ Dashboard    │  │ Manager      │  │ History      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Database     │  │ Edge         │  │ Realtime     │      │
│  │ (PostgreSQL) │  │ Functions    │  │ Subscriptions│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  WhatsApp Business API                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Send         │  │ Templates    │  │ Webhooks     │      │
│  │ Messages     │  │ Management   │  │ (Status)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Modelo de Dados

#### Tabelas do Banco de Dados

##### `whatsapp_messages`
Armazena todas as mensagens enviadas via WhatsApp.

```sql
CREATE TYPE message_status AS ENUM (
  'pending',      -- Aguardando envio
  'sent',         -- Enviada com sucesso
  'delivered',    -- Entregue ao destinatário
  'read',         -- Lida pelo destinatário
  'failed',       -- Falha no envio
  'cancelled'     -- Cancelada
);

CREATE TYPE message_type AS ENUM (
  'schedule_confirmation',  -- Confirmação de agendamento
  'schedule_reminder',      -- Lembrete de aula
  'schedule_cancellation',  -- Cancelamento de aula
  'schedule_change',        -- Alteração de horário
  'custom',                 -- Mensagem personalizada
  'bulk'                    -- Mensagem em massa
);

CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Relacionamentos
  teacher_id UUID REFERENCES teachers(id),
  schedule_id UUID REFERENCES schedules(id),
  sent_by UUID REFERENCES profiles(id) NOT NULL,

  -- Destinatário
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),

  -- Conteúdo
  message_type message_type NOT NULL,
  template_name VARCHAR(100),
  message_content TEXT NOT NULL,
  variables JSONB, -- Variáveis usadas no template

  -- Status e Metadata
  status message_status NOT NULL DEFAULT 'pending',
  whatsapp_message_id VARCHAR(255), -- ID retornado pela API do WhatsApp
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Índices
  CONSTRAINT valid_phone_format CHECK (recipient_phone ~ '^\+?[1-9]\d{1,14}$')
);

CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_teacher ON whatsapp_messages(teacher_id);
CREATE INDEX idx_whatsapp_messages_schedule ON whatsapp_messages(schedule_id);
CREATE INDEX idx_whatsapp_messages_type ON whatsapp_messages(message_type);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
```

##### `whatsapp_templates`
Armazena templates de mensagens pré-aprovados.

```sql
CREATE TYPE template_category AS ENUM (
  'schedule',      -- Relacionado a agendamentos
  'notification',  -- Notificações gerais
  'marketing',     -- Marketing
  'custom'         -- Personalizado
);

CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identificação
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category template_category NOT NULL,

  -- Conteúdo
  content TEXT NOT NULL,
  variables JSONB, -- Lista de variáveis disponíveis: {name, type, description, example}

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_template_id VARCHAR(255), -- ID do template no WhatsApp

  -- Metadata
  language VARCHAR(10) NOT NULL DEFAULT 'pt_BR',
  created_by UUID REFERENCES profiles(id),
  usage_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_whatsapp_templates_active ON whatsapp_templates(is_active);
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_templates(category);
```

##### `whatsapp_config`
Configurações da integração com WhatsApp.

```sql
CREATE TABLE whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Credenciais (armazenadas criptografadas)
  api_key_encrypted TEXT,
  phone_number_id VARCHAR(50),
  business_account_id VARCHAR(50),

  -- Configurações
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_send_confirmations BOOLEAN NOT NULL DEFAULT TRUE,
  auto_send_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_hours_before INTEGER NOT NULL DEFAULT 24,

  -- Limites
  daily_message_limit INTEGER NOT NULL DEFAULT 1000,
  messages_sent_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Webhook
  webhook_verify_token VARCHAR(255),

  CONSTRAINT only_one_config CHECK (id = gen_random_uuid())
);

-- Garantir apenas uma linha de configuração
CREATE UNIQUE INDEX idx_whatsapp_config_singleton ON whatsapp_config((1));
```

##### `whatsapp_delivery_logs`
Logs detalhados de entregas e webhooks.

```sql
CREATE TABLE whatsapp_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  message_id UUID REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- sent, delivered, read, failed
  event_data JSONB, -- Dados completos do webhook

  CONSTRAINT valid_event_type CHECK (event_type IN ('sent', 'delivered', 'read', 'failed'))
);

CREATE INDEX idx_delivery_logs_message ON whatsapp_delivery_logs(message_id);
CREATE INDEX idx_delivery_logs_created ON whatsapp_delivery_logs(created_at DESC);
```

### 3. Fluxos de Dados

#### Fluxo 1: Envio Automático de Confirmação

```
1. Usuário marca horário como "com_aluno" no schedule
   ↓
2. Trigger no banco de dados detecta mudança de status
   ↓
3. Edge Function "send-schedule-confirmation" é invocada
   ↓
4. Function busca template de confirmação
   ↓
5. Substitui variáveis (nome aluno, data, hora, professor)
   ↓
6. Envia para WhatsApp Business API
   ↓
7. Salva registro em whatsapp_messages
   ↓
8. Frontend atualiza em tempo real via Realtime
```

#### Fluxo 2: Envio Manual de Mensagem

```
1. Admin/Professor clica em "Enviar Mensagem"
   ↓
2. Modal abre com lista de templates
   ↓
3. Usuário seleciona template e preenche variáveis
   ↓
4. Preview da mensagem é exibido
   ↓
5. Usuário confirma envio
   ↓
6. Frontend chama Edge Function "send-custom-message"
   ↓
7. Function valida dados e envia para WhatsApp API
   ↓
8. Retorna status para frontend
```

#### Fluxo 3: Processamento de Webhooks (Status)

```
1. WhatsApp envia webhook para /api/whatsapp-webhook
   ↓
2. Edge Function valida token e assinatura
   ↓
3. Processa evento (sent/delivered/read/failed)
   ↓
4. Atualiza registro em whatsapp_messages
   ↓
5. Salva log em whatsapp_delivery_logs
   ↓
6. Frontend recebe atualização via Realtime
```

### 4. Componentes de Frontend

#### Estrutura de Componentes

```
src/components/WhatsApp/
├── Messaging/
│   ├── MessagingDashboard.tsx        # Dashboard principal de mensagens
│   ├── MessagesList.tsx              # Lista de mensagens enviadas
│   ├── MessageCard.tsx               # Card individual de mensagem
│   ├── MessageFilters.tsx            # Filtros (status, tipo, data)
│   └── MessageStats.tsx              # Estatísticas de envio
├── Templates/
│   ├── TemplatesManager.tsx          # Gerenciador de templates
│   ├── TemplatesList.tsx             # Lista de templates
│   ├── TemplateEditor.tsx            # Editor de templates
│   ├── TemplatePreview.tsx           # Preview com variáveis
│   └── TemplateVariables.tsx         # Gerenciador de variáveis
├── Compose/
│   ├── ComposeMessage.tsx            # Formulário de nova mensagem
│   ├── RecipientSelector.tsx         # Seletor de destinatários
│   ├── TemplateSelector.tsx          # Seletor de template
│   └── MessagePreview.tsx            # Preview antes de enviar
├── Settings/
│   ├── WhatsAppSettings.tsx          # Configurações gerais
│   ├── APICredentials.tsx            # Gerenciamento de credenciais
│   └── AutomationSettings.tsx        # Configurações de automação
└── Shared/
    ├── StatusBadge.tsx               # Badge de status da mensagem
    ├── PhoneInput.tsx                # Input formatado para telefone
    └── MessageMetrics.tsx            # Métricas de entrega
```

### 5. Edge Functions (Supabase)

#### `send-message`
Responsável por enviar mensagens via WhatsApp Business API.

**Input:**
```typescript
{
  recipientPhone: string;
  templateName?: string;
  messageContent: string;
  variables?: Record<string, any>;
  messageType: 'schedule_confirmation' | 'custom' | etc.;
  scheduleId?: string;
  teacherId?: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  messageId: string;
  whatsappMessageId?: string;
  error?: string;
}
```

#### `whatsapp-webhook`
Processa webhooks do WhatsApp para status de mensagens.

**Input:** Webhook padrão do WhatsApp Business API

**Eventos processados:**
- `message.sent`
- `message.delivered`
- `message.read`
- `message.failed`

#### `schedule-reminders`
Função agendada (cron) para enviar lembretes automáticos.

**Execução:** Diariamente às 9h
**Lógica:**
1. Busca aulas nas próximas 24h
2. Verifica se já enviou lembrete
3. Envia mensagem para alunos agendados

### 6. Integrações

#### WhatsApp Business API

**Provider Recomendado:** Meta (oficial) ou Twilio

**Endpoints utilizados:**
- `POST /messages` - Enviar mensagem
- `GET /message_templates` - Listar templates
- Webhooks - Receber status

**Autenticação:**
- Bearer token (API Key)
- Verificação de webhook via token

### 7. Segurança

#### Proteção de Dados
- Credenciais da API armazenadas criptografadas
- RLS (Row Level Security) em todas as tabelas
- Validação de números de telefone
- Rate limiting em Edge Functions

#### Políticas RLS

```sql
-- whatsapp_messages: professores veem apenas suas mensagens
CREATE POLICY "Professores veem suas mensagens"
ON whatsapp_messages FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
  OR teacher_id IN (
    SELECT id FROM teachers WHERE id = teacher_id
  )
);

-- whatsapp_templates: todos podem visualizar ativos
CREATE POLICY "Templates ativos são públicos"
ON whatsapp_templates FOR SELECT
USING (is_active = true);

-- whatsapp_config: apenas admins
CREATE POLICY "Apenas admins acessam config"
ON whatsapp_config FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
);
```

### 8. Escalabilidade

#### Estratégias
1. **Fila de Mensagens**: Implementar fila para envios em massa
2. **Rate Limiting**: Respeitar limites da API do WhatsApp
3. **Retry Logic**: Retentar envios falhos com backoff exponencial
4. **Caching**: Cache de templates frequentemente usados
5. **Monitoramento**: Logs e métricas de performance

#### Limites Considerados
- WhatsApp Business API: ~1000 mensagens/segundo (varia por plano)
- Supabase Edge Functions: 500k invocações/mês (plano free)
- Database connections: Pool de conexões otimizado

### 9. Monitoramento e Observabilidade

#### Métricas Principais
1. Taxa de entrega (delivery rate)
2. Taxa de leitura (read rate)
3. Tempo médio de entrega
4. Taxa de falhas
5. Uso de templates
6. Mensagens por dia/hora

#### Dashboards
- Dashboard de métricas no frontend
- Logs de erro no Supabase
- Alertas para falhas consecutivas

### 10. Custos Estimados

#### WhatsApp Business API
- Mensagens de serviço (templates): ~$0.005-0.02 por mensagem
- Mensagens de conversa: Primeiras 1000/mês grátis

#### Supabase
- Edge Functions: 500k invocações/mês grátis
- Database: Incluído no plano Pro ($25/mês)
- Bandwidth: ~5GB grátis

**Estimativa para 1000 mensagens/mês:**
- WhatsApp: ~$10-20/mês
- Supabase: Incluso no plano atual
- **Total: ~$10-20/mês**

---

## Próximos Passos

1. Revisar e aprovar arquitetura
2. Configurar conta WhatsApp Business
3. Implementar schema do banco de dados
4. Desenvolver Edge Functions
5. Criar componentes de frontend
6. Testes e validação
7. Deploy gradual (beta → produção)

## Referências

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
