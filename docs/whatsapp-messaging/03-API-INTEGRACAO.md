# Documentação de API e Integração WhatsApp

## Índice

1. [WhatsApp Business API](#whatsapp-business-api)
2. [Endpoints Internos (Edge Functions)](#endpoints-internos-edge-functions)
3. [Formato de Mensagens](#formato-de-mensagens)
4. [Templates](#templates)
5. [Webhooks](#webhooks)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Rate Limiting](#rate-limiting)
8. [Exemplos de Uso](#exemplos-de-uso)

---

## WhatsApp Business API

### Informações Gerais

- **Versão da API**: v18.0 (ou superior)
- **Base URL**: `https://graph.facebook.com/v18.0`
- **Autenticação**: Bearer Token
- **Formato**: JSON

### Endpoints Utilizados

#### 1. Enviar Mensagem

```http
POST https://graph.facebook.com/v18.0/{phone-number-id}/messages
Authorization: Bearer {access-token}
Content-Type: application/json
```

**Body (Template):**
```json
{
  "messaging_product": "whatsapp",
  "to": "5511999999999",
  "type": "template",
  "template": {
    "name": "schedule_confirmation",
    "language": {
      "code": "pt_BR"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "João Silva"
          },
          {
            "type": "text",
            "text": "Prof. Maria"
          },
          {
            "type": "text",
            "text": "15/03/2024"
          },
          {
            "type": "text",
            "text": "14:00"
          }
        ]
      }
    ]
  }
}
```

**Body (Texto Simples):**
```json
{
  "messaging_product": "whatsapp",
  "to": "5511999999999",
  "type": "text",
  "text": {
    "body": "Olá! Esta é uma mensagem de teste."
  }
}
```

**Resposta de Sucesso (200):**
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "5511999999999",
      "wa_id": "5511999999999"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgNNTUxMTk5OTk5OTk5ORUCABIYIDNBMjBGRjVBMTE1RjQxNTQ4RTU0"
    }
  ]
}
```

**Erros Comuns:**

```json
// Número inválido
{
  "error": {
    "message": "Invalid parameter",
    "type": "OAuthException",
    "code": 100,
    "error_data": {
      "messaging_product": "whatsapp",
      "details": "Phone number not registered"
    }
  }
}

// Template não aprovado
{
  "error": {
    "message": "Template not found",
    "type": "OAuthException",
    "code": 132000
  }
}

// Rate limit excedido
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "OAuthException",
    "code": 4
  }
}
```

#### 2. Listar Templates

```http
GET https://graph.facebook.com/v18.0/{business-account-id}/message_templates
Authorization: Bearer {access-token}
```

**Resposta:**
```json
{
  "data": [
    {
      "name": "schedule_confirmation",
      "components": [...],
      "language": "pt_BR",
      "status": "APPROVED",
      "category": "UTILITY",
      "id": "1234567890"
    }
  ],
  "paging": {
    "cursors": {
      "before": "...",
      "after": "..."
    }
  }
}
```

---

## Endpoints Internos (Edge Functions)

### 1. Send WhatsApp Message

**Endpoint:**
```
POST /functions/v1/send-whatsapp-message
```

**Headers:**
```
Authorization: Bearer {supabase-auth-token}
Content-Type: application/json
```

**Request Body:**
```typescript
{
  recipientPhone: string;        // Obrigatório: +5511999999999
  recipientName?: string;        // Opcional: "João Silva"
  templateName?: string;         // Opcional: "schedule_confirmation"
  messageContent: string;        // Obrigatório: Conteúdo da mensagem
  variables?: {                  // Opcional: Variáveis do template
    student_name: string;
    teacher_name: string;
    date: string;
    time: string;
  };
  messageType:                   // Obrigatório
    | 'schedule_confirmation'
    | 'schedule_reminder'
    | 'schedule_cancellation'
    | 'schedule_change'
    | 'custom'
    | 'bulk';
  scheduleId?: string;          // Opcional: UUID do schedule
  teacherId?: string;           // Opcional: UUID do teacher
}
```

**Response Success (200):**
```json
{
  "success": true,
  "messageId": "550e8400-e29b-41d4-a716-446655440000",
  "whatsappMessageId": "wamid.HBgNNTUxMTk5OTk5OTk5ORUCABIYIDNBMjBGRjVBMTE1RjQxNTQ4RTU0"
}
```

**Response Error (400/500):**
```json
{
  "success": false,
  "error": "Invalid phone number format",
  "details": "Phone number must follow E.164 format"
}
```

**Códigos de Status:**

| Código | Significado |
|--------|-------------|
| 200 | Mensagem enviada com sucesso |
| 400 | Dados inválidos (telefone, campos obrigatórios) |
| 401 | Não autenticado |
| 403 | Integração WhatsApp desabilitada |
| 429 | Limite diário de mensagens atingido |
| 500 | Erro ao enviar mensagem via WhatsApp API |

**Exemplo de Uso:**

```typescript
import { supabase } from '@/integrations/supabase/client';

async function sendScheduleConfirmation(
  studentPhone: string,
  studentName: string,
  teacherName: string,
  date: string,
  time: string,
  scheduleId: string
) {
  const { data, error } = await supabase.functions.invoke(
    'send-whatsapp-message',
    {
      body: {
        recipientPhone: studentPhone,
        recipientName: studentName,
        templateName: 'schedule_confirmation',
        messageContent: `Olá ${studentName}! Sua aula foi agendada...`,
        variables: {
          student_name: studentName,
          teacher_name: teacherName,
          date: date,
          time: time,
        },
        messageType: 'schedule_confirmation',
        scheduleId: scheduleId,
      },
    }
  );

  if (error) {
    console.error('Erro ao enviar mensagem:', error);
    return null;
  }

  return data;
}
```

### 2. WhatsApp Webhook

**Endpoint (Verificação):**
```
GET /functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token={token}&hub.challenge={challenge}
```

**Response:** Retorna o `hub.challenge` se o token for válido.

**Endpoint (Eventos):**
```
POST /functions/v1/whatsapp-webhook
```

**Request Body (Status Update):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNTUxMTk5OTk5OTk5ORUCABIYIDNBMjBGRjVBMTE1RjQxNTQ4RTU0",
                "status": "delivered",
                "timestamp": "1234567890",
                "recipient_id": "5511999999999"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Status Possíveis:**
- `sent` - Mensagem enviada ao servidor do WhatsApp
- `delivered` - Mensagem entregue ao dispositivo do destinatário
- `read` - Mensagem lida pelo destinatário
- `failed` - Falha no envio

---

## Formato de Mensagens

### Estrutura de Template

#### Definição no Banco de Dados

```sql
INSERT INTO whatsapp_templates (
  name,
  display_name,
  description,
  category,
  content,
  variables
) VALUES (
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
  ]'::jsonb
);
```

#### Substituição de Variáveis

O sistema substitui automaticamente as variáveis no formato `{{variable_name}}`:

```typescript
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

