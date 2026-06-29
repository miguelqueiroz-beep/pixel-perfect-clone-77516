# ⚠️ Pontos em Aberto

10 questões críticas que precisam validação antes de prosseguir com features.

---

## 🎯 Lista de Questões

### 1️⃣ CRÍTICA: Soft-delete de Accounts

**Pergunta:** Quando usuário deleta uma conta, deve ser soft-delete ou hard-delete?

**Problema:**
- Account tem `is_archived` (soft-delete)
- Transações referem account_id (FK RESTRICT)
- Se deletar account hard, transações ficam órfãs

**Opções:**
- A) Soft-delete: `is_archived = true`, transações continuam visíveis (com account virtual)
- B) Hard-delete: Cascade delete ou impedir se houver transações
- C) Migrar transações para "Deleted Account" genérica

**Recomendação:** Decidir e documentar em [[../Fluxos/Contas-e-Transacoes.md]]

---

### 2️⃣ CRÍTICA: Parcelamentos — Editar vs Deletar

**Pergunta:** Como lidar com edição de parcelamentos?

**Problema:**
- 3 transações separadas com `installment_group_id`
- Usuário quer editar parcela 1 de R$1000 para R$900
- Quanto para as outras parcelas? (R$900, R$900, R$900 = R$2700 total?)

**Opções:**
- A) Proibir edição, forçar delete + recria
- B) Permitir edição individual (inconsistência)
- C) Editar todas as 3 parcelas igualmente
- D) Distribuir diferença nas próximas parcelas

**Recomendação:** Implementação atual = A. Validar com usuário.

---

### 3️⃣ CRÍTICA: Moeda Global — Conversão Retroativa

**Pergunta:** Se usuário mudar moeda (BRL → USD), histórico de transações se converte?

**Problema:**
- `profiles.currency = 'BRL'` globalmente
- Transação antiga: `amount = 1000` (era em BRL)
- User muda para USD
- Transação agora mostra R$1000 como US$1000? ❌ Errado!

**Opções:**
- A) Histórico fica na moeda antiga (UI mostra "BRL 1000" mesmo se current = USD)
- B) Conversão automática (precisa taxa de câmbio API)
- C) Não permitir mudança de moeda após primeiro uso
- D) Armazenar `currency_at_transaction_time` em cada TX

**Recomendação:** Decidir urgente. Impacta relatórios.

---

### 4️⃣ ALTO: Notificações — Implementação

**Pergunta:** Feature `notifications_enabled` em profiles, mas sem backend. Como implementar?

**Problema:**
- Campo existe mas nada dispara notificações
- Não há tabela de notificações
- Não há worker/cron que verifica limites

**Opções:**
- A) Remover campo (não será feature)
- B) Implementar email alerts (SendGrid integration)
- C) Implementar in-app notifications (Sonner toast)
- D) Implementar PWA push notifications

**Recomendação:** Decidir escopo. Mínimo = in-app (Sonner já está pronto).

---

### 5️⃣ ALTO: Categorias System — Seeding

**Pergunta:** Quais são as categorias "system" padrão? Como seeder?

**Problema:**
- `is_system = true` categorias imutáveis
- Não há lista documentada
- Não há seed automático

**Categorias esperadas:**
- Income: Salário, Freelance, Investimento, Refund, Gift, etc.
- Expense: Alimentação, Transporte, Entretenimento, Saúde, etc.

**Recomendação:** 
1. Definir lista completa em PRD
2. Criar seed SQL
3. Documentar em [[../Arquitetura/Banco-de-Dados.md]]

---

### 6️⃣ ALTO: Autenticação Social — Roadmap

**Pergunta:** Google/GitHub login será suportado?

**Problema:**
- Atualmente: apenas email + password
- Usuários can prefer OAuth
- Supabase já suporta, só precisa ativar

**Opções:**
- A) MVP: Não suportar (email/password suficiente)
- B) Roadmap futuro: Google + GitHub
- C) Suportar tudo desde o início

