# 📝 TransactionForm

Componente crítico de criação/edição de transações com validação, parcelamentos e regras de negócio.

---

## 📍 Localização

`[src/components/transaction-form.tsx](../../src/components/transaction-form.tsx)`

---

## 🎯 Responsabilidade

Formulário que permite usuário:
- Registrar receitas (income)
- Registrar despesas (expense)
- Parcelar compras (installments)
- Selecionar conta, categoria, método de pagamento
- Salvar com validação Zod
- Mostrar erros inline

---

## 🔧 Props

```typescript
interface TransactionFormProps {
  initialData?: Transaction;  // Se editar, passa dados atuais
  onSuccess?: (tx: Transaction) => void;  // Callback após sucesso
  isLoading?: boolean;  // State do submit
  defaultKind?: 'income' | 'expense';  // Pre-select tipo
}
```

---

## 🔄 Fluxo Interno

```
Props
  ↓
useForm (React Hook Form)
├─ Inicializa com initialData (se editar) ou empty
├─ Schema Zod validação
└─ Listeners para campos
  ↓
Render campos:
├─ Kind (income/expense radio)
├─ Amount (número, positive)
├─ Date (date picker)
├─ Account (select, carrega via useAccounts)
├─ Category (select, filtra por kind)
├─ PaymentMethod (select, opcional)
├─ Status (paid/pending, opcional)
└─ Se parcelado:
   ├─ installment_number
   └─ installment_total
  ↓
Submit
├─ Valida com Zod
├─ Se inválido → mostra erros inline, retorna
├─ Se válido → POST /transactions
└─ Sucesso → toast + callback
```

---

## ✅ Validações (Zod Schema)

```typescript
const transactionFormSchema = z.object({
  kind: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo obrigatório' }),
  }),
  
  amount: z
    .number({ coerce: true })
    .positive('Valor deve ser maior que 0')
    .max(999999.99, 'Valor muito alto')
    .multipleOf(0.01, 'Máximo 2 casas decimais'),
  
  date: z
    .string()
    .refine(
      (d) => new Date(d) <= new Date(),
      'Data não pode ser futura'
    ),
  
  account_id: z
    .string({ required_error: 'Conta obrigatória' })
    .uuid('Conta inválida'),
  
  category_id: z
    .string({ required_error: 'Categoria obrigatória' })
    .uuid('Categoria inválida'),
  
  payment_method: z.enum([
    'cash', 'debit', 'credit', 'pix', 'bank_slip', 'transfer'
  ]).optional(),
  
  status: z.enum(['paid', 'pending']).default('paid'),
  
  // Parcelamento
  is_recurring: z.boolean().default(false),
  installment_number: z.number().int().min(1).optional(),
  installment_total: z.number().int().min(1).max(60).optional(),
  
  description: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
})
.refine(
  (data) => {
    // Se parcelado, ambos devem estar presentes
    if (data.installment_number && !data.installment_total) return false;
    if (data.installment_total && !data.installment_number) return false;
    return true;
  },
  { message: 'Número e total de parcelas devem estar juntos' }
)
.refine(
  (data) => {
    // Se parcelado, número não pode ser > total
    if (data.installment_number && data.installment_total) {
      return data.installment_number <= data.installment_total;
    }
    return true;
  },
  { message: 'Número da parcela não pode ser maior que o total' }
);
```

---

## 🏗️ Estrutura do Componente

```typescript
export function TransactionForm({ 
  initialData, 
  onSuccess, 
  isLoading,
  defaultKind = 'expense' 
}: TransactionFormProps) {
  
  // 1. Hooks de dados
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  
  // 2. Form state (React Hook Form)
  const form = useForm({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: initialData || { kind: defaultKind, ... },
  });
  
  // 3. Watchers para comportamento dinâmico
  const kind = form.watch('kind'); // Se mudou income/expense
  const installmentTotal = form.watch('installment_total');
  
  // 4. Funções helpers
  const filteredCategories = categories.filter(
    cat => cat.type === kind || cat.type === 'both'
  );
  
  const installmentAmount = amount / (installmentTotal || 1);
  
  // 5. Handlers
  const onSubmit = async (values: z.infer<typeof schema>) => {
    // POST /transactions
    // Sucesso → toast + onSuccess callback
    // Erro → toast erro
  };
  
  // 6. Render
  return (
    <Form>
      <FormField name="kind" />
      <FormField name="amount" />
      <FormField name="date" />
      <FormField name="account_id" />
      <FormField name="category_id" />
      
      {kind === 'income' && (
        <FormField name="income_type" />
      )}
      
      {installmentTotal && (
        <div>Valor/parcela: {installmentAmount}</div>
      )}
      
      <Button onClick={form.handleSubmit(onSubmit)} loading={isLoading}>
        Registrar
      </Button>
    </Form>
  );
}
```

