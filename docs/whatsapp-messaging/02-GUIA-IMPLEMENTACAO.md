# Guia de Implementação Técnica - WhatsApp Messaging

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Fase 1: Configuração do Banco de Dados](#fase-1-configuração-do-banco-de-dados)
3. [Fase 2: Integração com WhatsApp Business API](#fase-2-integração-com-whatsapp-business-api)
4. [Fase 3: Supabase Edge Functions](#fase-3-supabase-edge-functions)
5. [Fase 4: Frontend - Componentes Base](#fase-4-frontend---componentes-base)
6. [Fase 5: Frontend - Features Principais](#fase-5-frontend---features-principais)
7. [Fase 6: Automações](#fase-6-automações)
8. [Fase 7: Testes](#fase-7-testes)
9. [Fase 8: Deploy](#fase-8-deploy)

---

## Pré-requisitos

### Contas e Acessos Necessários

- [ ] Conta no Meta Business Suite
- [ ] WhatsApp Business API configurada
- [ ] Projeto Supabase ativo
- [ ] Node.js 18+ instalado
- [ ] Acesso admin ao projeto no GitHub

### Ferramentas de Desenvolvimento

```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar instalação
supabase --version

# Login no Supabase
supabase login
```

### Variáveis de Ambiente

Criar arquivo `.env.local` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# WhatsApp (para Edge Functions)
WHATSAPP_API_KEY=sua-api-key
WHATSAPP_PHONE_NUMBER_ID=seu-phone-id
WHATSAPP_BUSINESS_ACCOUNT_ID=seu-business-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=token-secreto-webhook
```

---

## Fase 1: Configuração do Banco de Dados

### 1.1 Criar Migration

```bash
# Criar nova migration
supabase migration new whatsapp_messaging_setup
```

### 1.2 Schema SQL

Editar arquivo criado em `supabase/migrations/XXXXXX_whatsapp_messaging_setup.sql`:

```sql
-- ============================================
-- WHATSAPP MESSAGING FEATURE
-- ============================================

-- Criar ENUMs
CREATE TYPE message_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'read',
  'failed',
  'cancelled'
);

CREATE TYPE message_type AS ENUM (
  'schedule_confirmation',
  'schedule_reminder',
  'schedule_cancellation',
  'schedule_change',
  'custom',
  'bulk'
);

CREATE TYPE template_category AS ENUM (
  'schedule',
  'notification',
  'marketing',
  'custom'
);

-- ============================================
-- TABELA: whatsapp_messages
-- ============================================
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Relacionamentos
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES auth.users(id) NOT NULL,

  -- Destinatário
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),

  -- Conteúdo
  message_type message_type NOT NULL,
  template_name VARCHAR(100),
  message_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,

  -- Status e Metadata
  status message_status NOT NULL DEFAULT 'pending',
  whatsapp_message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_phone_format CHECK (recipient_phone ~ '^\+?[1-9]\d{1,14}$')
);

-- Índices para performance
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_teacher ON whatsapp_messages(teacher_id);
CREATE INDEX idx_whatsapp_messages_schedule ON whatsapp_messages(schedule_id);
CREATE INDEX idx_whatsapp_messages_type ON whatsapp_messages(message_type);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_sent_by ON whatsapp_messages(sent_by);

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: whatsapp_templates
-- ============================================
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
  variables JSONB DEFAULT '[]'::jsonb,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_template_id VARCHAR(255),

  -- Metadata
  language VARCHAR(10) NOT NULL DEFAULT 'pt_BR',
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER NOT NULL DEFAULT 0
);

-- Índices
CREATE INDEX idx_whatsapp_templates_active ON whatsapp_templates(is_active);
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_templates(category);
CREATE INDEX idx_whatsapp_templates_name ON whatsapp_templates(name);

-- Trigger
CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: whatsapp_config
-- ============================================
CREATE TABLE whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Credenciais (serão criptografadas na aplicação)
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
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Garantir apenas uma configuração
CREATE UNIQUE INDEX idx_whatsapp_config_singleton ON whatsapp_config((1));

-- Trigger
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: whatsapp_delivery_logs
-- ============================================
CREATE TABLE whatsapp_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  message_id UUID REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,

  CONSTRAINT valid_event_type CHECK (
    event_type IN ('sent', 'delivered', 'read', 'failed', 'webhook_received')
  )
);

-- Índices
CREATE INDEX idx_delivery_logs_message ON whatsapp_delivery_logs(message_id);
CREATE INDEX idx_delivery_logs_created ON whatsapp_delivery_logs(created_at DESC);
CREATE INDEX idx_delivery_logs_event_type ON whatsapp_delivery_logs(event_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_messages
CREATE POLICY "Admins veem todas as mensagens"
  ON whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Professores veem suas mensagens"
  ON whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = whatsapp_messages.teacher_id
      AND teachers.id IN (
        SELECT id FROM teachers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins inserem mensagens"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para whatsapp_templates
CREATE POLICY "Todos veem templates ativos"
  ON whatsapp_templates FOR SELECT
  USING (is_active = true OR is_approved = true);

CREATE POLICY "Admins gerenciam templates"
  ON whatsapp_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para whatsapp_config
CREATE POLICY "Admins acessam configurações"
  ON whatsapp_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para whatsapp_delivery_logs
CREATE POLICY "Admins veem logs"
  ON whatsapp_delivery_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para resetar contador diário
CREATE OR REPLACE FUNCTION reset_daily_message_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE whatsapp_config
  SET messages_sent_today = 0,
      last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;

-- Função para incrementar contador de uso de template
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE whatsapp_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$;

-- Função para atualizar status de mensagem
CREATE OR REPLACE FUNCTION update_message_status(
  p_message_id UUID,
  p_status message_status,
  p_whatsapp_message_id VARCHAR DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE whatsapp_messages
  SET
    status = p_status,
    whatsapp_message_id = COALESCE(p_whatsapp_message_id, whatsapp_message_id),
    sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
    delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
    read_at = CASE WHEN p_status = 'read' THEN NOW() ELSE read_at END,
    updated_at = NOW()
  WHERE id = p_message_id;
END;
$$;

-- ============================================
-- SEED DATA: Templates Iniciais
-- ============================================

INSERT INTO whatsapp_templates (name, display_name, description, category, content, variables, is_active, is_approved, language) VALUES
(
  'schedule_confirmation',
  'Confirmação de Agendamento',
  'Enviado automaticamente quando um horário é agendado',
  'schedule',
  'Olá {{student_name}}! ✅

Sua aula foi agendada com sucesso!

📚 Professor(a): {{teacher_name}}
📅 Data: {{date}}
🕐 Horário: {{time}}

Nos vemos em breve!',
  '[
    {"name": "student_name", "type": "string", "description": "Nome do aluno", "example": "João Silva"},
    {"name": "teacher_name", "type": "string", "description": "Nome do professor", "example": "Prof. Maria"},
    {"name": "date", "type": "string", "description": "Data da aula", "example": "15/03/2024"},
    {"name": "time", "type": "string", "description": "Horário da aula", "example": "14:00"}
  ]'::jsonb,
  true,
  true,
  'pt_BR'
),
(
  'schedule_reminder',
  'Lembrete de Aula',
  'Lembrete enviado 24h antes da aula',
  'schedule',
  'Olá {{student_name}}! 🔔

Este é um lembrete da sua aula amanhã:

📚 Professor(a): {{teacher_name}}
📅 Data: {{date}}
🕐 Horário: {{time}}

Até amanhã!',
  '[
    {"name": "student_name", "type": "string", "description": "Nome do aluno", "example": "João Silva"},
    {"name": "teacher_name", "type": "string", "description": "Nome do professor", "example": "Prof. Maria"},
    {"name": "date", "type": "string", "description": "Data da aula", "example": "15/03/2024"},
    {"name": "time", "type": "string", "description": "Horário da aula", "example": "14:00"}
  ]'::jsonb,
  true,
  true,
  'pt_BR'
),
(
  'schedule_cancellation',
  'Cancelamento de Aula',
  'Enviado quando uma aula é cancelada',
  'schedule',
  'Olá {{student_name}}! ⚠️

Informamos que a aula foi cancelada:

📚 Professor(a): {{teacher_name}}
📅 Data: {{date}}
🕐 Horário: {{time}}

{{cancellation_reason}}

Entre em contato para reagendar.',
  '[
    {"name": "student_name", "type": "string", "description": "Nome do aluno", "example": "João Silva"},
    {"name": "teacher_name", "type": "string", "description": "Nome do professor", "example": "Prof. Maria"},
    {"name": "date", "type": "string", "description": "Data da aula", "example": "15/03/2024"},
    {"name": "time", "type": "string", "description": "Horário da aula", "example": "14:00"},
    {"name": "cancellation_reason", "type": "string", "description": "Motivo do cancelamento", "example": "Motivo: Indisponibilidade do professor"}
  ]'::jsonb,
  true,
  true,
  'pt_BR'
);

-- Inserir configuração padrão
INSERT INTO whatsapp_config (is_enabled, auto_send_confirmations, auto_send_reminders)
VALUES (false, true, true);

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE whatsapp_messages IS 'Armazena todas as mensagens enviadas via WhatsApp';
COMMENT ON TABLE whatsapp_templates IS 'Templates de mensagens pré-aprovados para uso no WhatsApp';
COMMENT ON TABLE whatsapp_config IS 'Configurações gerais da integração com WhatsApp';
COMMENT ON TABLE whatsapp_delivery_logs IS 'Logs detalhados de entregas e eventos de webhooks';

COMMENT ON COLUMN whatsapp_messages.variables IS 'JSON com as variáveis usadas no template da mensagem';
COMMENT ON COLUMN whatsapp_templates.variables IS 'Array JSON definindo as variáveis disponíveis no template';
```

### 1.3 Aplicar Migration

```bash
# Aplicar migration localmente (para testes)
supabase db reset

# Aplicar no projeto remoto
supabase db push
```

### 1.4 Gerar Types TypeScript

```bash
# Gerar tipos atualizados
supabase gen types typescript --project-id seu-project-id > src/integrations/supabase/types.ts
```

---

## Fase 2: Integração com WhatsApp Business API

### 2.1 Criar Conta WhatsApp Business

1. Acesse [Meta Business Suite](https://business.facebook.com/)
2. Crie uma nova conta de negócios
3. Adicione um número de telefone para WhatsApp Business
4. Obtenha as credenciais:
   - Phone Number ID
   - Business Account ID
   - Access Token (API Key)

### 2.2 Criar Templates no Meta

No Meta Business Manager:

1. Vá para **WhatsApp Manager** > **Message Templates**
2. Crie templates para cada tipo de mensagem
3. Aguarde aprovação (geralmente 24-48h)
4. Anote os IDs dos templates aprovados

### 2.3 Configurar Webhook

1. No Meta Business Manager, vá para **WhatsApp** > **Configuration**
2. Configure o Webhook URL: `https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook`
3. Defina o Verify Token (mesmo do `.env`)
4. Inscreva-se nos eventos:
   - `messages`
   - `message_status`

---

## Fase 3: Supabase Edge Functions

### 3.1 Estrutura de Pastas

```bash
mkdir -p supabase/functions/send-whatsapp-message
mkdir -p supabase/functions/whatsapp-webhook
mkdir -p supabase/functions/schedule-whatsapp-reminders
mkdir -p supabase/functions/_shared
```

### 3.2 Shared Utilities

Criar `supabase/functions/_shared/whatsapp-client.ts`:

```typescript
export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template' | 'text';
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
  text?: {
    body: string;
  };
}

export class WhatsAppClient {
  private apiKey: string;
  private phoneNumberId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(apiKey: string, phoneNumberId: string) {
    this.apiKey = apiKey;
    this.phoneNumberId = phoneNumberId;
  }

  async sendMessage(message: WhatsAppMessage): Promise<any> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    variables: Record<string, string> = {},
    language: string = 'pt_BR'
  ): Promise<any> {
    const parameters = Object.values(variables).map(value => ({
      type: 'text',
      text: value,
    }));

    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''), // Remove caracteres não numéricos
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: language,
        },
        ...(parameters.length > 0 && {
          components: [{
            type: 'body',
            parameters,
          }],
        }),
      },
    };

    return this.sendMessage(message);
  }

  async sendTextMessage(to: string, text: string): Promise<any> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: {
        body: text,
      },
    };

    return this.sendMessage(message);
  }
}

