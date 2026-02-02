# US-AUTH-001: Login com Email e Senha

## Status: ✅ Implementado

**Prioridade**: Alta
**Pontos de Esforço**: 5
**Sprint**: 1
**Implementado em**: 2025-11-17

---

## História de Usuário

### Como administrador ou professor
Eu quero fazer login no sistema usando meu email e senha
Para que eu possa acessar minhas funcionalidades de acordo com meu perfil

---

## Critérios de Aceitação

### Cenário 1: Login bem-sucedido com credenciais válidas ✅
**Dado** que sou um usuário cadastrado
**Quando** eu inserir meu email e senha corretos
**E** clicar no botão "Entrar"
**Então** devo ser autenticado no sistema
**E** ser redirecionado para o Dashboard
**E** ver uma mensagem de boas-vindas

### Cenário 2: Login com credenciais inválidas ✅
**Dado** que estou na tela de login
**Quando** eu inserir credenciais incorretas
**E** clicar em "Entrar"
**Então** devo ver uma mensagem de erro
**E** permanecer na tela de login
**E** os campos devem ser limpos ou mantidos para correção

### Cenário 3: Validação de formato de email ✅
**Dado** que estou preenchendo o formulário de login
**Quando** eu inserir um email com formato inválido
**Então** devo ver uma mensagem de erro indicando email inválido
**E** o botão de login deve permanecer desabilitado até correção

### Cenário 4: Validação de senha mínima ✅
**Dado** que estou preenchendo o formulário de login
**Quando** eu inserir uma senha com menos de 6 caracteres
**Então** devo ver uma mensagem de erro
**E** o formulário não deve ser submetido

### Cenário 5: Loading state durante autenticação ✅
**Dado** que cliquei em "Entrar" com credenciais válidas
**Quando** a autenticação está sendo processada
**Então** devo ver um indicador de loading
**E** o botão deve ficar desabilitado
**E** não devo poder submeter novamente

### Cenário 6: Login demo para testes ✅
**Dado** que estou na tela de login
**Quando** eu clicar em um dos botões de usuário demo
**Então** os campos devem ser preenchidos automaticamente
**E** o login deve ser realizado
**E** devo ser redirecionado para o Dashboard

---

## Regras de Negócio

1. **Email obrigatório** e deve ser um email válido
2. **Senha obrigatória** com mínimo de 6 caracteres
3. **Máximo de 5 tentativas** de login em 15 minutos (implementação futura)
4. **Sessão expira** após 24 horas de inatividade (gerenciado pelo Supabase)
5. **Case-insensitive** para email

---

## Implementação Técnica

### Arquivos Envolvidos

```
src/
├── components/Auth/LoginForm.tsx       # Formulário de login
├── hooks/useAuth.tsx                   # Context e hook de auth
├── lib/validators.ts                   # Schema de validação Zod
└── pages/Index.tsx                     # Roteamento principal
```

### Validação (Zod)

```typescript
// src/lib/validators.ts
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
```

### Componente de Login

```typescript
// src/components/Auth/LoginForm.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});
  setIsLoading(true);

  try {
    // Validar com Zod
    const validatedData = loginSchema.parse({
      email: credentials.email,
      password: credentials.password,
    });

    // Autenticar com Supabase
    await signIn(validatedData.email, validatedData.password);

    toast({
      title: 'Login realizado',
      description: 'Bem-vindo ao AgendaPro!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Tratar erros de validação
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
    } else if (error instanceof Error) {
      // Tratar erros de autenticação
      toast({
        title: 'Erro no login',
        description: error.message || 'Credenciais inválidas',
        variant: 'destructive',
      });
    }
  } finally {
    setIsLoading(false);
  }
};
```

### Hook de Autenticação

```typescript
// src/hooks/useAuth.tsx
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
};
```

---

## Testes

### Testes Unitários

```typescript
describe('LoginForm', () => {
  it('deve validar email corretamente', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('deve validar senha mínima', () => {
    const result = loginSchema.safeParse({
      email: 'test@test.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });

  it('deve aceitar credenciais válidas', () => {
    const result = loginSchema.safeParse({
      email: 'test@test.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });
});
```

### Testes de Integração

```typescript
describe('Login Integration', () => {
  it('deve fazer login com admin', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@escola.com' },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'admin123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });
});
```

### Testes Manuais

- [ ] Login com admin@escola.com / admin123
- [ ] Login com professor@escola.com / prof123
- [ ] Tentar login com email inválido
- [ ] Tentar login com senha curta
- [ ] Verificar mensagens de erro
- [ ] Verificar loading state
- [ ] Clicar em usuário demo
- [ ] Verificar redirecionamento após login

---

## Dependências

### Técnicas
- ✅ Supabase Auth configurado
- ✅ Tabela `profiles` criada
- ✅ RLS policies implementadas
- ✅ Zod instalado
- ✅ shadcn/ui components (Button, Input, Label, Card)
- ✅ Toast notification system

### User Stories
- Nenhuma (primeira story do módulo)

---

## Mockups/Screenshots

```
┌─────────────────────────────────────┐
│          🗓️  AgendaPro              │
│       Sistema de Gestão             │
│                                     │
│  ┌───────────────────────────────┐ │
│  │     Fazer Login               │ │
│  ├───────────────────────────────┤ │
│  │                               │ │
│  │  Email                        │ │
│  │  [________________]           │ │
│  │                               │ │
│  │  Senha                        │ │
│  │  [________________]           │ │
│  │                               │ │
│  │  [      Entrar      ]         │ │
│  │                               │ │
│  │  ─── Ou use conta demo ───    │ │
│  │                               │ │
│  │  [Admin] [Professor]          │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  Autenticação integrada Supabase   │
└─────────────────────────────────────┘
```

---

## Notas de Implementação

### Para LLMs

**Ao implementar login**:
1. Sempre use Zod para validação de formulário
2. Implemente loading states em todas as operações async
3. Use toast notifications para feedback do usuário
4. Limpe erros ao usuário começar a digitar novamente
5. Desabilite botão durante loading
6. Trate erros de rede separadamente de erros de validação

**Pattern de erro handling**:
```typescript
try {
  // Validação
  // Operação
  // Sucesso
} catch (error) {
  if (error instanceof z.ZodError) {
    // Erro de validação
  } else if (error instanceof Error) {
    // Erro de operação
  }
} finally {
  // Cleanup (loading, etc)
}
```

---

## Histórico de Mudanças

| Data | Versão | Mudança |
|------|--------|---------|
| 2025-11-17 | 1.0 | Implementação inicial |

---

## Referências

- [Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Zod Validation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/) (alternativa futura)

---

**Arquivo de Implementação**: `src/components/Auth/LoginForm.tsx:40-83`
**Documentação da Feature**: [Autenticação](../../features/implemented/01-authentication.md)
