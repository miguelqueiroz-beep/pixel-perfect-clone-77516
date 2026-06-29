# 🤖 CLAUDE.md — Contrato Comportamental para IA

**Última atualização:** 2026-06-29

Este arquivo define como IAs devem se comportar ao trabalhar neste projeto.

---

## 🎯 Princípios Fundamentais

### 1. Documentação em Primeiro Lugar

Toda mudança de código deve ter documentação correspondente ATUALIZADA no mesmo PR/commit.

- [ ] Mudou rota? Atualize [[docs/Arquitetura/Estrutura-de-Pastas.md]]
- [ ] Mudou banco? Atualize [[docs/Arquitetura/Banco-de-Dados.md]] + crie migration
- [ ] Novo fluxo? Documente em [[docs/Fluxos/]]
- [ ] Mudou segurança? Atualize [[docs/Segurança/Modelo-de-Ameacas.md]]

**Regra:** SEM documentação = SEM merge.

---

### 2. Consulte o Mapa de Regressão

ANTES de fazer QUALQUER mudança significativa:

1. Abra [[docs/Arquitetura/Mapa-de-Regressão.md]]
2. Procure o módulo que vai mexer
3. Leia "O que quebra se eu mudar X?"
4. Teste os cenários listados
5. Se impacto é CRÍTICO ou ALTO, rode type-check + lint

**Regra:** ZERO commits sem consultar mapa.

---

### 3. Type Safety & Linting são Obrigatórios

```bash
npm run tsc --noEmit    # DEVE passar
npm run lint            # DEVE passar
npm run build           # DEVE passar
```

Sem exceções. Se não passar localmente, não mergeará em Lovable.

---

### 4. Arquivos Nunca Mexer (A Menos Que Documentado)

```
🚫 Sem motivo legítimo:
  - tsconfig.json
  - vite.config.ts
  - eslint.config.js
  - [src/integrations/supabase/auth-middleware.ts]
  - [supabase/migrations/] — nunca EDITAR, só CRIAR novo
  - [src/router.tsx] — mudanças extremamente cuidadosas
```

Se PRECISAR mexer, documente o por quê em [[docs/Pontos-em-Aberto.md]].

---

### 5. Variáveis de Ambiente NUNCA Expostas

```
❌ NUNCA comitar:
  - .env.local
  - Qualquer arquivo com SUPABASE_SECRET_KEY

❌ NUNCA colocar em código:
  - Secrets em string literals
  - API keys em comentários

✅ SEMPRE usar:
  - import.meta.env.VITE_* (client-side)
  - process.env.* (server-side)
  - Lovable painel para produção
```

---

## 📋 Checklist Pré-Commit

SEMPRE rodar ANTES de fazer commit:

```bash
# 1. Lint
npm run lint
# Deve passar SEM erros

# 2. Type-check
npm run tsc --noEmit
# Deve passar SEM erros

# 3. Build teste
npm run build
# Deve completar SEM erros

# 4. Rodar dev e testar fluxo crítico
npm run dev
# Abre http://localhost:5173
# Testa: Login → Dashboard → Criar transação → Saldo atualiza
# Se quebrou algo, FIX antes de commit

# 5. Status git
git status
# Deve mostrar APENAS arquivos desejados
# Se há .env.local ou node_modules, STOP!

# 6. Conventional Commits
git add .
git commit -m "feat(dashboard): adicionar gráfico mensal"
# Formato: type(scope): description (em português OK)
# Types: feat, fix, refactor, docs, test, chore, style

# 7. Push
git push origin feature/xyz
```

---

## 🚨 Red Flags — Nunca Fazer Isso

| Ação | Por quê | Alternativa |
|------|---------|-------------|
| `git push --force main` | Reescreve história no Lovable | `git revert HEAD`, new commit |
| Editar migration versionada | Quebra deploy | Criar nova migration |
| Colocar secret em .env.example | Expõe produção | Deixar vazio, documente em README |
| `npm install` sem atualizar package-lock.json | Versões flutuam | Sempre comitar package-lock.json |
| Assumir que browser `localStorage` é seguro | XSS pode roubar | Usar httpOnly cookies (futuro) |
| Ignorar erros RLS no query | Quebra silenciosamente | SEMPRE testar isolamento user-user |

---

## 🎯 Fluxo de Trabalho Esperado

### Novo Feature / Bug Fix

```
1. Crie branch: git checkout -b feature/xyz
2. LEIA [[docs/Pontos-em-Aberto.md]] — há decisão pendente?
3. CONSULTE [[docs/Arquitetura/Mapa-de-Regressão.md]] — impacto?
4. Código:
   ├─ type-check local (npm run tsc)
   ├─ lint (npm run lint)
   ├─ teste manual em http://localhost:5173
   └─ commit com Conventional Commits
5. Atualize DOCS (no mesmo commit/PR):
   ├─ [[docs/ÍNDICE.md]] se arquivo novo
   ├─ Arquivo específico (ex: [[docs/Fluxos/Contas-e-Transacoes.md]])
   └─ [[docs/Arquitetura/Mapa-de-Regressão.md]] se mudança crítica
6. PR + Review
7. Merge e auto-deploy via Lovable
```

### Schema/Banco Muda

