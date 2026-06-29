# 📚 FinFlow — Índice da Documentação

**Última atualização:** 2026-06-29  
**Stack:** React 19 • TypeScript 5.8 • TanStack Start • Supabase • Tailwind  
**Linguagem:** Português (Brasil)

---

## 🎯 Comece por aqui

1. **[[Visão-Geral.md]]** — O que é FinFlow, propósito, stack resumida e glossário
2. **[[Arquitetura/Visão-de-Arquitetura.md]]** — Diagrama de componentes e decisões arquiteturais
3. **[[../DESIGN.md]]** — Sistema de Design completo: cores, tipografia, componentes, espaçamento
4. **[[../DESIGN-AUDIT.md]]** — Análise visual detalhada + recomendações de melhoria imediata

---

## 📂 Documentação por seção

### 🏗️ Arquitetura (Como tudo se conecta)
- **[[Arquitetura/Visão-de-Arquitetura.md]]** — Diagrama componentes (Mermaid) + fluxo de dados
- **[[Arquitetura/Estrutura-de-Pastas.md]]** — Guia: cada pasta, sua responsabilidade, convenções
- **[[Arquitetura/Banco-de-Dados.md]]** — Schema ER (Mermaid) + descrição tabelas + índices críticos
- **[[Arquitetura/Integrações-Externas.md]]** — Supabase, Lovable, contratos de API
- **[[Arquitetura/Mapa-de-Regressão.md]]** — Matriz de impacto: "Se mudar X, quebra Y?"
- **[[Arquitetura/Variáveis-de-Ambiente.md]]** — Cada env var: função, valores, staging vs prod

### 🔄 Fluxos (Narrativas de negócio)
- **[[Fluxos/Autenticacao-e-Onboarding.md]]** — Signup, login, onboarding em passos (Mermaid + texto)
- **[[Fluxos/Contas-e-Transacoes.md]]** — Criar contas, registrar transações, parcelamentos
- **[[Fluxos/Orcamentos-e-Metas.md]]** — Definir orçamentos, acompanhar metas
- **[[Fluxos/Calculo-de-Saldos.md]]** — Como saldos são calculados em tempo real

### ⚙️ Sistemas (Referência técnica profunda)
- **[[Sistemas/Auth-e-Permissoes.md]]** — RLS, JWT, model autenticação
- **[[Sistemas/TransactionForm.md]]** — Componente crítico: validações, fluxo, edge cases
- **[[Sistemas/Queries-React.md]]** — useAccounts, useCategories, useBudgets, etc.
- **[[Sistemas/Formatacao-e-Conversoes.md]]** — Datas, moedas, timezone, número

### 🔒 Segurança
- **[[Segurança/Modelo-de-Ameacas.md]]** — RLS review, isolamento de dados, secrets, PII

### 🚀 Operação
- **[[Operacao/Setup-Local.md]]** — Como rodar projeto localmente, seeds, dependências
- **[[Operacao/Deploy.md]]** — Build, deploy, Lovable Cloud, staging vs prod, rollback

### ⚠️ Problemas & Pontos em aberto
- **[[Pontos-em-Aberto.md]]** — 10 questões que precisam validação (soft-delete, moeda, notificações, etc.)

---

## 🎓 Como usar esta documentação

### Antes de QUALQUER mudança de código:
1. Abra este índice
2. Clique no [[Arquitetura/Mapa-de-Regressão.md]] e procure o módulo que vai mexer
3. Leia "O que quebra se eu mudar X?"
4. Clique no módulo específico (ex: [[Sistemas/TransactionForm.md]])
5. **Só então** comece a codar
6. Após terminar, atualize a doc correspondente no MESMO PR

### Senhas/Secrets:
- Nunca colocar chaves API na documentação
- Sempre usar env vars (ver [[Arquitetura/Variáveis-de-Ambiente.md]])

### Diagramas:
- Todos em Mermaid (flowchart, sequenceDiagram, erDiagram)
- Síncronize com código sempre que lógica mudar

---

## 📋 Checklist antes de declarar tarefa pronta

- [ ] Código alterado?
  - [ ] Rodou `npm run lint` sem erros?
  - [ ] Rodou `tsc --noEmit` com sucesso?
  - [ ] Atualizei a doc correspondente?
  - [ ] Se foi fluxo crítico (auth/pagamento), descrevi teste feito?
- [ ] Novo arquivo criado?
  - [ ] Adicionei ele neste ÍNDICE.md?
  - [ ] Linkei ele em [[Mapa-de-Regressão.md]] se relevante?
- [ ] Banco de dados alterado?
  - [ ] Criei migration em `supabase/migrations/`?
  - [ ] Atualizei [[Arquitetura/Banco-de-Dados.md]]?
  - [ ] Verifiquei RLS policies?

---

## 🚨 Armadilhas críticas

⚠️ **Leia antes de tocar:**
1. **Transações parceladas** → Não há tabela central `installments`, agrupa por `installment_group_id`
2. **Moeda global** → Muda em `profiles.currency`, conversão retroativa não automática
3. **Soft-delete de transações** → `deleted_at` field, mas accounts não têm soft-delete
4. **Categorias system** → `is_system=true`, não editáveis, precisam estar seedadas
5. **RLS policies** → Qualquer SELECT sem `auth.uid() = user_id` quebra tudo
6. **Lovable deploy** → Force-push reescreve histórico, evitar!

---

## 📞 Contato / Escalação

- **Dúvidas sobre Banco?** → Ver [[Arquitetura/Banco-de-Dados.md]]
- **Dúvidas sobre Auth?** → Ver [[Sistemas/Auth-e-Permissoes.md]]
- **Bug em transação?** → Ver [[Sistemas/TransactionForm.md]] + [[Fluxos/Contas-e-Transacoes.md]]
- **Não sei o impacto de mudar X** → Abra [[Arquitetura/Mapa-de-Regressão.md]]

---

**Versão:** 1.0  
**Gerado em:** 2026-06-29  
**Próxima revisão:** Sempre que major feature for adicionada
