# 💰 Contas e Transações

Fluxo completo de gerenciar contas e registrar transações (receitas, despesas e parcelamentos).

---

## 📊 Diagrama: Criar Conta

```mermaid
graph TD
    A["👤 Usuário"] --> B["Clica 'Nova Conta'"]
    B --> C["Abre Dialog:<br/>Nome, Tipo, Saldo Inicial"]
    C --> C1["Validação Zod<br/>(nome, tipo, saldo)"]
    C1 --> C2{Válido?}
    C2 -->|Não| C3["❌ Erro inline"]
    C3 --> C1
    C2 -->|Sim| C4["INSERT accounts<br/>(user_id, name, type)"]
    C4 --> C5{Success?}
    C5 -->|Error| C6["❌ Erro servidor"]
    C6 --> C1
    C5 -->|Success| C7["✅ Conta criada"]
    C7 --> C8["Realtime atualiza<br/>lista de contas"]
    C8 --> C9["Usuário agora pode<br/>registrar transação"]
```

---

## 📊 Diagrama: Criar Transação

```mermaid
graph TD
    A["👤 Usuário"] --> B["Clica 'Nova Transação'<br/>ou 'Registrar Gasto'"]
    B --> C["Abre TransactionForm"]
    C --> C1["Preenche: Tipo, Categoria,<br/>Valor, Data, Conta, Descrição"]
    C1 --> C2{Parcelado?}
    C2 -->|Não| C3["Formulário simples"]
    C2 -->|Sim| C4["Mostra campos extra:<br/>Nº parcelas, Parcela Atual"]
    C3 --> C5["Validação Zod<br/>(amount > 0, date válida)"]
    C4 --> C5
    C5 --> C6{Válido?}
    C6 -->|Não| C7["❌ Mostra erros inline"]
    C7 --> C1
    C6 -->|Sim| C8["INSERT transactions<br/>(ou INSERT múltiplas se parcelado)"]
    C8 --> C9{Success?}
    C9 -->|Error| C10["❌ Erro (FK quebrada?,<br/>categoria inválida?)"]
    C10 --> C1
    C9 -->|Success| C11["✅ Transação(ões) criada(s)"]
    C11 --> C12["Realtime atualiza<br/>- Lista transações<br/>- Saldos de contas<br/>- Orçamentos"]
    C12 --> C13["Dashboard<br/>refaz gráficos"]
```

---

## 🔐 Sequência Detalhada: Criar Transação Simples

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant Form as TransactionForm
    participant Zod as Zod Schema
    participant Server as SSR/Client
    participant DB as Supabase DB
    participant RLS as RLS Policy
    
    Browser->>Form: Preenche formulário (R$100, 2026-06-29, Alimentação)
    Form->>Zod: Valida
    Zod-->>Form: {valid: true}
    
    Form->>Server: POST /transactions {amount, date, category_id, account_id}
    Server->>DB: INSERT into transactions (user_id, amount, date, ...)
    DB->>RLS: Verifica auth.uid() = user_id
    RLS-->>DB: ✓ Autorizado
    DB-->>Server: {id: 'xxx', created_at: '...'}
    Server-->>Form: ✅ Sucesso
    
    Form->>Browser: 1. Toast "Transação registrada"
    Form->>Browser: 2. Limpa formulário
    Form->>Browser: 3. Realtime atualiza lista (INSERT event)
    Form->>Browser: 4. Dashboard recalcula saldos
```

---

## 🔐 Sequência Detalhada: Criar Transação Parcelada

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant Form as TransactionForm
    participant Server as Server
    participant DB as Supabase
    
    Browser->>Form: Preenche: Valor R$3000, 3 parcelas, Categoria
    Form->>Form: Gera installment_group_id (UUID)
    Form->>Form: Calcula valor/parcela (R$1000)
    
    loop Para cada parcela (1, 2, 3)
        Form->>Server: POST /transactions<br/>{installment_group_id, installment_number: i, installment_total: 3}
    end
    
    Server->>DB: INSERT transaction 1 (amount=1000, installment_number=1/3)
    DB-->>Server: ✓
    Server->>DB: INSERT transaction 2 (amount=1000, installment_number=2/3)
    DB-->>Server: ✓
    Server->>DB: INSERT transaction 3 (amount=1000, installment_number=3/3)
    DB-->>Server: ✓
    
    Server-->>Form: ✅ 3 transações criadas
    Form->>Browser: Toast "3 parcelas registradas"
    Browser->>Browser: Realtime mostra 3 linhas na lista
```

---

## ⚠️ Problema: Editando Parcelamento

```
Cenário: Usuário criou 3 parcelas de R$1000
        Agora quer editar a parcela 1 para R$900

Opções:
1. Permitir edição simples
   ❌ Inconsistência (parcela 1 ≠ parcela 2 e 3)
   
2. Exigir deletar + recriar todas
   ✅ Consistência garantida
   ⚠️ Perde histórico
   
3. Calcular diferença para próximas parcelas
   ✅ Lógica complexa
   ⚠️ Outro valor a configurar
   
🎯 IMPLEMENTAÇÃO ATUAL: Opção 2
   - Se deletar qualquer parcela, delete todas com mesmo installment_group_id
   - Para editar, delete tudo e recriar
```

---

## 🔄 Fluxo: Editar Transação

