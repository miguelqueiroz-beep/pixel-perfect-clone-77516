# 📂 Estrutura de Pastas

Guia completo de cada diretório, suas responsabilidades, convenções e o que não deve estar lá.

---

## 🎯 Mapa visual

```
pixel-perfect-clone-77516/
├── docs/                          # 📚 DOCUMENTAÇÃO (ESTE PROJETO)
│
├── src/                           # 💻 CÓDIGO-FONTE PRINCIPAL
│   ├── routes/                    # 🛣️ Rotas (TanStack Router file-based)
│   ├── components/                # 🧩 Componentes React
│   ├── hooks/                     # 🪝 React Hooks customizados
│   ├── lib/                       # 🛠️ Utilitários e helpers
│   ├── integrations/              # 🔗 Integrações externas
│   ├── styles.css                 # 🎨 Estilos globais (Tailwind)
│   ├── router.tsx                 # ⚙️ Configuração de roteamento
│   ├── server.ts                  # 🖥️ Servidor SSR
│   └── start.ts                   # 🚀 Entrada da app
│
├── supabase/                      # 🗄️ Banco de dados
│   ├── config.toml                # Configuração Supabase
│   └── migrations/                # SQL migrations (versionado)
│
├── public/                        # 📄 Assets estáticos (se houver)
│
├── node_modules/                  # 📦 Dependências (não comitar)
│
├── .git/                          # 📝 Git (não comitar)
│
├── package.json                   # 📋 Dependencies + scripts
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                 # Vite config
├── eslint.config.js               # Linter config
├── components.json                # Shadcn components config
├── bunfig.toml                    # Bun bundler (se usado)
├── .env.local                     # 🔐 Env vars locais (não comitar)
├── .env.example                   # Template de env vars (comitar)
├── .gitignore                     # Git ignore rules
├── AGENTS.md                      # Lovable agent configuration
├── PRD-FinFlow.md                 # Product Requirements Document
└── README.md                      # Project overview
```

---

## 📖 Descrição de cada pasta

### 🛣️ `src/routes/`

**Responsabilidade:** Roteamento da aplicação (TanStack Router).

**Arquivo:** Um arquivo por rota principal.

**Convenção:**
- Nomes em kebab-case: `dashboard.tsx`, `auth.tsx`
- Prefixo `_` para rotas protegidas (layout groups): `_authenticated/`
- Arquivo especial `__root.tsx` para root layout e error boundaries
- Cada arquivo exporta `const Route = createFileRoute(...)`

**Exemplo:**
```typescript
// src/routes/transactions.tsx
export const Route = createFileRoute('/_authenticated/transactions')({
  ssr: true,
  head: () => ({
    meta: [{ title: "Transações — FinFlow" }],
  }),
  component: TransactionsPage,
});
```

**❌ NÃO coloque aqui:**
- Lógica de estado (use hooks/context)
- Componentes reutilizáveis (use src/components/)
- Queries de banco (use src/lib/queries.ts)

---

### 🧩 `src/components/`

**Responsabilidade:** Componentes React reutilizáveis.

**Estrutura:**
```
components/
├── ui/                    # Radix UI + Shadcn (design system)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── page.tsx               # Layouts de página
└── transaction-form.tsx   # Componentes domain-specific
```

**Convenção:**
- Nomes em PascalCase: `TransactionForm.tsx`
- `ui/` = reusable, agnóstico de domínio
- Root = domain-specific (ex: TransactionForm é específico de transações)
- Props tipadas com TypeScript
- Prop drilling minimizado (use Context/Query para estado global)

**❌ NÃO coloque aqui:**
- Lógica de banco (use hooks da src/lib/queries.ts)
- Rotas (use src/routes/)
- Formatação de datas complexa (use src/lib/format.ts)

---

### 🪝 `src/hooks/`

**Responsabilidade:** React Hooks customizados para lógica compartilhada.

**Exemplos:**
- `use-current-user.ts` — Retorna usuário logado
- `use-mobile.tsx` — Detecta viewport mobile

**Convenção:**
- Nomes em kebab-case: `use-current-user.ts`
- Exportar função que retorna algo (hook pattern)
- Tipar inputs/outputs

**❌ NÃO coloque aqui:**
- Queries (use src/lib/queries.ts)
- Formatação (use src/lib/format.ts)
- Lógica de rota (use src/routes/)

---

### 🛠️ `src/lib/`

**Responsabilidade:** Utilitários, formatação, queries e helpers.

**Arquivos chave:**
- `queries.ts` — React Query hooks (`useAccounts`, `useTransactions`, etc.)
- `format.ts` — Formatação de datas, moedas, números
- `utils.ts` — Funções gerais reutilizáveis
- `error-page.ts` — Renderização de páginas de erro
- `error-capture.ts` — Captura de erros para logging
- `lovable-error-reporting.ts` — Envio de erros para Lovable

**Convenção:**
- Funções puras quando possível
- Tipar tudo (TypeScript)
- Nomear arquivo por domínio: `format.ts`, `queries.ts`

**❌ NÃO coloque aqui:**
- Componentes (use src/components/)
- Rotas (use src/routes/)

---

### 🔗 `src/integrations/`

**Responsabilidade:** Integrações com serviços externos (Supabase, APIs, etc.).

