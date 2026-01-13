# 🚀 Guia de Implementação e Teste - Funcionalidades Estendidas

## ✅ O que foi implementado

### 1. Banco de Dados
- ✅ Migration completa (`supabase/migrations/001_add_teacher_extended_info.sql`)
- ✅ 3 novas tabelas: `teacher_addresses`, `lesson_types`, `teacher_lesson_types`
- ✅ 2 novos campos em `teachers`: `performance`, `academic_background`
- ✅ Novo ENUM: `teacher_performance`
- ✅ RLS policies configuradas
- ✅ Índices otimizados
- ✅ Funções de busca avançada
- ✅ 8 tipos de aula pré-cadastrados

### 2. Types e API
- ✅ `src/integrations/supabase/extended-types.ts` - Tipos TypeScript
- ✅ `src/integrations/supabase/types.ts` - Atualizado com novas tabelas
- ✅ `src/lib/api/teacher-extended.ts` - CRUD completo + ViaCEP

### 3. Componentes React
- ✅ `TeacherAddressForm` - Formulário de endereço com busca CEP
- ✅ `TeacherAdvancedSearch` - Busca avançada (integrada ao Dashboard)
- ✅ `EnhancedTeacherForm` - Formulário completo com abas
- ✅ `LessonTypesManagement` - Gerenciamento de tipos de aula

### 4. Integrações
- ✅ `TeacherAdvancedSearch` integrada na aba "Buscar Horários"
- ✅ Nova aba "Tipos de Aula" no Sidebar (admin apenas)
- ✅ `LessonTypesManagement` integrada no Dashboard

---

## 📋 Passo a Passo para Testar

### **PASSO 1: Executar Migration no Supabase** ⚡

1. Abra o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie TODO o conteúdo de:
   ```
   supabase/migrations/001_add_teacher_extended_info.sql
   ```
6. Cole no editor SQL
7. Clique em **RUN** ou pressione `Ctrl + Enter`
8. Aguarde a execução (pode levar alguns segundos)
9. Verifique se apareceu "Success" sem erros

**Verificação:**
```sql
-- Execute estas queries para confirmar:

-- 1. Verificar se tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teacher_addresses', 'lesson_types', 'teacher_lesson_types');

-- 2. Verificar tipos de aula criados
SELECT * FROM lesson_types ORDER BY name;

-- 3. Verificar novos campos em teachers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
AND column_name IN ('performance', 'academic_background');
```

---

### **PASSO 2: Iniciar o Projeto** 🏃

```bash
cd /home/rafael/projetos/prof-flow-manager
bun install  # Se houver dependências novas
bun run dev
```

Acesse: http://localhost:5173

---

### **PASSO 3: Testar como Admin** 👨‍💼

#### 3.1. Fazer Login como Admin
- Use suas credenciais de admin

#### 3.2. Testar Gerenciamento de Tipos de Aula
1. No sidebar, clique em **"Tipos de Aula"** (novo item)
2. Você deve ver os 8 tipos pré-cadastrados:
   - Conversação
   - Gramática
   - Preparação para Exames
   - Business English
   - Inglês para Crianças
   - Inglês Técnico
   - Literatura
   - Pronúncia

3. **Testar Criação:**
   - Clique em "Novo Tipo"
   - Preencha nome e descrição
   - Clique em "Criar"
   - Verifique se apareceu na lista

4. **Testar Edição:**
   - Clique no ícone de lápis em um tipo
   - Altere a descrição
   - Clique em "Atualizar"

5. **Testar Exclusão:**
   - Clique no ícone de lixeira
   - Confirme a exclusão
   - Verifique se foi removido

#### 3.3. Testar Busca Avançada
1. No sidebar, clique em **"Buscar Horários"**
2. Agora você verá o novo componente `TeacherAdvancedSearch`
3. Teste os filtros:
   - **Disponibilidade:** Selecione dia e horário
   - **Nível:** Escolha um nível
   - **Certificação:** Marque/desmarque
   - **Desempenho:** (ADMIN APENAS) Selecione um desempenho
   - **Tipos de Aula:** Clique nas badges para selecionar múltiplos
   - **Formação:** Digite palavras-chave

