# Documentação ProfFlow Manager

Bem-vindo à documentação técnica do **ProfFlow Manager (AgendaPro)** - Sistema de gerenciamento e agendamento de professores.

## 📚 Índice de Documentação

### Funcionalidades

#### 🔹 [Mensagens WhatsApp](./whatsapp-messaging/README.md)

Sistema completo de mensagens via WhatsApp Business API para comunicação com alunos.

**Documentos disponíveis:**
- [📋 README Principal](./whatsapp-messaging/README.md) - Visão geral e quick start
- [🏗️ Arquitetura](./whatsapp-messaging/01-ARQUITETURA.md) - Estrutura e design da solução
- [💻 Guia de Implementação](./whatsapp-messaging/02-GUIA-IMPLEMENTACAO.md) - Passo a passo técnico
- [🔌 API e Integração](./whatsapp-messaging/03-API-INTEGRACAO.md) - Documentação de APIs
- [🚀 Configuração e Deploy](./whatsapp-messaging/04-CONFIGURACAO-DEPLOYMENT.md) - Setup e produção

**Status:** 📝 Documentado (implementação pendente)

---

## 🚀 Quick Links

### Para Desenvolvedores

- [Começar com WhatsApp](./whatsapp-messaging/02-GUIA-IMPLEMENTACAO.md)
- [Arquitetura do Sistema](./whatsapp-messaging/01-ARQUITETURA.md)
- [Exemplos de Código](./whatsapp-messaging/03-API-INTEGRACAO.md#exemplos-de-uso)

### Para Administradores

- [Configurar WhatsApp Business](./whatsapp-messaging/04-CONFIGURACAO-DEPLOYMENT.md#whatsapp-business-api-setup)
- [Criar Templates](./whatsapp-messaging/03-API-INTEGRACAO.md#templates)
- [Deploy em Produção](./whatsapp-messaging/04-CONFIGURACAO-DEPLOYMENT.md#deploy-em-produção)

### Para Troubleshooting

- [Problemas Comuns](./whatsapp-messaging/04-CONFIGURACAO-DEPLOYMENT.md#troubleshooting)
- [Monitoramento](./whatsapp-messaging/04-CONFIGURACAO-DEPLOYMENT.md#monitoramento)
- [FAQ](./whatsapp-messaging/README.md#-faq)

---

## 📖 Sobre o Projeto

**ProfFlow Manager** é um sistema de gerenciamento de agendamentos para professores, desenvolvido com:

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions + Realtime)
- **Integrações:** WhatsApp Business API

### Funcionalidades Principais

✅ Gerenciamento de horários de professores
✅ Agendamento de aulas
✅ Busca por disponibilidade
✅ Gerenciamento de perfis
✅ Sistema de mensagens WhatsApp (em desenvolvimento)

---

## 🤝 Contribuindo

Para contribuir com a documentação ou código:

1. Fork o repositório
2. Crie uma branch descritiva
3. Faça suas alterações
4. Envie um Pull Request

### Estrutura de Documentação

```
docs/
├── README.md                    # Este arquivo
└── whatsapp-messaging/          # Funcionalidade WhatsApp
    ├── README.md                # Overview
    ├── 01-ARQUITETURA.md        # Arquitetura
    ├── 02-GUIA-IMPLEMENTACAO.md # Implementação
    ├── 03-API-INTEGRACAO.md     # APIs
    └── 04-CONFIGURACAO-DEPLOYMENT.md  # Deploy
```

---

## 📝 Convenções de Documentação

### Nomenclatura de Arquivos

- `README.md` - Visão geral da funcionalidade
- `##-NOME.md` - Documentos numerados em ordem de leitura
- Usar UPPERCASE para nomes de arquivos principais
- Usar kebab-case para pastas

### Estrutura de Documentos

Cada documento deve conter:

1. **Título e Descrição**
2. **Índice** (para documentos longos)
3. **Conteúdo Principal**
4. **Exemplos Práticos**
5. **Referências**

### Formatação

- Use emojis para melhorar a legibilidade (✅ ❌ 🔹 📖 etc.)
- Code blocks com syntax highlighting
- Tabelas para comparações
- Diagramas ASCII para fluxos simples
- Links internos entre documentos

---

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/seu-usuario/prof-flow-manager/issues)
- **Discussões:** [GitHub Discussions](https://github.com/seu-usuario/prof-flow-manager/discussions)

---

**Última atualização:** 2024-01-XX