// Função auxiliar para validar número de telefone
export function validatePhoneNumber(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Validação básica: 10-15 dígitos
  return /^[1-9]\d{9,14}$/.test(cleaned);
}

// Função para formatar número no padrão internacional
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  // Se não começar com código de país, adiciona Brasil (55)
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }

  return cleaned;
}
```

### 3.3 Edge Function: send-whatsapp-message

Criar `supabase/functions/send-whatsapp-message/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { WhatsAppClient, formatPhoneNumber, validatePhoneNumber } from '../_shared/whatsapp-client.ts';

interface SendMessageRequest {
  recipientPhone: string;
  recipientName?: string;
  templateName?: string;
  messageContent: string;
  variables?: Record<string, any>;
  messageType: 'schedule_confirmation' | 'schedule_reminder' | 'schedule_cancellation' | 'schedule_change' | 'custom' | 'bulk';
  scheduleId?: string;
  teacherId?: string;
}

serve(async (req) => {
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse body
    const body: SendMessageRequest = await req.json();
    const {
      recipientPhone,
      recipientName,
      templateName,
      messageContent,
      variables = {},
      messageType,
      scheduleId,
      teacherId,
    } = body;

    // Validações
    if (!recipientPhone || !messageContent || !messageType) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: recipientPhone, messageContent, messageType'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar e formatar telefone
    if (!validatePhoneNumber(recipientPhone)) {
      return new Response(JSON.stringify({
        error: 'Invalid phone number format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formattedPhone = formatPhoneNumber(recipientPhone);

    // Inicializar Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar configurações e limites
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .single();

    if (!config || !config.is_enabled) {
      return new Response(JSON.stringify({
        error: 'WhatsApp integration is not enabled'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Resetar contador se necessário
    await supabase.rpc('reset_daily_message_count');

    // Verificar limite diário
    if (config.messages_sent_today >= config.daily_message_limit) {
      return new Response(JSON.stringify({
        error: 'Daily message limit reached'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Criar registro de mensagem no banco
    const { data: messageRecord, error: insertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        recipient_phone: formattedPhone,
        recipient_name: recipientName,
        message_type: messageType,
        template_name: templateName,
        message_content: messageContent,
        variables: variables,
        status: 'pending',
        sent_by: user.id,
        teacher_id: teacherId,
        schedule_id: scheduleId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create message record' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Inicializar WhatsApp Client
    const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY')!;
    const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!;
    const whatsappClient = new WhatsAppClient(whatsappApiKey, whatsappPhoneId);

    let whatsappResponse;

    try {
      // Enviar via WhatsApp
      if (templateName) {
        whatsappResponse = await whatsappClient.sendTemplateMessage(
          formattedPhone,
          templateName,
          variables
        );
      } else {
        whatsappResponse = await whatsappClient.sendTextMessage(
          formattedPhone,
          messageContent
        );
      }

      // Atualizar status para 'sent'
      await supabase.rpc('update_message_status', {
        p_message_id: messageRecord.id,
        p_status: 'sent',
        p_whatsapp_message_id: whatsappResponse.messages[0].id,
      });

      // Incrementar contador
      await supabase
        .from('whatsapp_config')
        .update({ messages_sent_today: config.messages_sent_today + 1 })
        .eq('id', config.id);

      // Incrementar uso do template se aplicável
      if (templateName) {
        const { data: template } = await supabase
          .from('whatsapp_templates')
          .select('id')
          .eq('name', templateName)
          .single();

        if (template) {
          await supabase.rpc('increment_template_usage', { template_id: template.id });
        }
      }

      // Log de entrega
      await supabase
        .from('whatsapp_delivery_logs')
        .insert({
          message_id: messageRecord.id,
          event_type: 'sent',
          event_data: whatsappResponse,
        });

      return new Response(JSON.stringify({
        success: true,
        messageId: messageRecord.id,
        whatsappMessageId: whatsappResponse.messages[0].id,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (whatsappError) {
      console.error('WhatsApp API Error:', whatsappError);

      // Atualizar status para 'failed'
      await supabase
        .from('whatsapp_messages')
        .update({
          status: 'failed',
          error_message: whatsappError.message,
        })
        .eq('id', messageRecord.id);

      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send WhatsApp message',
        details: whatsappError.message,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('General Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### 3.4 Edge Function: whatsapp-webhook

Criar `supabase/functions/whatsapp-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const url = new URL(req.url);

  // Verificação do webhook (GET request)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified');
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Processar webhook (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json();

      console.log('Webhook received:', JSON.stringify(body, null, 2));

      // Inicializar Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Processar cada entrada
      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              if (change.value && change.value.statuses) {
                for (const status of change.value.statuses) {
                  await processStatusUpdate(supabase, status);
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response(JSON.stringify({ error: 'Processing failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});

async function processStatusUpdate(supabase: any, status: any) {
  const whatsappMessageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed
  const timestamp = status.timestamp;

  console.log(`Processing status update: ${whatsappMessageId} -> ${statusType}`);

  // Buscar mensagem no banco
  const { data: message } = await supabase
    .from('whatsapp_messages')
    .select('id')
    .eq('whatsapp_message_id', whatsappMessageId)
    .single();

  if (!message) {
    console.log(`Message not found: ${whatsappMessageId}`);
    return;
  }

  // Mapear status do WhatsApp para nosso enum
  const statusMap: Record<string, string> = {
    'sent': 'sent',
    'delivered': 'delivered',
    'read': 'read',
    'failed': 'failed',
  };

  const mappedStatus = statusMap[statusType];

  if (mappedStatus) {
    // Atualizar status da mensagem
    await supabase.rpc('update_message_status', {
      p_message_id: message.id,
      p_status: mappedStatus,
    });

    // Salvar log
    await supabase
      .from('whatsapp_delivery_logs')
      .insert({
        message_id: message.id,
        event_type: statusType,
        event_data: status,
      });

    console.log(`Status updated: ${message.id} -> ${mappedStatus}`);
  }
}
```

### 3.5 Deploy Edge Functions

```bash
# Deploy individual
supabase functions deploy send-whatsapp-message
supabase functions deploy whatsapp-webhook

# Configurar secrets
supabase secrets set WHATSAPP_API_KEY=sua-api-key
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=seu-phone-id
supabase secrets set WHATSAPP_BUSINESS_ACCOUNT_ID=seu-business-id
supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu-token-secreto
```

---

## Fase 4: Frontend - Componentes Base

### 4.1 Instalar Dependências

```bash
npm install react-query @tanstack/react-query
npm install date-fns # Para formatação de datas
npm install react-phone-input-2 # Para input de telefone
```

### 4.2 Criar Hooks Custom

Criar `src/hooks/useWhatsApp.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SendMessageParams {
  recipientPhone: string;
  recipientName?: string;
  templateName?: string;
  messageContent: string;
  variables?: Record<string, any>;
  messageType: 'schedule_confirmation' | 'schedule_reminder' | 'schedule_cancellation' | 'schedule_change' | 'custom' | 'bulk';
  scheduleId?: string;
  teacherId?: string;
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendMessageParams) => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('send-whatsapp-message', {
        body: params,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalida queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
    },
  });
}

export function useWhatsAppMessages(filters?: {
  status?: string;
  messageType?: string;
  teacherId?: string;
}) {
  return useQuery({
    queryKey: ['whatsapp-messages', filters],
    queryFn: async () => {
      let query = supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.messageType) {
        query = query.eq('message_type', filters.messageType);
      }
      if (filters?.teacherId) {
        query = query.eq('teacher_id', filters.teacherId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

export function useWhatsAppTemplates() {
  return useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data;
    },
  });
}

export function useWhatsAppConfig() {
  return useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
  });
}
```

---

*Continuação na próxima seção...*

## Próximos Passos

Este guia continua com:
- Fase 5: Implementação dos componentes de UI
- Fase 6: Automações e triggers
- Fase 7: Testes unitários e de integração
- Fase 8: Deploy e monitoramento

Consulte os documentos complementares para cada fase.