4. Clique em **"Buscar"**
5. Verifique os resultados exibidos

#### 3.4. Testar Cadastro de Endereço
1. Vá em **"Professores"**
2. Clique em um professor existente (ou crie um novo)
3. Você verá o formulário com abas:
   - **Dados Básicos:** Informações gerais
   - **Formação:** Campo de texto para formação acadêmica
   - **Tipos de Aula:** Badges clicáveis
   - **Endereço:** (Novo) Formulário de endereço

4. **Testar Busca por CEP:**
   - Vá na aba "Endereço"
   - Digite um CEP válido (ex: 01310-100)
   - Ao sair do campo, os dados devem preencher automaticamente
   - Complete os campos obrigatórios
   - Clique em "Cadastrar Endereço"

5. **Testar Formação Acadêmica:**
   - Vá na aba "Formação"
   - Digite a formação do professor
   - Salve

6. **Testar Tipos de Aula:**
   - Vá na aba "Tipos de Aula"
   - Clique nas badges para selecionar/desselecionar
   - Salve

7. **Testar Desempenho (Admin):**
   - Vá na aba "Dados Básicos"
   - Role até "Desempenho em Sala"
   - Selecione um valor
   - Salve

---

### **PASSO 4: Testar como Professor (Teacher)** 👨‍🏫

#### 4.1. Fazer Login como Teacher
- Use credenciais de um professor

#### 4.2. Verificar Restrições de Acesso
1. No sidebar, NÃO deve aparecer:
   - ❌ "Tipos de Aula"
   - ❌ Opção de editar endereços
   - ❌ Campo "Desempenho" na busca

2. Na busca avançada:
   - ✅ PODE ver: disponibilidade, nível, certificação, tipos de aula, formação
   - ❌ NÃO PODE ver: desempenho em sala
   - ❌ NÃO PODE ver: endereços de outros professores

---

### **PASSO 5: Validar Segurança (RLS)** 🔒

Execute no **Supabase SQL Editor**:

```sql
-- 1. Testar acesso a endereços (deve falhar para teacher)
-- Faça login como teacher no app, então execute:
SELECT * FROM teacher_addresses;
-- Resultado esperado: Nenhuma linha (teacher não tem permissão)

-- 2. Testar acesso a endereços como admin
-- Faça login como admin no app, então execute:
SELECT * FROM teacher_addresses;
-- Resultado esperado: Todas as linhas

-- 3. Testar criação de tipo de aula por teacher (deve falhar)
-- Como teacher, tente:
INSERT INTO lesson_types (name) VALUES ('Teste Teacher');
-- Resultado esperado: Erro de permissão

-- 4. Testar visualização de tipos de aula (deve funcionar para todos)
SELECT * FROM lesson_types;
-- Resultado esperado: Sucesso para admin E teacher
```

---

## 🧪 Checklist de Testes

### Database
- [ ] Migration executada sem erros
- [ ] Tabelas criadas: `teacher_addresses`, `lesson_types`, `teacher_lesson_types`
- [ ] 8 tipos de aula pré-cadastrados
- [ ] Campos `performance` e `academic_background` em `teachers`
- [ ] RLS policies funcionando corretamente

### Componentes - Admin
- [ ] Nova aba "Tipos de Aula" aparece no sidebar
- [ ] Componente `LessonTypesManagement` carrega
- [ ] CRUD de tipos de aula funciona (criar, editar, excluir)
- [ ] Busca avançada com TODOS os filtros (incluindo desempenho)
- [ ] Formulário de endereço com busca CEP funciona
- [ ] Formulário de professor com abas funciona
- [ ] Campo "Desempenho" aparece e pode ser editado
- [ ] Seleção múltipla de tipos de aula funciona

### Componentes - Teacher
- [ ] Aba "Tipos de Aula" NÃO aparece no sidebar
- [ ] Busca avançada SEM filtro de desempenho
- [ ] NÃO consegue acessar endereços
- [ ] NÃO consegue ver campo de desempenho
- [ ] Consegue buscar por formação e tipos de aula

