# 👁️ Visão Geral do FinFlow

**FinFlow** é uma plataforma de gestão financeira pessoal web que permite usuários controlar receitas, despesas, metas e orçamentos com clareza visual em tempo real.

---

## 🎯 Objetivo do produto

Fornecer uma visão clara e intuitiva da situação financeira do usuário, permitindo:
- ✅ Acompanhar receitas e despesas
- ✅ Identificar padrões de consumo
- ✅ Controlar gastos via orçamentos
- ✅ Acompanhar metas financeiras
- ✅ Tomar decisões informadas sobre dinheiro

---

## 🌍 Público-Alvo

- **Perfil primário:** Pessoas (18–65 anos) que querem organizar finanças pessoais
- **Simplicidade para:** Iniciantes em controle financeiro
- **Profundidade para:** Usuários avançados com múltiplas contas e metas

---

## 📊 Stack Resumida

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React | 19.2.0 |
| **Roteamento** | TanStack Router | 1.170.16 |
| **Estado/Query** | TanStack Query + React Query | 5.101.1 |
| **Estilo** | Tailwind CSS | 4.2.1 |
| **Componentes UI** | Radix UI + Shadcn | Latest |
| **Formulários** | React Hook Form | 7.71.2 |
| **Validação** | Zod | 3.24.2 |
| **TypeScript** | TypeScript | 5.8.3 |
| **Build** | Vite | 8.0.16 |
| **SSR** | TanStack Start + Nitro | 1.168.26 |
| **Backend** | Node.js (Cloudflare Workers) | N/A |
| **Database** | Supabase (PostgreSQL 14.5) | v14.5 |
| **Auth** | Supabase Auth | JWT |
| **Gráficos** | Recharts | 2.15.4 |
| **Notificações** | Sonner | 2.0.7 |
| **Deploy** | Lovable Cloud + GitHub | N/A |

---

## 📱 Funcionalidades principais

### 1️⃣ **Autenticação & Onboarding**
- Signup com e-mail + senha (Supabase Auth)
- Onboarding guiado: nome, moeda, renda, objetivos, despesas estimadas
- Login automático com JWT

### 2️⃣ **Contas**
- Tipos: Checking, Savings, Wallet, Credit Card, Investment, Other
- Saldo inicial, limite de crédito, ícone, cor
- Arquivar (soft-hide, não deleta)

### 3️⃣ **Transações**
- Tipo: Receita ou Despesa
- Categorias (income, expense, both)
- Parcelamentos (installments)
- Tags e notas
- Status: Paid ou Pending
- Data de transação
- Métodos de pagamento: cash, debit, credit, pix, bank_slip, transfer

### 4️⃣ **Categorias**
- Criadas por usuário ou sistema (is_system=true)
- Tipos: income, expense, ambas
- Ícone e cor

### 5️⃣ **Orçamentos**
- Mensal e global (general scope)
- Por categoria específica
- Limite de gasto
- Monitorar ultrapassagem

### 6️⃣ **Metas Financeiras**
- Nome, valor alvo, deadline, prioridade
- Status: active, completed, archived
- Progresso visual

### 7️⃣ **Dashboard & Relatórios**
- Visão consolidada de saldos
- Gráficos de receita vs despesa (Recharts)
- Alertas de orçamentos ultrapassados
- Filtros por data, categoria, conta

---

## 🏗️ Arquitetura de alto nível

```
┌─────────────────────────────────────────────────────────────┐
│                       BROWSER (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  Transações  │  │   Budgets    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↑                ↑                    ↑              │
│  TanStack Router / TanStack Query (caching)                │
│         ↓                ↓                    ↓              │
├─────────────────────────────────────────────────────────────┤
│          SSR Layer (TanStack Start + Nitro)                │
│  - Middleware de autenticação (Supabase token validation)  │
│  - Error handling & logging                                 │
├─────────────────────────────────────────────────────────────┤
│              Supabase (PostgreSQL + RLS)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ profiles │ │ accounts │ │categories│ │   txs    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐                                 │
│  │ budgets  │ │  goals   │                                 │
│  └──────────┘ └──────────┘                                 │
│  - Realtime subscriptions (websocket)                      │
│  - Row-level security policies                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo principal

```
1. Novo usuário
   ↓
2. Signup (e-mail + password)
   ↓
3. Onboarding (nome, moeda, renda, objetivos)
   ↓
4. Dashboard (visão de saldos)
   ↓
5. Criar/editar transações
   ↓
6. Monitorar orçamentos & metas
   ↓
7. Relatórios & análise
```

---

## 🔐 Modelo de Segurança

- **RLS (Row-Level Security):** Cada usuário vê APENAS seus dados
- **JWT:** Token Supabase, validado server-side
- **Isolated:** user_id em cada tabela, impossível vazamento cross-user

---

## 📐 Convenções e Padrões

### Commits
Usar **Conventional Commits** em português:
```
feat(transacoes): adicionar suporte a parcelamentos
fix(auth): corrigir refresh token expirado
docs(README): atualizar instruções de setup
refactor(queries): melhorar performance de useTransactions
test(categories): adicionar testes unitários
```

### Branches
- `main` → produção (Lovable deploy)
- `develop` → staging
- `feature/*` → novas funcionalidades
- `hotfix/*` → correções urgentes

### Coding Style
- TypeScript strict mode sempre
- Components em PascalCase: `TransactionForm.tsx`
- Hooks customizados em camelCase: `useCurrentUser.ts`
- Tipos em `types.ts` ou inline com `type/interface`
- Zod schemas perto do uso

### Database Naming
- Tabelas: snake_case, plural: `transactions`, `accounts`
- Colunas: snake_case: `created_at`, `user_id`
- Índices: `{table}_{columns}_idx`: `transactions_user_date_idx`
- Policies: descritivas: `"own accounts all"`

---

## 🚨 Armadilhas conhecidas

1. **Parcelamentos sem tabela central** → `installment_group_id` agrupa, sem FK central
2. **Moeda global** → Muda toda em `profiles.currency`, histórico fica na moeda antiga
3. **Soft-delete de transações** → `deleted_at` field, contas NÃO têm soft-delete
4. **Categorias system** → Imutáveis (`is_system=true`), precisam seeding
5. **Lovable deploy** → Force-push reescreve histórico, evitar!

---

## 📚 Documentação relacionada

- **Setup:** [[Operacao/Setup-Local.md]]
- **Arquitetura:** [[Arquitetura/Visão-de-Arquitetura.md]]
- **Banco de dados:** [[Arquitetura/Banco-de-Dados.md]]
- **Segurança:** [[Segurança/Modelo-de-Ameacas.md]]

---

## 📊 Métricas importantes

- **Usuários típicos:** Acompanham ~5–50 transações/mês
- **Performance:** Carregamento dashboard < 1s (com cache)
- **Uptime:** Meta 99.9% (Lovable + Supabase SLA)
- **Tempo de onboarding:** < 3 min até dashboard

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
