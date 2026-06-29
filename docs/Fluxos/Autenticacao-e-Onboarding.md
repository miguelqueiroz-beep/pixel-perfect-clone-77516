# 🔄 Autenticação e Onboarding

Fluxo completo de signup, login e onboarding do usuário.

---

## 📊 Diagrama de Fluxo

```mermaid
graph TD
    A["👤 Novo Usuário"] --> B["Acessa /<br/>Landing"]
    B --> C{"Logado?"}
    C -->|Não| D["Clica 'Entrar'"]
    C -->|Sim| E["Redireciona<br/>/dashboard"]
    
    D --> F{Tem conta?}
    F -->|Não| G["Signup:<br/>Nome + Email + Senha"]
    F -->|Sim| H["Login:<br/>Email + Senha"]
    
    G --> G1["Validação Zod<br/>(nome min 2 chars,<br/>email válido,<br/>senha min 8)"]
    G1 --> G2{Válido?}
    G2 -->|Não| G3["❌ Mostra erro<br/>inline"]
    G3 --> G1
    G2 -->|Sim| G4["POST /auth/signup<br/>Supabase Auth"]
    G4 --> G5{Success?}
    G5 -->|Error| G6["❌ Email já existe<br/>ou erro servidor"]
    G6 --> G1
    G5 -->|Success| G7["✅ Usuário criado<br/>Profile criado"]
    
    H --> H1["Validação Zod<br/>(email, senha)"]
    H1 --> H2{Válido?}
    H2 -->|Não| H3["❌ Mostra erro"]
    H3 --> H1
    H2 -->|Sim| H4["POST /auth/signin<br/>Supabase Auth"]
    H4 --> H5{Success?}
    H5 -->|Error| H6["❌ Email/senha<br/>incorretos"]
    H6 --> H1
    H5 -->|Success| H7["✅ JWT salvo<br/>localStorage"]
    
    G7 --> I["Redireciona<br/>/auth (login)"]
    H7 --> J{onboarding_<br/>completed?}
    
    I --> H
    J -->|Não| K["Onboarding<br/>Step 1/5"]
    J -->|Sim| E
    
    K --> K1["📝 Step 1:<br/>Full Name + Avatar"]
    K1 --> K2["📝 Step 2:<br/>Currency + Main Income"]
    K2 --> K3["📝 Step 3:<br/>Income Day"]
    K3 --> K4["📝 Step 4:<br/>Financial Goals"]
    K4 --> K5["📝 Step 5:<br/>Estimated Expenses"]
    K5 --> K6["✅ Atualiza profile<br/>onboarding_completed = true"]
    K6 --> E
    
    E --> L["🏠 Dashboard<br/>Mostra saldos"]
```

---

## 🔐 Sequência Detalhada: Signup

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant AuthForm as Auth Form<br/>(signup)
    participant Zod as Validação<br/>(Zod)
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL
    
    Browser->>AuthForm: Preenche formulário
    AuthForm->>Zod: Valida schema
    Zod-->>AuthForm: {valid: true/false, errors}
    
    alt Inválido
        AuthForm-->>Browser: ❌ Mostra erro inline
    else Válido
        AuthForm->>Supabase: POST /auth/v1/signup {email, password, metadata}
        Supabase->>DB: INSERT auth.users
        DB-->>Supabase: ✓ Criado
        Supabase->>DB: INSERT profiles (via trigger)
        DB-->>Supabase: ✓ Criado
        Supabase-->>AuthForm: {user, session}
        AuthForm->>Browser: localStorage.setItem('jwt', token)
        AuthForm-->>Browser: ✅ Toast sucesso
        Browser-->>Browser: Redireciona /auth (login)
    end
```

---

## 🔐 Sequência Detalhada: Login

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant AuthForm as Auth Form<br/>(login)
    participant Zod as Validação
    participant Server as SSR Server
    participant Auth as Auth Middleware
    participant Supabase as Supabase Auth
    
    Browser->>AuthForm: Preenche e/senha
    AuthForm->>Zod: Valida
    
    alt Inválido
        Zod-->>AuthForm: Erro
        AuthForm-->>Browser: ❌ Mostra erro
    else Válido
        AuthForm->>Server: POST /auth/signin {email, password}
        Server->>Supabase: signInWithPassword()
        Supabase-->>Server: {session: {access_token, ...}}
        Server->>Browser: localStorage.setItem('jwt', token)
        Server-->>Browser: ✅ Toast + Redireciona
        Browser->>Server: GET /dashboard
        Server->>Auth: Validar JWT header
        Auth->>Supabase: Verificar token
        Supabase-->>Auth: ✓ Válido (sub = user_id)
        Auth-->>Server: ✓ Autenticado
        Server-->>Browser: 🏠 Dashboard renderizado
    end
```

---

## 🎯 Fluxo de Onboarding (Passo a passo)

### Step 1: Full Name + Avatar

**Tela:**
```
┌──────────────────────────────┐
│   Bem-vindo ao FinFlow!      │
│                              │
│  Qual é seu nome?            │
│  [________________]          │
│                              │
│  Foto de perfil (opcional)   │
│  [Escolher arquivo]          │
│                              │
│  [Próximo →]  [Pular]        │
└──────────────────────────────┘
```

**Validações:**
- Nome: mín 2 chars, máx 80
- Foto: JPEG/PNG, máx 5MB (salva em Supabase Storage)