### API/Backend
- [ ] Busca por CEP retorna dados corretos
- [ ] Busca avançada retorna resultados filtrados
- [ ] Função `search_teachers_advanced()` funciona
- [ ] Função `get_teacher_lesson_types()` funciona

### Segurança
- [ ] Teacher não consegue SELECT em `teacher_addresses`
- [ ] Teacher não consegue INSERT/UPDATE/DELETE em `lesson_types`
- [ ] Admin consegue todas as operações
- [ ] Campo `performance` não é exposto para teachers

---

## 🐛 Possíveis Problemas e Soluções

### Problema 1: "Function search_teachers_advanced does not exist"
**Causa:** Migration não foi executada completamente  
**Solução:**
```sql
-- Execute novamente apenas a parte das funções:
CREATE OR REPLACE FUNCTION public.search_teachers_advanced(...)
```

### Problema 2: Erro ao buscar CEP
**Causa:** ViaCEP API pode estar fora do ar  
**Solução:** Teste com CEPs conhecidos:
- 01310-100 (Av Paulista, SP)
- 20040-020 (Rio de Janeiro, RJ)

### Problema 3: Types TypeScript com erro
**Causa:** Types desatualizados  
**Solução:**
```bash
# Reinicie o servidor de desenvolvimento
bun run dev
```

### Problema 4: RLS bloqueando admin
**Causa:** Profile não configurado corretamente  
**Solução:**
```sql
-- Verificar role do usuário
SELECT * FROM profiles WHERE user_id = auth.uid();

-- Se necessário, atualizar para admin:
UPDATE profiles SET role = 'admin' WHERE user_id = 'seu-user-id';
```

---

## 📊 Queries Úteis para Debug

```sql
-- Ver todos os professores com novos campos
SELECT id, name, email, performance, academic_background 
FROM teachers;

-- Ver endereços cadastrados
SELECT ta.*, t.name as teacher_name
FROM teacher_addresses ta
JOIN teachers t ON ta.teacher_id = t.id;

-- Ver tipos de aula de um professor
SELECT t.name as teacher_name, lt.name as lesson_type
FROM teacher_lesson_types tlt
JOIN teachers t ON tlt.teacher_id = t.id
JOIN lesson_types lt ON tlt.lesson_type_id = lt.id
ORDER BY t.name, lt.name;

-- Testar busca avançada
SELECT * FROM search_teachers_advanced(
  p_day_of_week := 1,
  p_hour := 14,
  p_level := 'avancado'
);

-- Ver professores com horários livres
SELECT t.name, COUNT(s.id) as free_hours
FROM teachers t
LEFT JOIN schedules s ON t.id = s.teacher_id AND s.status = 'livre'
GROUP BY t.id, t.name
ORDER BY free_hours DESC;
```

---

## 📝 Próximas Melhorações Sugeridas

1. **Export de dados:** Botão para exportar lista de professores em CSV/Excel
2. **Relatórios:** Dashboard com estatísticas de tipos de aula mais procurados
3. **Notificações:** Email quando um professor atualiza disponibilidade
4. **Histórico:** Log de alterações em endereços e desempenho
5. **Validações:** CPF, telefone com máscaras
6. **Upload:** Foto do professor e certificados
7. **Calendário:** Integração com Google Calendar
8. **Avaliações:** Sistema de avaliação de alunos sobre professores

---

## 🎉 Conclusão

Todas as funcionalidades solicitadas foram implementadas:

✅ **Endereço do professor** (CEP, rua, número, complemento, bairro, cidade, UF)  
✅ **Desempenho em sala** (ruim, regular, bom, excelente) - acesso admin  
✅ **Tipos de aula** (múltiplos por professor)  
✅ **Formação acadêmica**  
✅ **Busca avançada** com todos os novos filtros  
✅ **Segurança RLS** garantindo acesso restrito  

O sistema está pronto para uso! 🚀

---

**Dúvidas ou problemas?** Consulte:
- `docs/EXTENDED_FEATURES.md` - Documentação completa
- `docs/DATA_MODEL.md` - Modelo de dados atualizado
- `.github/copilot-instructions.md` - Padrões de código