**Recomendação:** Decidir escopo MVP. Supabase pode ativar rapidamente se decidido.

---

### 7️⃣ ALTO: Relatórios & Export

**Pergunta:** Usuários podem exportar transações em CSV/PDF?

**Problema:**
- Feature não implementada
- Muitos apps de finança têm isso
- Pode ser requisito de usuário

**Opções:**
- A) Não implementar (fora do escopo MVP)
- B) CSV export (simples)
- C) PDF reports (mais complexo)
- D) Ambos

**Recomendação:** MVP = não necessário. Roadmap futuro.

---

### 8️⃣ MÉDIO: Auditoria — Compliance

**Pergunta:** Há requisitos de auditoria/compliance? (ex: LGPD)

**Problema:**
- Sem tabela `audit_log`
- Sem rastreamento de quem deletou/mudou o quê
- Pode violar LGPD ou reqs de compliance

**Opções:**
- A) Não necessário (app pessoal, sem requirements)
- B) Adicionar audit_log table + triggers
- C) Integrar com plataforma de compliance

**Recomendação:** Confirmar requisitos com stakeholder. Se nenhum, não implementar.

---

### 9️⃣ MÉDIO: Cálculo de Saldo — Performance

**Pergunta:** Saldo calculado ad-hoc ou pré-calculado?

**Problema:**
- Atualmente: `initial_balance + SUM(transações)` em cada query
- Com muitas transações (10k+), fica lento
- Alternativa: tabela `account_balances` desnormalizada

**Opções:**
- A) Manter ad-hoc (simples, correto)
- B) Cache em Redis (complexo)
- C) Tabela desnormalizada (atualizar com trigger)

**Recomendação:** MVP = ad-hoc. Otimizar se performance degradar.

---

### 🔟 MÉDIO: Saldo Negativo — Validação

**Pergunta:** É permitido saldo negativo em conta non-credit?

**Problema:**
- Account checking/savings com `initial_balance = 1000`
- User gasta R$2000
- Saldo fica `-R$1000`
- É possível? Banco permite?

**Opções:**
- A) Permitir (usuário fez débito, pode ficar negativo)
- B) Bloquear (validação na app)
- C) Avisar (toast warning, mas permite)

**Recomendação:** MVP = permitir (não bloquear transações). Validação futura se requisito.

---

## 🎯 Ações Necessárias

| Questão | Prioridade | Proprietário | Status |
|---------|-----------|-------------|--------|
| 1. Soft-delete accounts | 🔴 | Você | ❓ Aberto |
| 2. Parcelamentos edit | 🔴 | Você | ❓ Aberto |
| 3. Moeda — conversão | 🔴 | Você | ❓ Aberto |
| 4. Notificações | 🟠 | Você | ❓ Aberto |
| 5. Categories seeding | 🟠 | Você | ❓ Aberto |
| 6. Auth social | 🟠 | Você | ❓ Aberto |
| 7. Export reports | 🟡 | Você | ❓ Aberto |
| 8. Auditoria | 🟡 | Você | ❓ Aberto |
| 9. Performance saldos | 🟡 | Você | ❓ Aberto |
| 10. Saldo negativo | 🟡 | Você | ❓ Aberto |

---

## 📋 Como validar

Para cada questão:
1. Leia novamente
2. Considere opções
3. Escolha a melhor para seu caso de uso
4. Documente a decisão aqui (update este arquivo)
5. Implemente a solução
6. Remexa este arquivo quando terminar

---

## 📚 Relacionado

- **PRD:** [[../../PRD-FinFlow.md]]
- **Banco de Dados:** [[../Arquitetura/Banco-de-Dados.md]]
- **Fluxos:** [[../Fluxos/]]
- **Mapa de Regressão:** [[../Arquitetura/Mapa-de-Regressão.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29  
**Status:** 10/10 questões abertas  
**Ação urgente:** Validar Q1–Q3 antes de feature development
