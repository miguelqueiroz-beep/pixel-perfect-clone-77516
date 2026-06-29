# 💎 Orçamentos e Metas

Fluxo de definir orçamentos, acompanhar metas e alertas quando ultrapassados.

---

## 📊 Diagrama: Definir Orçamento

```mermaid
graph TD
    A["👤 Usuário"] --> B["Clica 'Novo Orçamento'"]
    B --> C["Dialog: Escopo"]
    C --> C1{Qual tipo?}
    C1 -->|General| D1["Orçamento total/mês<br/>ex: R$2500/mês"]
    C1 -->|Category| D2["Orçamento por categoria<br/>ex: Alimentação R$500/mês"]
    D1 --> D3["Cria entry em budgets<br/>scope=general, limit_amount, reference_month"]
    D2 --> D3
    D3 --> D4{Success?}
    D4 -->|Erro| D5["❌ Já existe para este mês?"]
    D5 --> C1
    D4 -->|Sim| D6["✅ Orçamento criado"]
    D6 --> D7["Dashboard mostra:<br/>- Limite: R$2500<br/>- Gasto: R$1200<br/>- Restante: R$1300"]
```

---

## 🎯 Diagrama: Acompanhar Orçamento

```mermaid
graph TD
    A["Dashboard carrega"] --> B["SELECT budgets WHERE<br/>reference_month = current_month"]
    B --> B1["Para cada budget:<br/>SUM(transactions.amount)<br/>WHERE category_id = budget.category_id"]
    B1 --> B2{Gasto > Limite?}
    B2 -->|Não| C1["✅ Verde: 60% limite"]
    B2 -->|Sim| C2["🔴 Vermelho: ALERTA"]
    C1 --> C3["Mostra progresso"]
    C2 --> C4["Mostra aviso +<br/>notificação"]
    C3 --> C5["Widget no dashboard:<br/>'Orçamento Alimentação<br/>R$500 / R$650 (130%)'"]
    C4 --> C5
```

---

## 📊 Sequência: Checar Orçamento ao Inserir Transação

```mermaid
sequenceDiagram
    participant User as 👤 Usuário
    participant Form as TransactionForm
    participant DB as Supabase
    participant Calc as Cálculo (app-side)
    participant UI as Dashboard
    
    User->>Form: Registra despesa R$600 em Alimentação
    Form->>DB: INSERT transaction (amount=600, category='Alimentação')
    DB-->>Form: ✓ Criada
    
    Form->>DB: SELECT SUM(amount) FROM transactions<br/>WHERE category_id = 'cat_food' AND date BETWEEN 2026-06-01 AND 2026-06-30
    DB-->>Form: 1200 (antes era 600, agora é 1200)
    
    Form->>DB: SELECT * FROM budgets<br/>WHERE category_id = 'cat_food' AND reference_month = '2026-06-01'
    DB-->>Form: {limit_amount: 1000}
    
    Calc->>Calc: 1200 > 1000? SIM
    Calc->>UI: ⚠️ Toast: "Orçamento Alimentação ultrapassado!"
    Calc->>UI: Mostra widget com 120% do limite
```

---

## 💡 Fluxo: Criar Meta Financeira

```mermaid
graph TD
    A["👤 Usuário"] --> B["Clica 'Nova Meta'"]
    B --> C["Dialog: Nome, Alvo,<br/>Deadline, Prioridade"]
    C --> C1["Validação Zod<br/>(nome, target > 0, deadline)"]
    C1 --> C2{Válido?}
    C2 -->|Não| C3["❌ Erro inline"]
    C3 --> C1
    C2 -->|Sim| C4["INSERT goals<br/>(name, target_amount,<br/>deadline, priority)"]
    C4 --> C5{Success?}
    C5 -->|Erro| C6["❌ Erro servidor"]
    C6 --> C1
    C5 -->|Sim| C7["✅ Meta criada"]
    C7 --> C8["Dashboard mostra:<br/>- Alvo: R$10000<br/>- Economizado: R$0<br/>- Progresso: 0%"]
```

---

## 📊 Acompanhamento de Meta

```
Meta: Viagem para Miami
├── Target: R$10.000
├── Deadline: 2026-12-31
├── Saved: R$3.500
├── Progress: 35%
├── Priority: High
└── Status: Active

Visual (Progress Bar):
[████░░░░░░] 35%
```

