# 🗺️ Mapa de Regressão

Matriz de impacto: "Se eu mudar X, o que quebra?"

**Use este documento ANTES de qualquer alteração significativa.**

---

## 📊 Tabela de Impacto

### 🔴 CRÍTICO (impacta múltiplos sistemas)

| Mudança | Arquivos afetados | Testes necessários | Risco |
|---------|-------------------|-------------------|-------|
| **Alterar `auth.users.id` ou geração UUID** | [src/integrations/supabase/auth-middleware.ts](../src/integrations/supabase/auth-middleware.ts), [src/lib/queries.ts](../src/lib/queries.ts), todas as queries | type-check, E2E auth | ❌ NUNCA mexer |
| **Remover RLS policy de any tabela** | [supabase/migrations/](../../supabase/migrations/), [src/lib/queries.ts](../src/lib/queries.ts) | Testar isolamento user-user | 🔥 Quebra segurança |
| **Alterar `profiles.currency` para array/objeto** | [src/lib/format.ts](../src/lib/format.ts), [src/components/](../src/components/), todos os gráficos | Renderizar app inteira, gráficos | 🔥 Quebra moeda global |
| **Deletar campo `user_id` de any tabela** | [src/lib/queries.ts](../src/lib/queries.ts), RLS policies | Type-check, E2E crud | 🔥 Quebra RLS |
| **Mudar tipo de `amount` para INTEGER** | [src/lib/queries.ts](../src/lib/queries.ts), [src/lib/format.ts](../src/lib/format.ts), cálculos | Testes de precisão (centavos) | 🔥 Perde precisão |

---

### 🟠 ALTO (quebra funcionalidade principal)

| Mudança | Arquivos afetados | Testes necessários | Risco |
|---------|-------------------|-------------------|-------|
| **Alterar schema `transactions` (adicionar/remover coluna)** | [src/lib/queries.ts](../src/lib/queries.ts), [src/components/transaction-form.tsx](../src/components/transaction-form.tsx), [supabase/migrations/](../../supabase/migrations/) | Crud transações, formulário, dashboard | ⚠️ Requer migration |
| **Mudar RLS de `transactions` de `auth.uid() = user_id` para outra** | [src/lib/queries.ts](../src/lib/queries.ts), queries | Testar isolamento, E2E | ⚠️ Quebra segurança se errado |
| **Remover ou renomear índice `tx_user_date_idx`** | [supabase/migrations/](../../supabase/migrations/), performance queries | Benchmark listagem transações | ⚠️ Performance degrada |
| **Alterar lógica de parcelamentos (installment_group_id)** | [src/components/transaction-form.tsx](../src/components/transaction-form.tsx), [src/lib/queries.ts](../src/lib/queries.ts) | CRUD parcelamentos, edição | ⚠️ Integridade de dados |
| **Mudar structure de `tags` de array para JSON** | [src/lib/queries.ts](../src/lib/queries.ts), [src/lib/format.ts](../src/lib/format.ts) | Filtro por tags, dashboard | ⚠️ Requer migration + rebuild |

---

### 🟡 MÉDIO (afeta feature/módulo)

| Mudança | Arquivos afetados | Testes necessários | Risco |
|---------|-------------------|-------------------|-------|
| **Adicionar campo a `profiles`** | [src/routes/auth.tsx](../src/routes/auth.tsx), [src/routes/_authenticated/settings.tsx](../src/routes/_authenticated/settings.tsx) | Onboarding, settings | ✅ Requer migration |
| **Adicionar nova tipo de account (ex: cripto)** | [src/components/](../src/components/), queries | Criar conta, listar | ✅ Requer seed |
| **Alterar `notifications_enabled` → `notification_preferences` (JSON)** | [src/routes/_authenticated/settings.tsx](../src/routes/_authenticated/settings.tsx), onboarding | Settings page | ✅ Requer migration |
| **Renomear rota `/transactions` → `/expenses`** | [src/routes/_authenticated/transactions.tsx](../src/routes/_authenticated/transactions.tsx), links | Links, navegação | ✅ Atualizar router e wikilinks |
| **Adicionar nova table `audit_log`** | [supabase/migrations/](../../susupabase/migrations/), [src/lib/queries.ts](../src/lib/queries.ts) | Nenhum (adiciona feature) | ✅ Neutro |
| **Adicionar tabelas `customers` e `customer_addresses`** | [supabase/migrations/](../../supabase/migrations/), [docs/Arquitetura/Banco-de-Dados.md](../Arquitetura/Banco-de-Dados.md) | Migration, RLS, consultas futuras | ✅ Feature nova |