---

## 🎨 Estados da UI

### Estado 1: Vazio (Novo)

```
Campos: Vazios
Botão: "Registrar" (enabled)
Erros: Nenhum
```

### Estado 2: Preenchido válido

```
Campos: Filled
Botão: "Registrar" (enabled, pronto)
Erros: Nenhum
Preview: Mostra cálculo de parcela (se parcelado)
```

### Estado 3: Preenchido inválido

```
Campos: Algum vermelho
Botão: "Registrar" (disabled)
Erros: Inline "Valor deve ser > 0"
```

### Estado 4: Enviando

```
Campos: Disabled (não mexer durante submit)
Botão: "Registrando..." (loading spinner, disabled)
Erros: Nenhum
```

### Estado 5: Sucesso

```
Toast: "✅ Transação registrada!"
Formulário: Reset ou fecha
Callback: onSuccess() executado
```

### Estado 6: Erro servidor

```
Toast: "❌ Erro ao registrar. Tente novamente."
Formulário: Mantém dados (não perde)
Botão: Re-enabled para retry
```

---

## 🎯 Regras de Negócio

| Regra | Implementação |
|-------|---|
| Valor sempre positivo | Schema Zod `.positive()` |
| Data não pode ser futura | `.refine(d => d <= now())` |
| Categoria deve existir | FK + RLS validation |
| Conta deve estar ativa | `!is_archived` check (frontend?) |
| Parcelado: 1–60 parcelas | `.min(1).max(60)` |
| Se parcelado, sincronizar número | `.refine(n <= t)` |
| User não pode ver categorias de outro | RLS filtra no servidor |

---

## ⚠️ Edge Cases

### Caso 1: Deletar categoria enquanto formulário aberto

```
User A abre form, seleciona categoria "Food"
User B (ou mesmo User A em outro tab) deleta "Food"
User A tenta submit

Resultado:
- Frontend valida → categoria_id ainda existe (cache)
- Servidor: FK quebra (categoria deletada)
- Erro 404 ou constraint error
- Toast: "Categoria não existe mais"
```

**Mitigação:** Invalidar form se categoria deletada em realtime.

### Caso 2: Moeda muda durante transação

```
User A abre form (moeda = BRL)
Admin muda moeda global para USD
User A submete BRL 1000

Resultado:
- Transação salva em BRL (profiles.currency não muda durante sessão)
- Dashboard mostra em BRL (correto)
- Mas se export futuro? Confusão

Mitigação: Armazenar currency_at_time em cada transação (futuro).
```

### Caso 3: Parcelamento com parcela > total

```
User tenta: installment_number = 5, installment_total = 3

Zod `.refine()` rejeita → erro inline "5 > 3".
```

---

## 🧪 Testes

### Teste 1: Criar transação simples

```
1. Abre form
2. Preenche: amount=100, date=2026-06-29, categoria=Food, conta=Corrente
3. Clica Registrar
4. ✅ Toast sucesso, form reset
5. Dashboard lista nova transação
```

### Teste 2: Parcelamento

```
1. Abre form
2. Preenche: amount=300, installment_total=3
3. Sistema mostra: "3 parcelas de R$100"
4. Clica Registrar
5. ✅ 3 linhas aparecem na lista
```

### Teste 3: Validação

```
1. Tenta amount = -100 → ❌ "Deve ser > 0"
2. Tenta date = 2027-01-01 → ❌ "Futura"
3. Não seleciona categoria → ❌ "Obrigatória"
```

### Teste 4: Editar (futuro)

```
⚠️ Não implementado (lê Contas-e-Transacoes.md por quê)
Problema: Parcelados não devem ser editáveis
Solução: Mostrar erro "Delete e recrie" se tentar editar parcelado
```

---

## 🔗 Dependências

- [useAccounts](./Queries-React.md) — Carregar lista de contas
- [useCategories](./Queries-React.md) — Carregar categorias
- [Zod](https://zod.dev) — Validação schema
- [React Hook Form](https://react-hook-form.com) — Form state
- [Radix UI](https://radix-ui.com) — Componentes
- [react-day-picker](https://react-day-picker.js.org) — Date picker

---

## 📚 Relacionado

- **Fluxo completo:** [[../Fluxos/Contas-e-Transacoes.md]]
- **Banco de Dados:** [[../Arquitetura/Banco-de-Dados.md]]
- **Queries React:** [[Queries-React.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