```
1. PARE e consulte [[docs/Arquitetura/Banco-de-Dados.md]]
2. Crie NOVA migration (nunca edite versionada):
   touch supabase/migrations/20260629HHMMSS_change_description.sql
3. Escreva DDL (idempotente):
   ALTER TABLE ... ADD COLUMN ...;
   CREATE POLICY ... ON ...;
4. Regenerar TypeScript types:
   supabase gen types > src/integrations/supabase/types.ts
5. Atualize:
   ├─ [[docs/Arquitetura/Banco-de-Dados.md]]
   ├─ [[docs/Arquitetura/Mapa-de-Regressão.md]]
   └─ Queries React se novo campo
6. Commit + Push
```

### Segurança / Auth Muda

```
1. PAUSE — consulte [[docs/Segurança/Modelo-de-Ameacas.md]]
2. Consulte [[docs/Sistemas/Auth-e-Permissoes.md]]
3. Adicione teste de RLS se novo
4. Documente toda mudança em [[docs/Segurança/]]
5. Code review OBRIGATÓRIO antes de merge
6. Deploy mencionado em changelog
```

---

## 🔄 Processo de Review (IA ↔ Human)

Quando uma IA trabalha neste repo:

### IA envia mudança

```
1. Cria branch feature/xyz
2. Commits com mensagens descritivas
3. Atualizou documentação? ✅
4. Rodou lint + tsc? ✅
5. PR aberta com descrição clara
```

### Human revisa

```
1. Lê PR + documentação updated
2. Roda `npm run dev`, testa fluxo
3. Aprova ou pede mudanças
4. Merge
5. Lovable deploya automaticamente
```

### IA recebe feedback

```
Se Human pede mudanças:
1. Entenda a razão
2. Atualize código + docs
3. Resubmeta
4. Loop até aprovado
```

---

## 📚 Recursos Essenciais para IA

### Deve ler PRIMEIRO

1. [[docs/ÍNDICE.md]] — Sumário tudo
2. [[docs/Visão-Geral.md]] — O que é FinFlow
3. [[docs/Arquitetura/Visão-de-Arquitetura.md]] — Diagrama
4. [[docs/Arquitetura/Mapa-de-Regressão.md]] — Impacto de mudanças

### Antes de QUALQUER código

1. [[docs/Pontos-em-Aberto.md]] — Há decisão pendente?
2. [[docs/Arquitetura/Banco-de-Dados.md]] — Schema real
3. [[CLAUDE.md]] — Este arquivo

### Ao trabalhar em X

| Feature | Ler documentação |
|---------|-----------------|
| Autenticação | [[docs/Sistemas/Auth-e-Permissoes.md]] |
| Transações | [[docs/Fluxos/Contas-e-Transacoes.md]], [[docs/Sistemas/TransactionForm.md]] |
| Orçamentos | [[docs/Fluxos/Orcamentos-e-Metas.md]] |
| Banco dados | [[docs/Arquitetura/Banco-de-Dados.md]] |
| Deploy | [[docs/Operacao/Deploy.md]] |
| Segurança | [[docs/Segurança/Modelo-de-Ameacas.md]] |

---

## ✅ Checklist de Qualidade

Antes de declarar tarefa PRONTA:

- [ ] Código passou `npm run lint` sem erros?
- [ ] Código passou `npm run tsc --noEmit` sem erros?
- [ ] `npm run build` completou com sucesso?
- [ ] Testei manualmente em `npm run dev`?
- [ ] Teste o fluxo crítico que mudou?
- [ ] Se mudou DB, criei migration Nova (não editei versionada)?
- [ ] Se mudou API/tipos, regenerei types (`supabase gen types`)?
- [ ] Atualizei documentação correspondente?
- [ ] Commit segue [[docs/Visão-Geral.md#commits]] (Conventional Commits em pt-BR)?
- [ ] Nenhum secret em .env.local commitado?
- [ ] Consultei [[docs/Arquitetura/Mapa-de-Regressão.md]] por possíveis quebras?

**Se NÃO passou em qualquer checkbox:** NÃO faça push.

---

## 🔮 Decisões Pendentes (Para IA Considerar)

ANTES de trabalhar em:
- Parcelamentos → Leia Q2 em [[docs/Pontos-em-Aberto.md]]
- Moeda/conversão → Leia Q3 em [[docs/Pontos-em-Aberto.md]]
- Notificações → Leia Q4 em [[docs/Pontos-em-Aberto.md]]

Se tarefa envolve Q aberta: **PAUSE e confirme com human**.

---

## 🤝 Comunicação

Se IA precisa de decisão:

1. Abra issue em GitHub (ou documento)
2. Reference [[docs/Pontos-em-Aberto.md]]
3. Descreva o problema e opções
4. Aguarde feedback

---

## 🚀 Success Criteria

Feature completa quando:

- ✅ Código escrito e testado
- ✅ Lint + type-check passando
- ✅ Documentação atualizada
- ✅ PR aprovado por human
- ✅ Merged para main
- ✅ Lovable deployed para produção

---

## 📜 Histórico

| Data | Versão | Mudança |
|------|--------|---------|
| 2026-06-29 | 1.0 | Criação inicial |

---

**LEIA ESTE ARQUIVO TODA VEZ QUE INICIAR TRABALHO NESTE PROJETO**

Perguntas? Consulte [[docs/ÍNDICE.md]] ou [[docs/Pontos-em-Aberto.md]].
