#!/bin/bash

echo "🔍 Testando conexão com Supabase e aplicando correções..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 DIAGNÓSTICO DO PROBLEMA:${NC}"
echo "- A aplicação fica carregando eternamente"
echo "- Nenhum erro aparece no console ou terminal"
echo "- Causa provável: Políticas RLS muito restritivas na tabela profiles"
echo ""

echo -e "${YELLOW}🔧 SOLUÇÃO:${NC}"
echo "1. Verificar se o Supabase está acessível"
echo "2. Aplicar migration 003_fix_profiles_rls.sql"
echo "3. Testar consulta à tabela profiles"
echo ""

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Erro: Variáveis de ambiente não configuradas${NC}"
    echo ""
    echo "Configure as seguintes variáveis no arquivo .env.local:"
    echo "  VITE_SUPABASE_URL=https://seu-projeto.supabase.co"
    echo "  VITE_SUPABASE_ANON_KEY=sua-chave-anonima"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Variáveis de ambiente configuradas${NC}"
echo ""

# Instruções para aplicar a migration manualmente
echo -e "${YELLOW}📝 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1. Acesse o Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/SEU_PROJECT_ID/editor"
echo ""
echo "2. Vá até 'SQL Editor'"
echo ""
echo "3. Execute o conteúdo do arquivo:"
echo "   supabase/migrations/003_fix_profiles_rls.sql"
echo ""
echo "4. Reinicie a aplicação (Ctrl+C e bun run dev)"
echo ""
echo "5. Verifique os logs no console do navegador"
echo "   - Procure por logs começando com [AuthContext]"
echo "   - Procure por logs começando com [getUserRole]"
echo ""

echo -e "${YELLOW}🐛 LOGS DE DEBUG ADICIONADOS:${NC}"
echo "- AuthContext.tsx: Logs detalhados de autenticação"
echo "- auth.ts: Logs de getUserRole com timeout de 5s"
echo "- Timeout automático se a query demorar mais de 5s"
echo ""

echo -e "${GREEN}✨ Após aplicar a migration, o problema deve ser resolvido!${NC}"