---

### 🟢 BAIXO (isolado/cosmético)

| Mudança | Arquivos afetados | Testes necessários | Risco |
|---------|-------------------|-------------------|-------|
| **Alterar cor padrão de accounts (#10B981 → #3B82F6)** | [src/components/](../src/components/), CSS | Visual | ✅ Visualmente |
| **Renomear componente `TransactionForm` → `TransactionEditor`** | [src/routes/](../src/routes/), imports | Type-check | ✅ Refactor simples |
| **Adicionar novo ícone Lucide** | [src/components/](../src/components/) | Renderizar | ✅ Sem quebra |
| **Atualizar mensagens de erro** | [src/lib/error-page.ts](../src/lib/error-page.ts), [src/routes/__root.tsx](../src/routes/__root.tsx) | Manual | ✅ Cosmético |

---

## 🎯 Módulos críticos — Ler antes de tocar

### 1. [src/integrations/supabase/auth-middleware.ts](../src/integrations/supabase/auth-middleware.ts)
**O que faz:** Valida JWT em toda requisição servidor.  
**Se quebrar:** Qualquer rota protegida retorna 401.  
**Teste:** `npm run dev`, tenta acessar /dashboard sem login → deve redirecionar.

### 2. [src/lib/queries.ts](../src/lib/queries.ts)
**O que faz:** React Query hooks (useAccounts, useTransactions, etc).  
**Se quebrar:** Dados não carregam, dashboards vazios.  
**Teste:** `npm run dev`, dashboard carrega? Transações aparecem?

### 3. [supabase/migrations/](../../supabase/migrations/)
**O que faz:** Schema do banco.  
**Se quebrar:** Queries não rodam, RLS quebra.  
**Teste:** `supabase db pull`, schema conferido?

### 4. [src/components/transaction-form.tsx](../src/components/transaction-form.tsx)
**O que faz:** Formulário de criar/editar transações.  
**Se quebrar:** Usuário não consegue registrar gastos/receitas.  
**Teste:** Criar transação, verificar se salva.

### 5. [src/routes/_authenticated/](../src/routes/_authenticated/)
**O que faz:** Layout + rotas protegidas.  
**Se quebrar:** Qualquer rota pode virar public (segurança).  
**Teste:** Logout, tenta acessar /dashboard → redireciona a /auth.

---

## 🔀 Fluxos de impacto (Exemplos)

### Exemplo 1: Adicionar campo ao `profiles`

```
User action: "Adicionar campo preference_language"
         ↓
1. Migration: ALTER TABLE profiles ADD COLUMN preference_language TEXT DEFAULT 'pt-BR';
   Files: supabase/migrations/20260630HHMMSS_add_language.sql
         ↓
2. TypeScript types: Rodar supabase gen types, atualiza src/integrations/supabase/types.ts
   Files: (auto-gerado)
         ↓
3. Update RLS: Nenhuma mudança (coluna é do usuário)
         ↓
4. Frontend: Adicionar field em Settings + Onboarding
   Files: src/routes/_authenticated/settings.tsx, src/routes/auth.tsx
         ↓
5. Query: Não precisa (SELECT * já inclui nova coluna)
         ↓
Test: npm run dev, Settings → Language selector, verificar se salva
```

### Exemplo 2: Mudar de `tags` (array) para `tags` (JSON object)

```
User action: "Tags com metadata (cor, label)"
         ↓
1. Migration: ALTER TABLE transactions ALTER COLUMN tags SET DATA TYPE jsonb USING to_jsonb(tags);
   Files: supabase/migrations/20260630HHMMSS_tags_jsonb.sql
         ↓
2. TypeScript types: Regenerate (tag: Tag[] → tag: {id, label, color}[])
         ↓
3. Update RLS: Nenhuma mudança (ainda é coluna user-owned)
         ↓
4. Frontend: Atualizar componente de tags
   Files: src/components/transaction-form.tsx, queries
         ↓
5. Query: Ajustar filtro de tags (GIN sobre JSON)
   Files: src/lib/queries.ts (filter por jsonb_agg)
         ↓
Test: npm run dev, criar tx com tags, listar, filtrar
Lint: npm run lint, npm run tsc (type-check)
```

### Exemplo 3: Deletar `accounts.is_archived`

```
User action: "Deletar contas definitivamente"
         ↓
1. Migration: ALTER TABLE accounts DROP COLUMN is_archived;
   Files: supabase/migrations/20260630HHMMSS_remove_is_archived.sql
   ⚠️ CUIDADO: Perde histórico de contas arquivadas!
         ↓
2. TypeScript types: Regenerate (is_archived desaparece)
         ↓
3. Frontend: Remover lógica de "Arquivar"
   Files: src/routes/_authenticated/accounts.tsx, componentes
         ↓
4. Query: Remover filtro is_archived=false
   Files: src/lib/queries.ts
         ↓
Test: npm run dev, tentar arquivar conta → não aparece option
```

---

## ✅ Checklist antes de deployar

- [ ] Executei `npm run lint` sem erros?
- [ ] Executei `npm run tsc --noEmit` com sucesso?
- [ ] Rodei `npm run dev`, testei fluxo crítico?
- [ ] Se banco mudou, criei migration em `supabase/migrations/`?
- [ ] Se adicionei coluna, regenerei types: `supabase gen types`?
- [ ] Se alterei query, testei que dados vêm correto?
- [ ] Se RLS mudou, testei isolamento user-user?
- [ ] Atualizei docs correspondentes?
- [ ] Commitei com Conventional Commits em pt-BR?

---

## 🚨 Armadilhas

### Não rodar `npm run lint` + `tsc` antes de commit
→ Build quebra no Lovable, rollback automático.

### Mudar migrations versionadas (não fazer!)
```
❌ ERRADO: Editar 20260626225917_*.sql depois que foi pushed
✅ CERTO: Criar nova migration 20260630HHMMSS_fix_*.sql
```

### Confundir env vars client vs server
```
❌ ERRADO em server.ts:
const url = import.meta.env.VITE_SUPABASE_URL; // undefined!

✅ CERTO:
const url = process.env.SUPABASE_URL;
```

### Deletar dado sem soft-delete
```
❌ ERRADO: DELETE FROM transactions WHERE id = 'xxx';
           (não há como recuperar)

✅ CERTO: UPDATE transactions SET deleted_at = now() WHERE id = 'xxx';
          (soft-delete, dados ainda recuperáveis)
```

---

## 📞 Escalação

**Tenho dúvida sobre impacto de X:**
1. Procure a mudança nesta tabela
2. Siga a coluna "Arquivos afetados"
3. Se CRÍTICO: converse com o time antes
4. Se ALTO: rode type-check + lint antes de pushar
5. Se MÉDIO/BAIXO: proceda com cuidado

---

## 📚 Relacionado

- **Banco de Dados:** [[Banco-de-Dados.md]]
- **Estrutura de Pastas:** [[Estrutura-de-Pastas.md]]
- **Visão de Arquitetura:** [[Visão-de-Arquitetura.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29  
**Use antes de ANY deploy!**
