#!/bin/bash

# ============================================
# Script de Teste: Validação de Role e Feedback
# ============================================
# Este script testa se as correções de role estão funcionando
# ============================================

echo "🔍 Verificando correções aplicadas..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para printar status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Verificar se os arquivos foram alterados
echo "📁 Verificando arquivos modificados..."
echo ""

if grep -q "console.log('\[signUp\] Iniciando registro'" src/integrations/supabase/auth.ts; then
    print_status 0 "auth.ts: Logs adicionados"
else
    print_status 1 "auth.ts: Logs NÃO encontrados"
fi

if grep -q "console.log('\[RegisterForm\] Iniciando cadastro'" src/components/Auth/RegisterForm.tsx; then
    print_status 0 "RegisterForm.tsx: Logs adicionados"
else
    print_status 1 "RegisterForm.tsx: Logs NÃO encontrados"
fi

if grep -q "Conta criada com sucesso!" src/components/Auth/RegisterForm.tsx; then
    print_status 0 "RegisterForm.tsx: Feedback melhorado"
else
    print_status 1 "RegisterForm.tsx: Feedback NÃO atualizado"
fi

if [ -f "supabase/migrations/004_fix_profiles_insert_policy.sql" ]; then
    print_status 0 "Migration 004: Arquivo criado"
else
    print_status 1 "Migration 004: Arquivo NÃO encontrado"
fi

if [ -f "docs/FIX_ROLE_AND_FEEDBACK.md" ]; then
    print_status 0 "Documentação: Guia criado"
else
    print_status 1 "Documentação: Guia NÃO encontrado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Instruções
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1. Aplicar a migration no Supabase:"
echo "   • Acesse: https://supabase.com/dashboard"
echo "   • Vá em: SQL Editor"
echo "   • Cole o conteúdo de: supabase/migrations/004_fix_profiles_insert_policy.sql"
echo "   • Execute a query"
echo ""
echo "2. Testar a aplicação:"
echo "   • Execute: bun run dev"
echo "   • Abra o navegador em: http://localhost:5173"
echo "   • Abra o Console (F12)"
echo "   • Vá para a página de registro"
echo "   • Crie um novo usuário com role 'admin'"
echo ""
echo "3. Verificar logs:"
echo "   • No Console do navegador, procure por: [RegisterForm] e [signUp]"
echo "   • No Supabase Dashboard, vá em: Logs > Postgres Logs"
echo "   • Procure por mensagens do trigger handle_new_user"
echo ""
echo "4. Validar no banco:"
echo "   • Table Editor > profiles"
echo "   • Verifique se o role está correto (admin ou teacher)"
echo ""
echo -e "${YELLOW}📖 Para mais detalhes, leia: docs/FIX_ROLE_AND_FEEDBACK.md${NC}"
echo ""
