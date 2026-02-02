# Guia de Configuração e Deployment

## Índice

1. [Requisitos](#requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [WhatsApp Business API Setup](#whatsapp-business-api-setup)
4. [Configuração do Supabase](#configuração-do-supabase)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Deploy de Edge Functions](#deploy-de-edge-functions)
7. [Configuração de Webhooks](#configuração-de-webhooks)
8. [Testes](#testes)
9. [Deploy em Produção](#deploy-em-produção)
10. [Monitoramento](#monitoramento)
11. [Troubleshooting](#troubleshooting)

---

## Requisitos

### Contas Necessárias

- [ ] Conta no Meta Business Suite
- [ ] Número de telefone para WhatsApp Business
- [ ] Projeto Supabase (tier Pro recomendado)
- [ ] Conta GitHub (para CI/CD)

### Ferramentas de Desenvolvimento

```bash
# Verificar versões
node --version    # v18.0.0 ou superior
npm --version     # v9.0.0 ou superior

# Instalar Supabase CLI
npm install -g supabase

# Verificar instalação
supabase --version
```

### Permissões Necessárias

- Admin no Meta Business Manager
- Owner ou Admin no projeto Supabase
- Permissões de deploy no repositório

---

## Configuração Inicial

### 1. Clone e Setup do Projeto

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/prof-flow-manager.git
cd prof-flow-manager

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env.local
```

### 2. Estrutura de Pastas

Verificar se a estrutura está completa:

```
prof-flow-manager/
├── src/
│   ├── components/
│   │   └── WhatsApp/          # A ser criado
│   ├── hooks/
│   │   └── useWhatsApp.ts     # A ser criado
│   └── integrations/
│       └── supabase/
├── supabase/
│   ├── functions/
│   │   ├── send-whatsapp-message/
│   │   ├── whatsapp-webhook/
│   │   └── _shared/
│   └── migrations/
├── docs/
│   └── whatsapp-messaging/
└── .env.local
```

---

## WhatsApp Business API Setup

### Passo 1: Criar Conta Business

1. Acesse [Meta Business Suite](https://business.facebook.com/)
2. Clique em **Criar Conta** se ainda não tiver
3. Preencha informações da empresa
4. Verifique a conta (pode levar alguns dias)

### Passo 2: Configurar WhatsApp Business

1. No Meta Business Suite, vá para **Configurações**
2. Em **Contas**, clique em **WhatsApp Business Platform**
3. Clique em **Começar**
4. Siga o assistente de configuração:
   - Selecione ou adicione um número de telefone
   - Verifique o número via SMS
   - Configure o perfil da empresa

### Passo 3: Obter Credenciais

#### Phone Number ID

1. Vá para **WhatsApp Manager**
2. Clique no número de telefone configurado
3. Copie o **Phone Number ID** (formato: `123456789012345`)

#### Business Account ID

1. No WhatsApp Manager, vá para **Configurações**
2. Em **Informações da Conta**, copie o **ID da Conta Comercial**

#### Access Token (Permanente)

1. Vá para **Configurações do Sistema** > **Usuários do Sistema**
2. Clique em **Adicionar**
3. Configure:
   - Nome: `WhatsApp API User`
   - Função: **Admin**
4. Clique em **Gerar Novo Token**
5. Selecione permissões:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
6. **IMPORTANTE**: Copie e guarde o token (não será exibido novamente)

### Passo 4: Criar Templates de Mensagem

1. No WhatsApp Manager, vá para **Modelos de Mensagem**
2. Clique em **Criar Modelo**

#### Template: Confirmação de Agendamento

```
Nome: schedule_confirmation
Categoria: UTILITY
Idioma: Português (Brasil)

Corpo:
Olá {{1}}! ✅

Sua aula foi agendada com sucesso!

📚 Professor(a): {{2}}
📅 Data: {{3}}
🕐 Horário: {{4}}

Nos vemos em breve!

Rodapé:
AgendaPro - Sistema de Agendamentos
```

#### Template: Lembrete de Aula

```
Nome: schedule_reminder
Categoria: UTILITY
Idioma: Português (Brasil)

Corpo:
Olá {{1}}! 🔔

Este é um lembrete da sua aula amanhã:

📚 Professor(a): {{2}}
📅 Data: {{3}}
🕐 Horário: {{4}}

Até amanhã!

Rodapé:
AgendaPro - Sistema de Agendamentos
```

#### Template: Cancelamento de Aula

```
Nome: schedule_cancellation
Categoria: UTILITY
Idioma: Português (Brasil)

Corpo:
Olá {{1}}! ⚠️

Informamos que a aula foi cancelada:

📚 Professor(a): {{2}}
📅 Data: {{3}}
🕐 Horário: {{4}}

{{5}}

Entre em contato para reagendar.

Rodapé:
AgendaPro - Sistema de Agendamentos
```

3. Clique em **Enviar** e aguarde aprovação (24-48h)

### Passo 5: Verificar Aprovação

1. Verifique o status dos templates em **Modelos de Mensagem**
2. Status **APPROVED** = Pronto para uso
3. Se **REJECTED**, leia o motivo e reenvie com ajustes

---

## Configuração do Supabase

### 1. Criar/Configurar Projeto

```bash
# Login no Supabase
supabase login

# Link com projeto existente
supabase link --project-ref seu-project-id

# Ou criar novo projeto
supabase init
```

### 2. Aplicar Migrations

```bash
# Verificar status
supabase migration list

# Aplicar migration do WhatsApp
supabase db push

# Verificar aplicação
supabase db diff
```

### 3. Gerar Types TypeScript

```bash
# Gerar types atualizados
supabase gen types typescript --project-id seu-project-id > src/integrations/supabase/types.ts

# Verificar arquivo gerado
cat src/integrations/supabase/types.ts | grep -A 10 "whatsapp_messages"
```

### 4. Configurar Storage (Opcional)

Se for enviar imagens/arquivos via WhatsApp:

```bash
# Criar bucket para mídia
supabase storage create whatsapp-media --public

# Configurar políticas
# No Supabase Dashboard > Storage > whatsapp-media > Policies
```

### 5. Habilitar Realtime

```bash
# No Supabase Dashboard > Database > Replication
# Habilitar Realtime para as tabelas:
- whatsapp_messages
- whatsapp_delivery_logs
```

---

## Variáveis de Ambiente

### Arquivo `.env.local` (Frontend)

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
VITE_APP_NAME=AgendaPro
VITE_APP_URL=https://seu-app.com
```

### Supabase Secrets (Edge Functions)

```bash
# Configurar secrets no Supabase
supabase secrets set WHATSAPP_API_KEY=EAAxxxxxxxxxxxxx
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=123456789012345
supabase secrets set WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN=$(openssl rand -base64 32)

# Verificar secrets configurados
supabase secrets list
```

### GitHub Actions (CI/CD)

No repositório GitHub, vá para **Settings > Secrets and variables > Actions**:

```
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxx
SUPABASE_PROJECT_ID=xxxxxxxxxxxxx
SUPABASE_DB_PASSWORD=xxxxxxxxxxxxx
```

---

## Deploy de Edge Functions

### 1. Estrutura das Functions

Verificar que os arquivos estão no lugar:

```bash
ls -la supabase/functions/

# Deve listar:
# - send-whatsapp-message/
# - whatsapp-webhook/
# - _shared/
```

### 2. Deploy Individual (Desenvolvimento)

```bash
# Deploy da função de envio
supabase functions deploy send-whatsapp-message --project-ref seu-project-id

# Deploy do webhook
supabase functions deploy whatsapp-webhook --project-ref seu-project-id --no-verify-jwt

# Verificar deploy
supabase functions list
```

### 3. Deploy de Todas (Produção)

```bash
# Deploy de todas as functions
supabase functions deploy --project-ref seu-project-id

# Logs em tempo real
supabase functions serve send-whatsapp-message --env-file .env.local
```

### 4. Configurar Permissões

No Supabase Dashboard:

1. Vá para **Edge Functions**
2. Selecione `whatsapp-webhook`
3. Em **Settings**, desabilite **Require JWT** (webhooks externos não têm JWT)
4. Para `send-whatsapp-message`, mantenha JWT habilitado

### 5. Verificar Funcionamento

```bash
# Testar função localmente
supabase functions serve send-whatsapp-message

# Em outro terminal, fazer request
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-whatsapp-message' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{
    "recipientPhone": "+5511999999999",
    "messageContent": "Teste",
    "messageType": "custom"
  }'
```

---

## Configuração de Webhooks

### 1. Obter URL do Webhook

```bash
# URL da função webhook
echo "https://$(supabase projects list | grep seu-project | awk '{print $4}').supabase.co/functions/v1/whatsapp-webhook"
```

### 2. Configurar no Meta

1. No WhatsApp Manager, vá para **Configuração**
2. Clique em **Editar** na seção Webhook
3. Preencha:
   - **URL de callback**: `https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook`
   - **Token de verificação**: (mesmo configurado em `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
4. Clique em **Verificar e salvar**

### 3. Inscrever-se em Eventos

Ainda na página de Webhook:

1. Em **Campos do webhook**, selecione:
   - ✅ `messages`
   - ✅ `message_status`
2. Clique em **Salvar**

### 4. Testar Webhook

```bash
# Ver logs da function
supabase functions logs whatsapp-webhook --project-ref seu-project-id

# Enviar mensagem de teste e verificar se webhook é recebido
```

---

## Testes

### 1. Testes Locais

#### Testar Migration

```bash
# Resetar DB local
supabase db reset

# Verificar tabelas criadas
supabase db diff

# Conectar ao DB e verificar dados
psql postgresql://postgres:postgres@localhost:54322/postgres
\dt
SELECT * FROM whatsapp_templates;
\q
```

#### Testar Edge Functions

```bash
# Iniciar Supabase local
supabase start

# Servir function em modo dev
supabase functions serve send-whatsapp-message --env-file .env.local --debug

# Fazer request de teste (em outro terminal)
npm run test:whatsapp-function
```

### 2. Testes de Integração

Criar arquivo `tests/whatsapp.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('WhatsApp Integration', () => {
  it('should send test message', async () => {
    const { data, error } = await supabase.functions.invoke(
      'send-whatsapp-message',
      {
        body: {
          recipientPhone: '+5511999999999',
          messageContent: 'Teste automatizado',
          messageType: 'custom',
        },
      }
    );

    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.messageId).toBeDefined();
  });

  it('should retrieve templates', async () => {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('is_active', true);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
  });
});
```

Executar:

```bash
npm run test
```

### 3. Testes de Webhook

Usar ferramenta como [webhook.site](https://webhook.site) ou ngrok:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor função local
ngrok http 54321

# Usar URL do ngrok no Meta temporariamente
# Exemplo: https://abc123.ngrok.io/functions/v1/whatsapp-webhook
```

---

## Deploy em Produção

### 1. Checklist Pré-Deploy

- [ ] Todas as migrations aplicadas
- [ ] Edge Functions testadas localmente
- [ ] Templates aprovados no WhatsApp
- [ ] Secrets configurados no Supabase
- [ ] Webhook configurado e verificado
- [ ] Variáveis de ambiente no frontend
- [ ] RLS policies revisadas
- [ ] Testes passando

### 2. Deploy via CI/CD (Recomendado)

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy-database:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Deploy migrations
        run: supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-functions:
    runs-on: ubuntu-latest
    needs: deploy-database
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Deploy Edge Functions
        run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-functions
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel/Netlify
        # Configurar deploy conforme plataforma
        run: echo "Deploy frontend"
```

### 3. Deploy Manual

```bash
# 1. Deploy migrations
supabase db push --project-ref seu-project-id

# 2. Deploy functions
supabase functions deploy --project-ref seu-project-id

# 3. Build frontend
npm run build

# 4. Deploy frontend (exemplo Vercel)
vercel --prod
```

### 4. Verificação Pós-Deploy

```bash
# Verificar functions no ar
curl https://seu-projeto.supabase.co/functions/v1/

# Verificar webhook
curl "https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=seu-token&hub.challenge=test"

# Deve retornar: test
```

---

## Monitoramento

### 1. Logs de Edge Functions

```bash
# Ver logs em tempo real
supabase functions logs send-whatsapp-message --project-ref seu-project-id -f

# Logs com filtro
supabase functions logs send-whatsapp-message --project-ref seu-project-id | grep ERROR
```

### 2. Queries de Monitoramento

```sql
-- Taxa de sucesso de envio (últimas 24h)
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM whatsapp_messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;

-- Mensagens falhadas (últimas 24h)
SELECT
  id,
  recipient_phone,
  message_type,
  error_message,
  created_at
FROM whatsapp_messages
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Templates mais usados
SELECT
  name,
  usage_count,
  display_name
FROM whatsapp_templates
WHERE is_active = true
ORDER BY usage_count DESC
LIMIT 10;

-- Uso diário
SELECT
  messages_sent_today,
  daily_message_limit,
  ROUND(messages_sent_today * 100.0 / daily_message_limit, 2) as percent_used
FROM whatsapp_config;
```

### 3. Alertas

Configurar no Supabase Dashboard > Database > Webhooks:

```sql
-- Alert quando limite de mensagens atingir 80%
CREATE OR REPLACE FUNCTION notify_message_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.messages_sent_today >= (NEW.daily_message_limit * 0.8) THEN
    -- Enviar notificação (via webhook ou email)
    PERFORM pg_notify('message_limit_warning', json_build_object(
      'used', NEW.messages_sent_today,
      'limit', NEW.daily_message_limit,
      'percent', (NEW.messages_sent_today * 100.0 / NEW.daily_message_limit)
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_message_limit
AFTER UPDATE ON whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION notify_message_limit();
```

---

## Troubleshooting

### Problema: Webhook não está sendo recebido

**Sintomas:** Meta mostra erro na verificação do webhook

**Soluções:**

1. Verificar se função está no ar:
   ```bash
   curl https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook
   ```

2. Verificar token de verificação:
   ```bash
   supabase secrets list | grep WHATSAPP_WEBHOOK_VERIFY_TOKEN
   ```

3. Verificar JWT desabilitado para webhook:
   - Supabase Dashboard > Edge Functions > whatsapp-webhook > Settings
   - **Require JWT**: OFF

4. Testar manualmente:
   ```bash
   curl "https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=test"
   ```

### Problema: Mensagens não estão sendo enviadas

**Sintomas:** Status permanece em "pending" ou "failed"

**Soluções:**

1. Verificar credenciais:
   ```bash
   supabase secrets list
   ```

2. Verificar logs:
   ```bash
   supabase functions logs send-whatsapp-message -f
   ```

3. Testar API do WhatsApp diretamente:
   ```bash
   curl -X POST "https://graph.facebook.com/v18.0/PHONE_ID/messages" \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "messaging_product": "whatsapp",
       "to": "5511999999999",
       "type": "text",
       "text": {"body": "teste"}
     }'
   ```

4. Verificar limite diário:
   ```sql
   SELECT * FROM whatsapp_config;
   ```

### Problema: Template não encontrado

**Sintomas:** Erro "Template not found"

**Soluções:**

1. Verificar aprovação no Meta:
   - WhatsApp Manager > Modelos de Mensagem
   - Status deve ser **APPROVED**

2. Verificar nome do template:
   ```sql
   SELECT name FROM whatsapp_templates WHERE is_active = true;
   ```

3. Sincronizar templates:
   - Atualizar `whatsapp_template_id` no banco com ID do Meta

### Problema: Número de telefone inválido

**Sintomas:** Erro "Invalid phone number"

**Soluções:**

1. Verificar formato E.164:
   - ✅ Correto: `+5511999999999` ou `5511999999999`
   - ❌ Errado: `(11) 99999-9999`, `11999999999`

2. Validar número:
   ```typescript
   const valid = /^[1-9]\d{9,14}$/.test(phone.replace(/\D/g, ''));
   ```

3. Verificar se número tem WhatsApp:
   - Testar manualmente enviando mensagem via app

### Problema: Rate limit excedido

**Sintomas:** Erro 429 ou "Rate limit exceeded"

**Soluções:**

1. Verificar tier da conta:
   - Meta Business Manager > WhatsApp > Settings
   - Tier 1: 1.000/dia, Tier 2: 10.000/dia

2. Implementar fila:
   ```typescript
   // Adicionar delay entre envios
   await new Promise(resolve => setTimeout(resolve, 1000));
   ```

3. Aumentar tier:
   - Solicitar upgrade no Meta Business Manager

---

## Backup e Recuperação

### Backup do Banco de Dados

```bash
# Backup completo
supabase db dump -f backup.sql --project-ref seu-project-id

# Backup apenas dados WhatsApp
supabase db dump -f whatsapp-backup.sql \
  --project-ref seu-project-id \
  --table whatsapp_messages \
  --table whatsapp_templates \
  --table whatsapp_config
```

### Restauração

```bash
# Restaurar backup
psql postgresql://postgres:[senha]@db.[projeto].supabase.co:5432/postgres < backup.sql
```

---

## Manutenção

### Rotinas Diárias

```sql
-- Limpar logs antigos (>90 dias)
DELETE FROM whatsapp_delivery_logs
WHERE created_at < NOW() - INTERVAL '90 days';

-- Arquivar mensagens antigas (>1 ano)
-- Implementar tabela de arquivo ou export
```

### Rotinas Semanais

- Revisar mensagens falhadas
- Verificar uso de templates
- Monitorar custos da API
- Revisar logs de erro

### Rotinas Mensais

- Analisar métricas de entrega
- Atualizar documentação
- Revisar e otimizar templates
- Backup completo do banco

---

## Referências

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Meta Business Manager](https://business.facebook.com/)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
