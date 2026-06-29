# 🔍 DESIGN-AUDIT.md — Análise Visual & Recomendações

**Data:** 2026-06-29  
**Status:** Audit Completo  
**Prioridade:** 3 issues críticas, 7 issues médias

---

## 📊 Resumo Executivo

### Score Visual Atual

```
Consistência:          7/10  ⚠️
Hierarquia:           6/10  ⚠️
Espaçamento:          7/10  ⚠️
Cores/Contraste:      9/10  ✅
Tipografia:           7/10  ⚠️
Responsividade:       8/10  ✅
Acessibilidade:       8/10  ✅
─────────────────────────────
SCORE GERAL:          7.7/10  🟡 BOM (pode melhorar)
```

### Áreas Críticas

🔴 **Crítico:**
1. Inconsistência de padding em cards
2. Falta de estados visuais claros em forms (erro/validação)
3. Espaçamento entre componentes sem padrão

🟡 **Médio:**
4. Hover/focus states não padronizados
5. Empty states inconsistentes
6. Charts sem labels visuais claros
7. Mobile layout com gaps excessivos

🟢 **Bom:**
- Contraste de cores excelente
- Sistema de cores coeso
- Componentes Radix UI bem estruturados

---

## 🎨 Análise Detalhada por Componente

### 1. TransactionForm — 🔴 Crítico

**Localização:** `src/components/transaction-form.tsx`

**Problemas Identificados:**

```jsx
// ❌ Problema 1: Sem validação visual de erro
<Input name="amount" type="number" />
// Se erro de validação, usuário não vê mensagem clara

// ❌ Problema 2: Dialog padding inconsistente
<DialogContent>  {/* default: p-6 */}
  <form>
    <Label>Valor</Label>
    <Input />  {/* p-3 — diferente de Card! */}
  </form>
</DialogContent>

// ❌ Problema 3: Sem feedback visual durante submit
{mutation.isPending && <Spinner />}  // não há spinner
// Botão fica desabilitado mas sem feedback claro
```

**Recomendações:**

```jsx
// ✅ Solução 1: Adicionar error feedback
const [errors, setErrors] = useState({});

<div className="grid gap-2">
  <Label htmlFor="amount" className="text-sm font-medium">
    Valor *
  </Label>
  <Input
    id="amount"
    type="number"
    name="amount"
    className={errors.amount ? "border-destructive" : ""}
    placeholder="0.00"
  />
  {errors.amount && (
    <p className="text-xs text-destructive font-medium">
      {errors.amount}
    </p>
  )}
</div>

// ✅ Solução 2: Loading state em botão
<Button
  disabled={mutation.isPending}
  className="gap-2"
>
  {mutation.isPending ? (
    <>
      <Loader className="animate-spin h-4 w-4" />
      Salvando...
    </>
  ) : (
    "Confirmar"
  )}
</Button>

// ✅ Solução 3: Unificar padding
<DialogContent className="p-0">
  <DialogHeader className="px-6 pt-6 pb-4" />
  <form className="px-6 space-y-4">
    {/* inputs aqui */}
  </form>
  <DialogFooter className="px-6 pb-6 pt-4 border-t" />
</DialogContent>
```

**Prioridade:** 🔴 CRÍTICO  
**Tempo de Fix:** ~1 hora  
**Impacto:** UX clara e profissional

---

### 2. Cards — 🟡 Médio

**Localização:** `src/components/ui/card.tsx`

**Problemas:**

```jsx
// ❌ Padding inconsistente
<Card>
  <CardHeader className="p-6 pb-3" />  // 24px
  <CardContent className="p-6 pt-0" />  // 24px mas pt-0
  <CardFooter className="p-6 pt-0" />   // Confuso
</Card>

// Problema: pt-0 acumula padding inconsistente
// Card header + content + footer fica visualmente desbalanceado
```

**Recomendação:**

```jsx
// ✅ Estrutura unificada
<Card className="overflow-hidden">
  <CardHeader className="px-6 py-4 border-b border-border">
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent className="p-6">
    {children}
  </CardContent>
  <CardFooter className="px-6 py-4 border-t border-border bg-muted/30">
    {actions}
  </CardFooter>
</Card>

// Benefícios:
// - Border top/bottom clarifica seções
// - Padding consistente (24px interno)
// - Background footer suave = hierarquia visual
```

**Prioridade:** 🟡 MÉDIO  
**Tempo:** ~30 min  
**Impacto:** Melhor organização visual