// Exemplo de uso
const template = "Olá {{student_name}}! Sua aula com {{teacher_name}} está confirmada.";
const variables = {
  student_name: "João Silva",
  teacher_name: "Prof. Maria"
};

const message = replaceVariables(template, variables);
// Resultado: "Olá João Silva! Sua aula com Prof. Maria está confirmada."
```

### Validação de Telefone

```typescript
// Formato aceito: E.164 (com ou sem +)
// Exemplos válidos:
// +5511999999999
// 5511999999999
// 11999999999 (será convertido para +5511999999999)

function validatePhoneNumber(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Validação: 10-15 dígitos, começa com número diferente de 0
  return /^[1-9]\d{9,14}$/.test(cleaned);
}

function formatPhoneNumber(phone: string, defaultCountryCode: string = '55'): string {
  let cleaned = phone.replace(/\D/g, '');

  // Se não começar com código de país e tiver 10-11 dígitos, adiciona código do Brasil
  if (!cleaned.startsWith(defaultCountryCode) && cleaned.length <= 11) {
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
}

// Exemplos
formatPhoneNumber('(11) 99999-9999');  // "5511999999999"
formatPhoneNumber('11999999999');      // "5511999999999"
formatPhoneNumber('+5511999999999');   // "5511999999999"
```

---

## Templates

### Tipos de Templates

#### 1. Schedule Templates

Templates relacionados a agendamentos:

- `schedule_confirmation` - Confirmação de agendamento
- `schedule_reminder` - Lembrete de aula
- `schedule_cancellation` - Cancelamento de aula
- `schedule_change` - Alteração de horário

#### 2. Notification Templates

Notificações gerais:

- `welcome_message` - Mensagem de boas-vindas
- `payment_reminder` - Lembrete de pagamento
- `general_announcement` - Comunicado geral

#### 3. Custom Templates

Templates personalizados criados por administradores.

### Criação de Templates no WhatsApp

#### Passo a Passo:

1. Acesse **Meta Business Manager** > **WhatsApp Manager**
2. Vá para **Message Templates**
3. Clique em **Create Template**
4. Preencha:
   - **Name**: Nome único (ex: `schedule_confirmation`)
   - **Category**: UTILITY (para mensagens de serviço)
   - **Language**: Portuguese (Brazil)
   - **Header** (opcional): Texto, imagem ou vídeo
   - **Body**: Conteúdo principal com variáveis `{{1}}`, `{{2}}`, etc.
   - **Footer** (opcional): Texto fixo no rodapé
   - **Buttons** (opcional): Botões de ação

5. Aguarde aprovação (24-48h)

#### Boas Práticas:

- Use categorias corretas (UTILITY para transacionais, MARKETING para promocionais)
- Evite linguagem promocional em templates UTILITY
- Mantenha mensagens concisas e claras
- Use variáveis para personalização
- Teste antes de usar em produção

### Exemplo de Template Aprovado

```
Name: schedule_confirmation
Category: UTILITY
Language: pt_BR

Body:
Olá {{1}}! ✅

Sua aula foi agendada com sucesso!

📚 Professor(a): {{2}}
📅 Data: {{3}}
🕐 Horário: {{4}}

Nos vemos em breve!

Footer:
AgendaPro - Sistema de Agendamentos

Buttons:
[QUICK_REPLY] Confirmar presença
[QUICK_REPLY] Cancelar aula
```

---

## Webhooks

### Configuração

1. No Meta Business Manager, vá para **WhatsApp** > **Configuration**
2. Em **Webhook**, configure:
   - **Callback URL**: `https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook`
   - **Verify Token**: Token secreto definido em `.env`
3. Inscreva-se nos campos:
   - `messages` - Mensagens recebidas
   - `message_status` - Status de mensagens enviadas

### Eventos Processados

#### Message Status Update

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "5511999999999",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "statuses": [{
          "id": "MESSAGE_ID",
          "status": "delivered",
          "timestamp": "1234567890",
          "recipient_id": "5511999999999",
          "conversation": {
            "id": "CONVERSATION_ID",
            "origin": {
              "type": "utility"
            }
          },
          "pricing": {
            "billable": true,
            "pricing_model": "CBP",
            "category": "utility"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Processamento de Webhooks

O sistema processa automaticamente os webhooks e:

1. Valida o token de verificação
2. Extrai status da mensagem
3. Busca mensagem no banco de dados pelo `whatsapp_message_id`
4. Atualiza status e timestamps
5. Registra log em `whatsapp_delivery_logs`
6. Emite evento via Supabase Realtime

---

## Tratamento de Erros

### Categorias de Erros

#### 1. Erros de Validação (400)

```typescript
// Telefone inválido
{
  "error": "Invalid phone number format",
  "details": "Phone number must follow E.164 format"
}

// Campos obrigatórios faltando
{
  "error": "Missing required fields: recipientPhone, messageContent, messageType"
}

// Template não encontrado
{
  "error": "Template not found",
  "templateName": "schedule_confirmation"
}
```

#### 2. Erros de Autenticação (401/403)

```typescript
// Não autenticado
{
  "error": "Unauthorized",
  "details": "Authentication required"
}

// Integração desabilitada
{
  "error": "WhatsApp integration is not enabled"
}
```

#### 3. Erros de Limite (429)

```typescript
// Limite diário atingido
{
  "error": "Daily message limit reached",
  "limit": 1000,
  "used": 1000,
  "resetsAt": "2024-03-16T00:00:00Z"
}
```

#### 4. Erros da API WhatsApp (500)

```typescript
// Falha no envio
{
  "success": false,
  "error": "Failed to send WhatsApp message",
  "details": "WhatsApp API Error: Invalid parameter"
}

// Número não registrado no WhatsApp
{
  "error": "Recipient not on WhatsApp",
  "phone": "+5511999999999"
}
```

### Estratégia de Retry

```typescript
async function sendMessageWithRetry(
  params: SendMessageParams,
  maxRetries: number = 3
): Promise<any> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendMessage(params);
      return result;
    } catch (error) {
      lastError = error;

      // Não tentar novamente para erros de validação
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        throw error;
      }

      // Backoff exponencial
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