**Estrutura:**
```
integrations/
└── supabase/
    ├── client.ts           # Client-side Supabase
    ├── client.server.ts    # Server-side Supabase
    ├── auth-middleware.ts  # JWT validation middleware
    ├── auth-attacher.ts    # Attach user info to request
    └── types.ts            # TypeScript types (auto-gerado)
```

**Convenção:**
- Um arquivo por serviço/provider
- Exportar singleton quando apropriado (ex: `export const supabase = ...`)
- Tipar tudo com types

**⚠️ CUIDADO:**
- Não expor secrets em cliente (use client.ts com VITE_ prefixed env vars)
- Server-side usa SUPABASE_ env vars (sem VITE_)

---

### 🗄️ `supabase/`

**Responsabilidade:** Configuração e migrations do banco de dados.

**Estrutura:**
```
supabase/
├── config.toml            # Configuração (project_id, etc.)
└── migrations/
    ├── 20260626225917_*.sql   # Migration 1 (timestamp)
    └── 20260626225932_*.sql   # Migration 2 (timestamp)
```

**Convenção:**
- Migrations com prefixo timestamp ISO (YYYYMMDDHHMMSS)
- Um arquivo por migration (v1 = create tables, v2 = funções/policies)
- Migrations devem ser idempotentes quando possível
- Comentários explicando o que faz

**❌ NÃO coloque aqui:**
- Código TypeScript
- Lógica de aplicação

---

### 🎨 `src/styles.css`

**Responsabilidade:** Estilos globais (Tailwind + customizações).

**Convenção:**
- Usar Tailwind classes (não escrever CSS custom quando possível)
- CSS custom para cores/tokens do design system
- @import de fontes e plugins

---

### 🖥️ `src/server.ts` + `src/start.ts`

**Responsabilidade:** Entry points da aplicação.

- `start.ts` — Inicia o app (browser entry)
- `server.ts` — SSR handler (servidor entry)

**Não mexer sem motivo.** Ambos já vêm configurados pelo TanStack Start.

---

### 📋 Arquivo: `tsconfig.json`

**Responsabilidade:** Configuração TypeScript.

**Importante:**
- `strict: true` — Type checking rigoroso ✅
- `paths: { "@/*": ["./src/*"] }` — Alias @ para imports

**Não mudar sem necessidade.**

---

### 🚀 Arquivo: `vite.config.ts`

**Responsabilidade:** Build config (Vite).

**Já incluído pelo Lovable:**
- TanStack Start plugin
- React plugin
- Tailwind plugin
- tsconfig paths

**Não adicionar plugins manualmente.**

---

### 📦 Arquivo: `package.json`

**Responsabilidade:** Dependências e scripts.

**Scripts importantes:**
```json
{
  "scripts": {
    "dev": "vite dev",           // Dev server
    "build": "vite build",       // Build prod
    "preview": "vite preview",   // Preview build
    "lint": "eslint .",          // Linter
    "format": "prettier --write ." // Formatar código
  }
}
```

**Adicionar dependências com:**
```bash
npm install <package>
npm install --save-dev <package>  # devDependency
```

---

## 🎯 Convenções de nomenclatura

| O que | Padrão | Exemplo |
|------|--------|---------|
| Arquivo de rota | kebab-case | `dashboard.tsx`, `_authenticated/` |
| Componente React | PascalCase | `TransactionForm.tsx` |
| Hook customizado | kebab-case com `use-` | `use-current-user.ts` |
| Arquivo utilitário | kebab-case | `format.ts`, `queries.ts` |
| Variável JS | camelCase | `currentUser`, `isLoading` |
| Constante | UPPER_SNAKE_CASE | `MAX_AMOUNT`, `DEFAULT_CURRENCY` |
| Tipo TypeScript | PascalCase | `type Transaction`, `interface User` |
| Banco: tabelas | snake_case plural | `transactions`, `accounts` |
| Banco: colunas | snake_case | `user_id`, `created_at` |
| Banco: índices | `{tabela}_{colunas}_idx` | `transactions_user_date_idx` |

---

## 🚨 Armadilhas

### 1. Colocar .env vars sem VITE_
```javascript
// ❌ ERRADO (não acessível em browser)
const url = process.env.SUPABASE_URL;

// ✅ CERTO (acessível em browser)
const url = import.meta.env.VITE_SUPABASE_URL;
```

### 2. Duplicar queries em vários componentes
```javascript
// ❌ ERRADO
// Em ComponentA.tsx
const { data } = useQuery({ queryKey: ['accounts'], ... });

// Em ComponentB.tsx
const { data } = useQuery({ queryKey: ['accounts'], ... }); // DUP!

// ✅ CERTO
// Em lib/queries.ts
export function useAccounts() { ... }

// Em qualquer componente
import { useAccounts } from '@/lib/queries';
const { data } = useAccounts();
```

### 3. Importar tipos de client.ts no servidor
```javascript
// ❌ ERRADO (expõe client env vars)
// em server.ts
import { supabase } from '@/integrations/supabase/client';

// ✅ CERTO (use client.server.ts)
// em server.ts
import { supabase } from '@/integrations/supabase/client.server';
```

---

## 📚 Relacionado

- **Visão de Arquitetura:** [[Visão-de-Arquitetura.md]]
- **Banco de Dados:** [[Banco-de-Dados.md]]
- **Mapa de Regressão:** [[Mapa-de-Regressão.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
