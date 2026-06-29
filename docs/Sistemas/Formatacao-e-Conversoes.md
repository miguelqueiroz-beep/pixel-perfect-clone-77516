# 📐 Formatação e Conversões

Funções para formatar datas, moedas, números e converter entre formatos.

---

## 📍 Localização

`[src/lib/format.ts](../../src/lib/format.ts)`

---

## 💰 Formatação de Moeda

### Função: formatCurrency

```typescript
export function formatCurrency(
  amount: number,
  currency: string = 'BRL'  // De profiles.currency
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Exemplos:
formatCurrency(1234.56)        // "R$ 1.234,56"
formatCurrency(1234.56, 'USD') // "US$ 1,234.56"
formatCurrency(-500)           // "-R$ 500,00"
```

**Uso em template:**
```typescript
<span>{formatCurrency(transaction.amount)}</span>  // "R$ 100,00"
```

---

## 📅 Formatação de Datas

### Função: formatDate

```typescript
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

// Exemplos:
formatDate('2026-06-29')  // "segunda-feira, 29 de junho de 2026"
formatDate(new Date())    // Hoje formatado
```

### Função: formatDateShort

```typescript
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

// Exemplos:
formatDateShort('2026-06-29')  // "29/06/26"
```

### Função: formatMonth

```typescript
export function formatMonth(date: string | Date): string {
  const dt = new Date(date);
  return dt.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

// Exemplos:
formatMonth('2026-06-01')  // "junho de 2026"
```

---

## 🧮 Conversão de Números

### Função: parseCurrency

```typescript
export function parseCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  
  // "R$ 1.234,56" → 1234.56
  return parseFloat(
    value
      .replace(/[^\d,-]/g, '')      // Remove tudo menos dígitos, vírgula, hífen
      .replace(/\./g, '')            // Remove pontos (separador de milhar)
      .replace(',', '.')             // Converte vírgula para ponto
  );
}

// Exemplos:
parseCurrency('1234,56')      // 1234.56
parseCurrency('R$ 1.234,56')  // 1234.56
parseCurrency(1234.56)        // 1234.56
```

**Uso em formulário:**
```typescript
const amountInput = 'R$ 500,00';
const numericAmount = parseCurrency(amountInput);  // 500
```

---

## 📊 Funções Auxiliares

### firstOfMonth / lastOfMonth

```typescript
export function firstOfMonth(date?: Date): Date {
  const d = new Date(date || new Date());
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function lastOfMonth(date?: Date): Date {
  const d = new Date(date || new Date());
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Exemplos:
firstOfMonth()  // 2026-06-01T00:00:00
lastOfMonth()   // 2026-06-30T23:59:59
```

### toISODate

```typescript
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];  // YYYY-MM-DD
}

// Exemplos:
toISODate(new Date('2026-06-29'))  // "2026-06-29"
```

---

## 🔄 Casos de Uso

### Caso 1: Exibir transação

```typescript
const tx = { amount: 500, date: '2026-06-29', kind: 'expense' };

<div>
  <span>{formatDateShort(tx.date)}</span>  // "29/06/26"
  <span>{formatCurrency(-tx.amount)}</span> // "-R$ 500,00"
</div>
```

### Caso 2: Filtrar por mês

```typescript
const currentMonth = new Date();
const start = toISODate(firstOfMonth(currentMonth));     // "2026-06-01"
const end = toISODate(lastOfMonth(currentMonth));        // "2026-06-30"

const { data } = useTransactions({
  startDate: start,
  endDate: end,
});
```

### Caso 3: Parcelar valor

```typescript
const totalAmount = 3000;
const installments = 3;
const perInstallment = totalAmount / installments;

<div>
  {Array.from({ length: installments }, (_, i) => (
    <div key={i}>
      Parcela {i + 1}: {formatCurrency(perInstallment)}
    </div>
  ))}
</div>

// Output:
// Parcela 1: R$ 1.000,00
// Parcela 2: R$ 1.000,00
// Parcela 3: R$ 1.000,00
```

---

## ⚠️ Cuidados

### Cuidado 1: Timezone

```typescript
// ❌ PROBLEMA
const date = new Date('2026-06-29');
// Pode ser interpretado como UTC ou local

// ✅ SOLUÇÃO
const date = new Date('2026-06-29T00:00:00-03:00');  // São Paulo
```

### Cuidado 2: Arredondamento de moeda

```typescript
// ❌ ERRADO (perde centavos)
const total = 100.12 + 200.34;  // 300.46000000000004

// ✅ CERTO (trunca ou arredonda)
const total = Math.round((100.12 + 200.34) * 100) / 100;  // 300.46
```

### Cuidado 3: Moeda muda, mas histórico fica na moeda antiga

```
Usuário muda:
  profiles.currency: 'BRL' → 'USD'
  
Transação histórica:
  amount: 1000 (era BRL, agora aparece em USD na interface)
  
❌ Problema: Confusão! 1000 em BRL ≠ 1000 em USD
✅ Solução (futuro): Armazenar currency_at_transaction_time
```

---

## 🧪 Teste: Formatações

```typescript
// Moeda
expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
expect(formatCurrency(-500)).toBe('-R$ 500,00');

// Datas
expect(formatDateShort('2026-06-29')).toBe('29/06/26');

// Conversões
expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);

// Período
const start = firstOfMonth();
const end = lastOfMonth();
expect(start.getDate()).toBe(1);
expect(end.getDate()).toBeLessThanOrEqual(31);
```

---

## 📚 Relacionado

- **Banco de Dados:** [[../Arquitetura/Banco-de-Dados.md]]
- **Queries React:** [[Queries-React.md]]
- **TransactionForm:** [[TransactionForm.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