---

## Rate Limiting

### Limites da WhatsApp Business API

| Tier | Mensagens/dia | Observações |
|------|---------------|-------------|
| Tier 1 | 1.000 | Contas novas |
| Tier 2 | 10.000 | Após verificação |
| Tier 3 | 100.000 | Empresas verificadas |
| Tier Unlimited | Sem limite | Casos especiais |

### Controle de Limite Interno

O sistema implementa controle de limite diário:

```sql
-- Verificar limite antes de enviar
SELECT
  messages_sent_today,
  daily_message_limit,
  (daily_message_limit - messages_sent_today) as remaining
FROM whatsapp_config;

-- Incrementar contador após envio
UPDATE whatsapp_config
SET messages_sent_today = messages_sent_today + 1
WHERE id = (SELECT id FROM whatsapp_config LIMIT 1);

-- Resetar contador (executado diariamente via cron)
UPDATE whatsapp_config
SET messages_sent_today = 0,
    last_reset_date = CURRENT_DATE
WHERE last_reset_date < CURRENT_DATE;
```

### Monitoramento de Uso

```typescript
// Verificar status de limite
async function checkMessageLimit() {
  const { data: config } = await supabase
    .from('whatsapp_config')
    .select('*')
    .single();

  const remaining = config.daily_message_limit - config.messages_sent_today;
  const percentUsed = (config.messages_sent_today / config.daily_message_limit) * 100;

  return {
    limit: config.daily_message_limit,
    used: config.messages_sent_today,
    remaining,
    percentUsed,
    resetsAt: new Date(config.last_reset_date).setHours(24, 0, 0, 0)
  };
}
```