```mermaid
graph TD
    A["👤 Usuário"] --> B["Clica transação"]
    B --> C["Abre Dialog:<br/>Editar valores"]
    C --> C1{Parcelada?}
    C1 -->|Não| D1["Permite editar amount, date, categoria"]
    C1 -->|Sim| D2["❌ Erro: não editar parceladas<br/>Delete e recrie"]
    D1 --> D3["Validação"]
    D2 --> D4["Mostra aviso"]
    D3 --> D5{Válido?}
    D5 -->|Não| D6["Erro inline"]
    D6 --> C1
    D5 -->|Sim| D7["UPDATE transactions<br/>WHERE id = xxx"]
    D7 --> D8["✅ Sucesso"]
    D8 --> D9["Realtime refaz<br/>- lista<br/>- saldos<br/>- gráficos"]
```

---

## 🗑️ Fluxo: Deletar Transação

```mermaid
graph TD
    A["👤 Usuário"] --> B["Clica delete transação"]
    B --> C["Confirma: 'Tem certeza?'"]
    C --> C1{Parcelada?}
    C1 -->|Não| D1["DELETE transaction WHERE id = xxx"]
    C1 -->|Sim| D2["DELETE todas with same installment_group_id<br/>(ou apenas 1?)"]
    D1 --> D3{Success?}
    D2 --> D3
    D3 -->|Erro| D4["❌ Mostra erro"]
    D4 --> C1
    D3 -->|Sim| D5["✅ Deletado (soft-delete via deleted_at)"]
    D5 --> D6["Realtime atualiza"]
    D6 --> D7["Lista remove, saldos recalculados"]
```

---

## 💳 Tipos de Conta

| Tipo | Uso | Campos especiais |
|------|-----|-----------------|
| **checking** | Conta corrente | Saldo livre |
| **savings** | Poupança | Saldo investido |
| **wallet** | Carteira (cash) | Saldo em espécie |
| **credit_card** | Cartão de crédito | credit_limit, saldo é negativo |
| **investment** | Investimentos | Saldo em ativos |
| **other** | Genérico | Saldo livre |

---

## 📊 Tipos de Transação

| Campo | Valores | Notas |
|-------|---------|-------|
| `kind` | income, expense | Tipo principal |
| `income_type` | salary, freelance, investment, sale, gift, refund, dividends, other | Apenas se `kind = income` |
| `payment_method` | cash, debit, credit, pix, bank_slip, transfer | Como foi pago |
| `status` | paid, pending | Pago ou apenas previsto |

---

## 🧮 Cálculo de Saldo

```
Saldo de Conta = initial_balance + SUM(
  CASE WHEN kind='income' THEN amount ELSE -amount END
  FROM transactions 
  WHERE account_id = X 
  AND deleted_at IS NULL
)

Exemplo:
- Initial balance: R$1000
- Receita (salary) +R$3000: total = R$4000
- Despesa (food) -R$200: total = R$3800
- Despesa (parcelada) -R$100 × 3: total = R$3500
```

**⚠️ Nota:** Saldo é calculado em tempo real (não armazenado em DB).

---

## 🎯 Validações (Zod Schema)

```typescript
const transactionSchema = z.object({
  kind: z.enum(['income', 'expense']),
  amount: z.number().positive('Deve ser > 0'),
  date: z.string().refine(d => new Date(d) <= new Date(), 'Data não pode ser futura'),
  category_id: z.string().uuid('Categoria inválida'),
  account_id: z.string().uuid('Conta inválida'),
  description: z.string().max(255).optional(),
  payment_method: z.enum(['cash', 'debit', 'credit', 'pix', 'bank_slip', 'transfer']).optional(),
  status: z.enum(['paid', 'pending']).default('paid'),
  is_recurring: z.boolean().default(false),
  installment_number: z.number().int().optional(),
  installment_total: z.number().int().optional(),
  // Se parcelada, ambos devem estar presentes
}).refine(
  (data) => {
    if (data.installment_number && !data.installment_total) return false;
    if (data.installment_total && !data.installment_number) return false;
    return true;
  },
  { message: 'Número e total de parcelas devem estar juntos' }
);
```

---

## ⚠️ Edge Cases

### 1. Deletar conta com transações
```
Transação tem FK (account_id) → RESTRICT
Se deletar account, DELETE transactions falha
Solução: App deve avisar "Transações ainda referem essa conta"
e oferecer opção de reparamenter antes de deletar
```

### 2. Parcelamento com parcela 0
```
installment_number = 0 (ou null)?
❌ Inválido — sempre começa em 1
Validação Zod deve rejeitar
```

### 3. Transação futura
```
User registra gasto "amanhã"
✅ Permitido (status = pending)
Dashboard mostra "Receitas/Despesas Pendentes" separado
```

### 4. Editar categoria da transação
```
Transação era de "Alimentação" (id_cat_1)
User quer mudar para "Saúde" (id_cat_2)
✅ UPDATE transactions SET category_id = id_cat_2
⚠️ Orçamento antigo não se refaz (histórico)
```

---

## 🧪 Teste: Checklist

- [ ] Criar conta → lista se atualiza?
- [ ] Criar transação simples → saldo da conta muda?
- [ ] Criar parcelamento 3x → 3 linhas na lista?
- [ ] Editar transação simples → dados atualizam?
- [ ] Tentar editar parcelada → mostra erro?
- [ ] Deletar transação → lista atualiza, saldo recalcula?
- [ ] Deletar conta com transações → erro "não pode deletar"?
- [ ] Mudar categoria transação → orçamento da categoria antiga se refaz?
- [ ] Registrar transação futura (pending) → aparece na lista?

---

## 📚 Relacionado

- **Banco de Dados:** [[../Arquitetura/Banco-de-Dados.md]]
- **TransactionForm:** [[../Sistemas/TransactionForm.md]]
- **Queries React:** [[../Sistemas/Queries-React.md]]
- **Orçamentos:** [[Orcamentos-e-Metas.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