**Ação:** UPDATE profiles SET full_name, avatar_url, onboarding_step=2

---

### Step 2: Currency + Main Income

**Tela:**
```
┌──────────────────────────────┐
│   Sua moeda e renda          │
│                              │
│  Que moeda você usa?         │
│  [Dropdown: BRL, USD, EUR]   │
│                              │
│  Qual sua renda mensal?      │
│  [____________] BRL          │
│                              │
│  [← Anterior] [Próximo →]    │
└──────────────────────────────┘
```

**Validações:**
- Currency: lista pré-definida
- Main income: número positivo (opcional)

**Ação:** UPDATE profiles SET currency, main_income, onboarding_step=3

---

### Step 3: Income Day

**Tela:**
```
┌──────────────────────────────┐
│   Quando você recebe?        │
│                              │
│  Dia do recebimento          │
│  [Slider: 1 - 31]   Dia 5    │
│                              │
│  [← Anterior] [Próximo →]    │
└──────────────────────────────┘
```

**Validações:**
- Day: 1–31
- Default: 1

**Ação:** UPDATE profiles SET income_day, onboarding_step=4

---

### Step 4: Financial Goals

**Tela:**
```
┌──────────────────────────────┐
│   Seus objetivos             │
│                              │
│  Quais são seus objetivos?   │
│  ☐ Poupar para viagem        │
│  ☐ Emergência (3 meses)      │
│  ☐ Investir                  │
│  ☐ Aposentadoria             │
│                              │
│  [← Anterior] [Próximo →]    │
└──────────────────────────────┘
```

**Validações:**
- Deve selecionar pelo menos 1

**Ação:** UPDATE profiles SET financial_goals, onboarding_step=5

---

### Step 5: Estimated Monthly Expenses

**Tela:**
```
┌──────────────────────────────┐
│   Suas despesas              │
│                              │
│  Gasto mensal estimado       │
│  [____________] BRL          │
│                              │
│  Usar orçamentos?            │
│  ◉ Sim  ○ Não                │
│                              │
│  [← Anterior] [Concluir]     │
└──────────────────────────────┘
```

**Validações:**
- Número positivo (opcional)

**Ação:** UPDATE profiles SET estimated_monthly_expenses, use_budget, onboarding_completed=true, onboarding_step=0

---

## 🔒 Segurança: Fluxo de JWT

```
1. User faz login → Supabase retorna JWT
2. App salva em localStorage (com persistSession=true)
3. A cada requisição, header Authorization: Bearer <JWT>
4. SSR middleware valida JWT:
   - Decodifica (sem verify, é assinado por Supabase)
   - Extrai sub (user_id)
   - Passa para queries RLS
5. RLS verifica auth.uid() vs user_id
6. Se token expirado → refresh automático (via Supabase)
```

**⚠️ Nota:** localStorage não é super seguro (XSS pode roubar token).  
Mitigação: CSP, sanitizar inputs, usar httpOnly cookies (futuro).

---

## ⚠️ Fluxos alternativos

### Erro: Email já existe

```
Usuário A tenta signup com email que já existe
          ↓
Supabase retorna erro 400
          ↓
App mostra: "E-mail já está registrado. [Faça login]"
          ↓
Usuário clica link → Página de login
```

### Erro: Senha fraca

```
Usuário tenta senha com 5 caracteres
          ↓
Zod valida (min 8)
          ↓
App mostra inline: "Senha deve ter mín 8 caracteres"
          ↓
Usuário corrige e tenta novamente
```

### Usuário esqueceu senha (Futuro)

```
Na página de login, link "Esqueceu a senha?"
          ↓
Usuário entra email
          ↓
Supabase envia link de reset
          ↓
Usuário clica link no e-mail
          ↓
Redireciona para /auth/reset-password?token=xxx
          ↓
Usuário define nova senha
          ↓
Login com nova senha
```

**Status:** ⚠️ Não implementado ainda

---

## 📊 Estados possíveis durante fluxo

| Estado | Descrição | Ação |
|--------|-----------|------|
| `loading` | Enviando dados para Supabase | Desabilitar botão submit |
| `error` | Erro na requisição | Mostrar mensagem, permitir retry |
| `success` | Onboarding concluído | Redirecionar /dashboard |
| `validating` | Validando Zod schema | Mostrar erros inline |

---

## 🧪 Teste: Checklist

- [ ] Signup com nome/email/senha válidos → cria usuário?
- [ ] Signup com email duplicado → erro "já existe"?
- [ ] Signup com senha < 8 chars → erro inline?
- [ ] Login com email/senha corretos → acessar dashboard?
- [ ] Login com senha errada → erro "incorretos"?
- [ ] Logout → localStorage limpo, redirecionado /auth?
- [ ] Onboarding Step 1 completo → Step 2 acessível?
- [ ] Pular Step → ainda avança?
- [ ] Voltar em Step → dados permanecem?
- [ ] Concluir onboarding → onboarding_completed=true?
- [ ] Recarregar página durante onboarding → mantém step?
- [ ] Já logado, acessa /auth → redireciona /dashboard?

---

## 📚 Relacionado

- **Banco de Dados:** [[../Arquitetura/Banco-de-Dados.md]]
- **Auth & Permissões:** [[../Sistemas/Auth-e-Permissoes.md]]
- **Arquivo auth.tsx:** [[../../src/routes/auth.tsx]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