---

### 3. Button Variants — 🟡 Médio

**Localização:** `src/components/ui/button.tsx`

**Problemas:**

```jsx
// ❌ Ghost variant pouco contraste
variant: "ghost"
// Background: transparent, text: foreground
// Em fundo muted, fica invisível

// ❌ Size sm muito pequeno para ações
size: "sm"  // 32px, padding reduzido
// Difícil clicar em mobile (min 44px × 44px)
```

**Recomendação:**

```jsx
// ✅ Adicionar variant "subtle"
const buttonVariants = cva(..., {
  variants: {
    variant: {
      // ... existing ...
      subtle:
        "bg-muted/50 text-foreground hover:bg-muted hover:text-accent-foreground transition-colors",
    },
  }
});

// ✅ Garantir size mínimo
size: {
  default: "h-10 px-4 py-2",  // 40px mín
  sm: "h-9 px-3",              // 36px — OK
  lg: "h-12 px-6",             // 48px
}

// ✅ Uso prático
<Button variant="subtle" size="sm">
  Ação auxiliar
</Button>
```

---

### 4. Empty States — 🟡 Médio

**Problema:** Inconsistência entre páginas

```jsx
// Página A: Icon grande + texto
// Página B: Icon pequeno + falta descrição
// Página C: Sem ícone, apenas texto

// Resultado: Experiência confusa
```

**Padrão Recomendado:**

```tsx
// Criar componente reutilizável
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      <div className="mb-4 rounded-full bg-muted p-3">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Título */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>

      {/* Descrição */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6 text-center">
          {description}
        </p>
      )}

      {/* CTA */}
      {action && <div>{action}</div>}
    </div>
  );
}

// Uso:
<EmptyState
  icon={PlusCircle}
  title="Nenhuma transação"
  description="Comece adicionando sua primeira transação para ver o histórico aqui."
  action={<Button>+ Criar transação</Button>}
/>
```

**Prioridade:** 🟡 MÉDIO  
**Tempo:** ~45 min  
**Impacto:** Melhor UX em estados vazios

---

### 5. Tables — 🟡 Médio

**Localização:** `src/components/ui/table.tsx`

**Problemas:**

```jsx
// ❌ Sem hover visual
<TableRow className="border-b transition-colors hover:bg-muted/50">

// ❌ Header sem contraste suficiente
<TableHead className="h-10 px-2 text-left text-muted-foreground">
// muted-foreground sobre card é baixo contraste

// ❌ Sem sticky header em scroll
// Em lista grande, user perde contexto das colunas
```

**Recomendação:**

```jsx
// ✅ Melhorar header contraste
<TableHead className="
  h-10 px-4 py-3
  font-semibold text-sm
  text-foreground
  bg-muted/50
  sticky top-0
  border-b border-border
">

// ✅ Melhorar row hover
<TableRow className="
  border-b
  hover:bg-accent/5
  transition-colors duration-150
  cursor-pointer
  data-[state=selected]:bg-muted
">

// ✅ Adicionar alternating rows para legibilidade
// (stripe pattern)
"[&:nth-child(even)]:bg-muted/20"
```

---

### 6. Charts (Recharts) — 🟡 Médio

**Problema:** Falta contexto visual

```jsx
// ❌ Chart sem labels claros
<ResponsiveContainer>
  <BarChart data={data}>
    <Bar dataKey="value" fill="#currentColor" />
  </BarChart>
</ResponsiveContainer>

// Usuário não sabe o que significa cada barra
```

**Recomendação:**

```jsx
// ✅ Adicionar labels e legenda
<ChartContainer config={chartConfig}>
  <ResponsiveContainer>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip
        contentStyle={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
        }}
      />
      <Legend />
      <Bar dataKey="receitas" fill="var(--chart-1)" name="Receitas" />
      <Bar dataKey="despesas" fill="var(--chart-2)" name="Despesas" />
    </BarChart>
  </ResponsiveContainer>
</ChartContainer>
```

**Prioridade:** 🟡 MÉDIO  
**Tempo:** ~1 hora  
**Impacto:** Melhor data literacy

---

### 7. Forms — Validação — 🔴 Crítico

**Problema:** Sem feedback de validação

```jsx
// ❌ Campo com erro invisível
<Input name="email" type="email" />
// Se inválido, usuário descobre na submissão

// ❌ Sem visual feedback de obrigatoriedade
<Label>Email</Label>
// Campo obrigatório? Não está claro
```

