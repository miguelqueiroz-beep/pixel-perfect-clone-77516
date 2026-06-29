# 🪝 Queries React

React Query hooks e chamadas de dados. Tudo em `[src/lib/queries.ts](../../src/lib/queries.ts)`.

---

## 📋 Tabela de Hooks

| Hook | Retorna | Query | Cache | Revalidação |
|------|---------|-------|-------|------------|
| `useAccounts()` | `Account[]` | SELECT accounts | queryKey: 'accounts' | Realtime INSERT/UPDATE |
| `useCategories()` | `Category[]` | SELECT categories (user + system) | 'categories' | Realtime |
| `useTransactions(filters)` | `Transaction[]` | SELECT com filtros (mês, categoria) | 'transactions' | Realtime |
| `useBudgets(month)` | `Budget[]` | SELECT budgets ref_month | 'budgets' | Realtime |
| `useGoals()` | `Goal[]` | SELECT goals | 'goals' | Realtime |

---

## 🎯 useAccounts

```typescript
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Account[];
    },
  });
}
```

**Uso:**
```typescript
const { data: accounts, isLoading, error } = useAccounts();

// Em componente:
if (isLoading) return <Skeleton />;
if (error) return <Error message="Erro ao carregar contas" />;

return (
  <div>
    {accounts.map(acc => (
      <AccountCard key={acc.id} {...acc} />
    ))}
  </div>
);
```

**Caching:**
- Primeira chamada: fetch do servidor
- Próximas: retorna cache (stale mas instantâneo)
- Background refetch: a cada 5min (default)
- Realtime: subscription atualiza automaticamente

---

## 🎯 useCategories

```typescript
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Category[];
    },
  });
}
```

**Peculiaridade:** Retorna categorias do usuário + system categories (é_system=true).

**Filtro no componente:**
```typescript
const { data: categories } = useCategories();

// Apenas categorias de receita
const incomeCategories = categories.filter(
  c => c.type === 'income' || c.type === 'both'
);

// Apenas user categories (pode editar)
const userCategories = categories.filter(c => !c.is_system);
```

---

## 🎯 useTransactions (Avançado)

```typescript
interface TransactionFilters {
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  kind?: 'income' | 'expense';
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],  // Chave muda com filtros
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*')
        .is('deleted_at', null);  // Excluir soft-deleted
      
      if (filters) {
        if (filters.startDate) query = query.gte('date', filters.startDate);
        if (filters.endDate) query = query.lte('date', filters.endDate);
        if (filters.accountId) query = query.eq('account_id', filters.accountId);
        if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
        if (filters.kind) query = query.eq('kind', filters.kind);
      }
      
      const { data, error } = await query
        .order('date', { ascending: false })
        .limit(1000);  // Pagination? Futuro
      
      if (error) throw error;
      return (data || []) as Transaction[];
    },
    staleTime: 30000,  // 30s mais agressivo que padrão (5min)
  });
}
```

**Uso com filtros:**
```typescript
const month = '2026-06-';  // Junho
const { data: txs } = useTransactions({
  startDate: `${month}01`,
  endDate: `${month}30`,
  kind: 'expense',
});
```

**Importante:** Quando filtros mudam, nova requisição é disparada (por causa de queryKey muda).

---

## 🎯 useBudgets

```typescript
export function useBudgets(referenceMonth: string) {  // '2026-06-01'
  return useQuery({
    queryKey: ['budgets', referenceMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('reference_month', referenceMonth);
      
      if (error) throw error;
      return (data || []) as Budget[];
    },
  });
}
```

---

## 🎯 useGoals

```typescript
export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('deadline', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Goal[];
    },
  });
}
```

---

## 🛠️ Invalidar Cache (Forçar Refetch)

```typescript
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();
  
  const handleCreateTransaction = async () => {
    // ... insert logic ...
    
    // Forçar refetch de todas as queries dependentes:
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });  // Saldo mudou
  };
}
```

---

## 🔄 Realtime Subscriptions (Automático)

React Query NÃO gerencia realtime automaticamente, mas pode com setup:

```typescript
// Futuro: Integrar Supabase Realtime listener
export function useTransactionsRealtime(filters?: TransactionFilters) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const subscription = supabase
      .channel(`transactions:${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          // Realtime event recebido
          queryClient.invalidateQueries({ queryKey: ['transactions', filters] });
        }
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [filters, queryClient]);
  
  return useTransactions(filters);
}
```

---

## ⚠️ Common Pitfalls

### Pitfall 1: Filtros não refazem query

```javascript
// ❌ ERRADO
const [filters, setFilters] = useState({});
const { data } = useTransactions();  // Ignora filtros

// ✅ CERTO
const [filters, setFilters] = useState({});
const { data } = useTransactions(filters);  // Passa filtros
```

### Pitfall 2: Não invalidar cache após mutação

```javascript
// ❌ ERRADO
async function createTransaction(data) {
  await supabase.from('transactions').insert(data);
  // Dashboard vê dados antigos!
}

// ✅ CERTO
async function createTransaction(data) {
  await supabase.from('transactions').insert(data);
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  // Dashboard refaz query
}
```

### Pitfall 3: Usar dados em cálculos antes de carregar

```javascript
// ❌ ERRADO
const { data: accounts } = useAccounts();
const firstAccountSaldo = accounts[0].balance;  // undefined se !data

// ✅ CERTO
const { data: accounts, isLoading } = useAccounts();
if (isLoading) return <Loading />;
const firstAccountSaldo = accounts[0].balance;  // Safe
```

---

## 🧪 Teste: Queries

### Teste 1: useAccounts carrega

```
1. Componente monta
2. ✅ isLoading = true
3. Requisição GET /accounts
4. ✅ isLoading = false
5. ✅ data = [...accounts]
```

### Teste 2: Filtros em useTransactions

```
1. Monta com filtros { kind: 'expense' }
2. ✅ Carrega apenas expense
3. Muda filtros { kind: 'income' }
4. ✅ Nova requisição, dados mudam
```

### Teste 3: Invalidar refaz query

```
1. useTransactions() carrega 5 txs
2. Insere nova tx manualmente no DB
3. queryClient.invalidateQueries({ queryKey: ['transactions'] })
4. ✅ Agora mostra 6 txs
```

---

## 📊 Performance Tips

1. **Paginar grandes datasets** (futuro)
   ```typescript
   const [page, setPage] = useState(1);
   const { data } = useTransactions({ offset: (page - 1) * 50, limit: 50 });
   ```

2. **Memoizar dados filtrados**
   ```typescript
   const userCategories = useMemo(
     () => categories.filter(c => !c.is_system),
     [categories]
   );
   ```

3. **Lazy-load com suspense** (futuro)
   ```typescript
   const LazyTransactions = lazy(() => import('./Transactions'));
   <Suspense fallback={<Skeleton />}>
     <LazyTransactions />
   </Suspense>
   ```

---

## 📚 Relacionado

- **Banco de Dados:** [[../Arquitetura/Banco-de-Dados.md]]
- **Contas e Transações:** [[../Fluxos/Contas-e-Transacoes.md]]
- **TransactionForm:** [[TransactionForm.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