---

## Exemplos de Uso

### Exemplo 1: Enviar Confirmação de Agendamento

```typescript
import { useSendWhatsAppMessage } from '@/hooks/useWhatsApp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function ScheduleConfirmationButton({ schedule }) {
  const sendMessage = useSendWhatsAppMessage();

  const handleSendConfirmation = async () => {
    const date = format(new Date(schedule.date), 'dd/MM/yyyy', { locale: ptBR });
    const time = `${schedule.hour}:00`;

    await sendMessage.mutateAsync({
      recipientPhone: schedule.student_phone,
      recipientName: schedule.student_name,
      templateName: 'schedule_confirmation',
      messageContent: `Olá ${schedule.student_name}! Sua aula foi agendada...`,
      variables: {
        student_name: schedule.student_name,
        teacher_name: schedule.teacher_name,
        date: date,
        time: time,
      },
      messageType: 'schedule_confirmation',
      scheduleId: schedule.id,
      teacherId: schedule.teacher_id,
    });
  };

  return (
    <button
      onClick={handleSendConfirmation}
      disabled={sendMessage.isPending}
    >
      {sendMessage.isPending ? 'Enviando...' : 'Enviar Confirmação'}
    </button>
  );
}
```

### Exemplo 2: Listar Histórico de Mensagens

```typescript
import { useWhatsAppMessages } from '@/hooks/useWhatsApp';

function MessageHistory({ teacherId }) {
  const { data: messages, isLoading } = useWhatsAppMessages({
    teacherId: teacherId,
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {messages?.map(message => (
        <div key={message.id}>
          <p>{message.recipient_name} - {message.recipient_phone}</p>
          <p>Status: {message.status}</p>
          <p>Enviado em: {new Date(message.sent_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Exemplo 3: Enviar Mensagem Personalizada

```typescript
function CustomMessageForm() {
  const sendMessage = useSendWhatsAppMessage();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    await sendMessage.mutateAsync({
      recipientPhone: phone,
      messageContent: message,
      messageType: 'custom',
    });

    // Limpar formulário
    setPhone('');
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+5511999999999"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Digite sua mensagem..."
      />
      <button type="submit" disabled={sendMessage.isPending}>
        Enviar
      </button>
    </form>
  );
}
```

---

## Referências

- [WhatsApp Business Platform API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [WhatsApp Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)