**Recomendação:**

```jsx
export function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div className={error ? "ring-1 ring-destructive rounded-md overflow-hidden" : ""}>
        {children}
      </div>
      {error && (
        <p className="text-xs text-destructive font-medium">
          ✕ {error}
        </p>
      )}
    </div>
  );
}

// Uso:
<FormField
  label="Email"
  required
  error={errors.email}
>
  <Input
    type="email"
    placeholder="seu@email.com"
    className={errors.email ? "border-destructive" : ""}
  />
</FormField>
```

**Prioridade:** 🔴 CRÍTICO  
**Tempo:** ~2 horas  
**Impacto:** UX profissional

---

## 🎯 Recomendações de Espaçamento

### Problema Atual

```jsx
// Inconsistência em gaps
<div className="grid gap-4">  // 16px
  <Card />
  <Card />
</div>

<div className="grid gap-6">  // 24px
  <Card />
  <Card />
</div>

// Qual usar? Sem padrão claro
```

### Padrão Recomendado

```
┌─────────────────────────────────────┐
│   ESPAÇAMENTO PADRÃO FINFLOW         │
├─────────────────────────────────────┤
│                                     │
│  gap-2 (8px)   — items muito perto  │
│  gap-3 (12px)  — compact layouts    │
│  gap-4 (16px)  — PADRÃO (items)     │
│  gap-6 (24px)  — seções             │
│  gap-8 (32px)  — major sections     │
│  gap-12 (48px) — page sections      │
│                                     │
│  REGRA:                             │
│  • Items → gap-4                    │
│  • Cards em grid → gap-6            │
│  • Sections → gap-8+                │
│                                     │
└─────────────────────────────────────┘
```

---

## 🚨 Checklist de Implementação

### Fase 1 — Crítico (1 sprint)

- [ ] **TransactionForm** validação visual
  - Adicionar error messages em vermelho
  - Loading state em botão
  - Unificar padding

- [ ] **Forms** — padrão de validação
  - Criar componente `FormField`
  - Indicar campos obrigatórios com `*`
  - Error messages consistentes

### Fase 2 — Médio (2 sprints)

- [ ] **Cards** — padding unificado
- [ ] **Tables** — sticky header + contraste
- [ ] **EmptyStates** — componente reutilizável
- [ ] **Charts** — labels + legenda

### Fase 3 — Melhorias (3+ sprints)

- [ ] Skeleton loaders em loading states
- [ ] Animations/transitions suaves
- [ ] Theme switcher light/dark
- [ ] Storybook com todos componentes

---

## 🎯 Métricas de Sucesso

```
Antes:               Depois:
─────────────────────────────────
Validação: 0%   →   100%
Consistency: 70% →   95%
Empty states: 60% →  100%
Contraste: 90%  →   100%
Mobile UX: 75%  →   90%
```

---

## 📁 Arquivos a Modificar

| Arquivo | Tipo | Prioridade |
|---------|------|-----------|
| `src/components/transaction-form.tsx` | Fix | 🔴 CRÍTICO |
| `src/components/ui/card.tsx` | Enhance | 🟡 MÉDIO |
| `src/components/ui/button.tsx` | Enhance | 🟡 MÉDIO |
| `src/components/page.tsx` | Create | 🟡 MÉDIO |
| `src/components/ui/table.tsx` | Enhance | 🟡 MÉDIO |
| Todas routes | Audit | 🟡 MÉDIO |

---

## 💡 Quick Wins (implementar em 1 dia)

```jsx
// 1. Adicionar focus ring em todos inputs
input::focus-visible {
  @apply ring-1 ring-primary ring-offset-background;
}

// 2. Melhorar Button hover
button:not(:disabled):hover {
  @apply transition-all duration-150;
}

// 3. Adicionar border a Cards
className="rounded-lg border border-border shadow-sm"

// 4. Melhorar Label tipografia
<Label className="text-sm font-medium text-foreground">
```

---

## 🔗 Referências

- [[DESIGN.md]] — Sistema de Design completo
- [[docs/Sistemas/TransactionForm.md]] — Especificação TransactionForm
- https://www.nngroup.com/articles/form-design-patterns/
- https://uxdesign.cc/empty-states-a-design-perspective-e66da26bf70b

---

**Status:** ✅ Audit Completo  
**Próximos Passos:** Implementar Fase 1  
**Estimated Work:** ~8 horas (1 sprint)