**Cálculo:** `progress = (saved_amount / target_amount) * 100`

---

## ⚠️ Problema: Sincronizar Meta com Transações

```
Cenário: Meta "Viagem Miami" com saved_amount = R$3500
         Usuário registra nova despesa "R$500 para viagem"
         
❌ PROBLEMA: saved_amount NÃO sincroniza automaticamente
             Continua em R$3500, deveria ser R$4000

✅ SOLUÇÃO 1: Usuário edita meta manualmente
             Clica "Adicionar R$500" → salva

✅ SOLUÇÃO 2: Vincular transação à meta
             Ao registrar, marcar "Para meta X"
             Sistema calcula saved_amount = SUM(transações da meta)

🎯 IMPLEMENTAÇÃO ATUAL: Solução 1 (manual)
                        Solução 2 é feature futura
```

---

## 🧮 Cálculo: Orçamento Mensal

```
reference_month = '2026-06-01'

Despesas de Junho:
- 06/01: Alimentação -R$200
- 06/05: Alimentação -R$150
- 06/10: Lazer -R$300
- 06/15: Alimentação -R$400
- 06/20: Transporte -R$100

Total Alimentação: R$750
Orçamento Alimentação: R$1000
Restante: R$250
Percentual: 75% do orçamento

---

Orçamento General (soma todas categorias):
Total: R$750 + R$300 + R$100 = R$1150
Orçamento General: R$2500
Restante: R$1350
Percentual: 46% do orçamento
```

---

## 🎯 Validações (Zod)

```typescript
const budgetSchema = z.object({
  scope: z.enum(['general', 'category']),
  category_id: z.string().uuid().optional(),
  limit_amount: z.number().positive('Limite deve ser > 0'),
  reference_month: z.string().refine(
    (date) => /^\d{4}-\d{2}-01$/.test(date),
    'Deve ser primeiro dia do mês (YYYY-MM-01)'
  ),
}).refine(
  (data) => {
    if (data.scope === 'category' && !data.category_id) return false;
    if (data.scope === 'general' && data.category_id) return false;
    return true;
  },
  { message: 'Category obrigatória se scope=category' }
);

const goalSchema = z.object({
  name: z.string().min(2).max(100),
  target_amount: z.number().positive('Alvo deve ser > 0'),
  saved_amount: z.number().nonnegative().default(0),
  deadline: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Deadline deve ser no futuro'
  ),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
});
```

---

## 🚨 Alertas

### Alerta 1: Orçamento Ultrapassado

```
Condição: SUM(transações) > budget.limit_amount
Exibição: ⚠️ Toast vermelha no topo + widget dashboard
Mensagem: "Orçamento Alimentação ultrapassado em R$150"
Ação: Usuário clica → Dialog com histórico de despesas
```

### Alerta 2: Meta Próxima ao Deadline

```
Condição: deadline - hoje <= 30 dias E progress < 100%
Exibição: ⚠️ Notificação (se habilitado)
Mensagem: "Meta 'Viagem Miami' vence em 20 dias (35% realizado)"
Ação: Usuário clica → Dialog com opções
       - Aportar valor
       - Prorrogar deadline
       - Arquivar meta
```

### Alerta 3: Meta Completada

```
Condição: saved_amount >= target_amount
Exibição: ✅ Toast verde + confete animation
Mensagem: "Parabéns! Meta 'Viagem Miami' foi atingida!"
Ação: Atualiza status → 'completed'
```

---

## 🧪 Teste: Checklist

- [ ] Criar orçamento general → dashboard mostra limite?
- [ ] Criar orçamento por categoria → filtra correto?
- [ ] Registrar despesa acima do limite → mostra alerta?
- [ ] Criar meta futura → aparece na lista?
- [ ] Editar meta (valor, deadline) → atualiza?
- [ ] Marcar meta como completa → status muda?
- [ ] Deletar orçamento → widget desaparece?
- [ ] Orçamento de mês passado → não aparece mais?
- [ ] Múltiplas metas → cada uma acompanha progress?

---

## 📚 Relacionado

- **Banco de Dados:** [[../Arquitetura/Banco-de-Dados.md]]
- **Contas e Transações:** [[Contas-e-Transacoes.md]]
- **Queries React:** [[../Sistemas/Queries-React.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
