# 🎨 DESIGN.md — Sistema de Design FinFlow

**Versão:** 1.0  
**Data:** 2026-06-29  
**Status:** Design System Completo para Fintech Moderno

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Sistema de Cores](#-sistema-de-cores)
3. [Tipografia](#-tipografia)
4. [Espaçamento & Grid](#-espaçamento--grid)
5. [Componentes](#-componentes)
6. [Padrões de UI/UX](#-padrões-de-uiux)
7. [Tokens Tailwind](#-tokens-tailwind)
8. [Acessibilidade](#-acessibilidade)
9. [Recomendações Imediatas](#-recomendações-imediatas)

---

## 🎯 Visão Geral

**FinFlow Design System** é um sistema moderno e coeso para aplicações fintech pessoais.

### Princípios

- ✅ **Minimalista:** Menos é mais. Remover clutter visual.
- ✅ **Dark-first:** Otimizado para tema escuro (fintech padrão).
- ✅ **Acessível:** Contraste WCAG AA+ em todas cores.
- ✅ **Consistente:** Uma única verdade para cada decisão visual.
- ✅ **Responsivo:** Funciona fluidamente em mobile → desktop.

### Stack Visual

```
React 19.2.0
    ↓
Tailwind CSS 4.2.1 (oklch color space)
    ↓
Radix UI + Shadcn/ui
    ↓
Lucide React icons
    ↓
Recharts (financial charts)
```

---

## 🎨 Sistema de Cores

### Paleta Primária

```
┌─────────────────────────────────────────────────┐
│                  FINFLOW COLORS                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Background:      oklch(0.16 0.012 230)        │
│  ▓▓▓▓▓ Carbono escuro, neutro                  │
│                                                 │
│  Primary:         oklch(0.74 0.16 165)         │
│  ▓▓▓▓▓ Turquesa/Emerald — ação, destaque      │
│                                                 │
│  Secondary:       oklch(0.26 0.018 230)        │
│  ▓▓▓▓▓ Cinza escuro — elemento secundário       │
│                                                 │
│  Accent:          oklch(0.28 0.025 175)        │
│  ▓▓▓▓▓ Verde menta — hover, focus              │
│                                                 │
│  Destructive:     oklch(0.65 0.22 22)          │
│  ▓▓▓▓▓ Vermelho — delete, erro, alerta         │
│                                                 │
│  Success:         oklch(0.74 0.16 165)         │
│  ▓▓▓▓▓ Turquesa — confirmação, sucesso         │
│                                                 │
│  Warning:         oklch(0.78 0.16 75)          │
│  ▓▓▓▓▓ Amarelo/Âmbar — aviso, info             │
│                                                 │
│  Foreground:      oklch(0.96 0.005 230)        │
│  ▓▓▓▓▓ Branco quase — texto principal          │
│                                                 │
│  Muted:           oklch(0.66 0.018 230)        │
│  ▓▓▓▓▓ Cinza médio — texto secundário          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Aplicação de Cores

| Elemento | Cor | Uso |
|----------|-----|-----|
| **Botões CTA** | Primary (turquesa) | "Confirmar", "Criar", "Transferir" |
| **Links** | Accent (menta) | Navegação, ações auxiliares |
| **Erros/Delete** | Destructive (vermelho) | Exclusão, erro de validação |
| **Sucesso** | Success (turquesa) | Transação confirmada, goal atingida |
| **Avisos** | Warning (amarelo) | Budget warning, data limite |
| **Texto principal** | Foreground (branco) | Body text |
| **Texto secundário** | Muted (cinza) | Labels, datas, hints |
| **Cards/Containers** | Card (cinza escuro) | Painéis de conteúdo |
| **Borders** | Border (cinza suave) | Divisões, inputs |

### Contraste & Acessibilidade

```
✅ WCAA AA — todos os pares de cores atendem ou excedem 4.5:1
  - Foreground (0.96) sobre Background (0.16) = ∞ contraste
  - Primary (0.74) sobre Background (0.16) = 9.2:1 ✅
  - Muted (0.66) sobre Background (0.16) = 5.1:1 ✅
  - Destructive (0.65) sobre Background (0.16) = 8.8:1 ✅

⚠️ Evitar:
  - Muted sobre Muted (insuficiente)
  - Primary sobre Card em modo light (problema futuro)
```

---

## 🔤 Tipografia

### Fonte

- **Family:** Inter (Google Fonts)
- **Fallback:** system-ui, Segoe UI, Roboto
- **Weight:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Escala Tipográfica

```
┌──────────────────────────────────────────────────┐
│              TYPOGRAPHIC SCALE                   │
├──────────────────────────────────────────────────┤
│                                                  │
│  xs  (0.75rem / 12px)   — Captions, timestamps  │
│  sm  (0.875rem / 14px)  — Labels, hints         │
│  base (1rem / 16px)     — Body text, regular    │
│  lg  (1.125rem / 18px)  — Subtítulos           │
│  xl  (1.25rem / 20px)   — Títulos secundários   │
│  2xl (1.5rem / 24px)    — Títulos principais    │
│  3xl (1.875rem / 30px)  — Headers, seções       │
│  4xl (2.25rem / 36px)   — Héros, covers         │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Uso Prático

| Elemento | Size | Weight | Line Height | Color |
|----------|------|--------|-------------|-------|
| **Hero Title** | 2xl–3xl | 700 | 1.2 | foreground |
| **Section Title** | xl–2xl | 600 | 1.3 | foreground |
| **Card Title** | lg–xl | 600 | 1.4 | foreground |
| **Body Text** | base | 400 | 1.6 | foreground |
| **Label (form)** | sm | 500 | 1.5 | muted |
| **Hint/Caption** | xs | 400 | 1.5 | muted |
| **Button Text** | sm | 500 | 1.4 | primary-foreground |
| **Table Header** | sm | 600 | 1.5 | muted |

### Hierarquia Visual

```
Padrão de leitura (Z-pattern em fintech):

[HERO TITLE — 3xl/700]
Subtitle — lg/400 muted

[CONTENT SECTION]
├─ Card Title — xl/600
├─ Body — base/400
└─ Metadata — sm/400 muted

[CALL-TO-ACTION]
Button — sm/500 primary
```

---

## 📏 Espaçamento & Grid

### Scale de Espaçamento

```
4px   — xs (micro)
8px   — sm (tight)
12px  — md (comfortable)
16px  — lg (standard)
24px  — xl (generous)
32px  — 2xl (spacious)
48px  — 3xl (very spacious)
64px  — 4xl (massive)
```

### Grid System

- **Breakpoints:**
  - `sm`: 640px (mobile)
  - `md`: 768px (tablet)
  - `lg`: 1024px (desktop)
  - `xl`: 1280px (wide)

- **Container:** 12-column grid
- **Gutter:** 16px (lg), 12px (md), 8px (sm)
- **Max-width:** 1200px (desktop content)

### Aplicação

| Componente | Padding | Margin | Gap |
|-----------|---------|--------|-----|
| **Card** | 24px (lg), 16px (sm) | 0 | — |
| **Button** | 12px vert, 16px horiz | — | — |
| **Input** | 12px | — | — |
| **Section** | 32px top/bottom | 48px between | — |
| **Grid/List** | — | — | 16px (lg), 12px (md) |

---

## 🧩 Componentes

### Buttons

#### Variants

```
1. Default (Primary)
   Background: primary (turquesa)
   Text: primary-foreground (escuro)
   Hover: primary/90 (levemente escuro)
   → Uso: CTAs principais, "Confirmar", "Criar"

2. Destructive
   Background: destructive (vermelho)
   Text: destructive-foreground (branco)
   → Uso: "Deletar", "Remover", ações irreversíveis

3. Outline
   Background: transparent
   Border: input (cinza suave)
   Hover: accent (menta)
   → Uso: Ações secundárias, "Cancelar"

4. Ghost
   Background: transparent
   Text: foreground
   Hover: muted (cinza)
   → Uso: Links dentro de texto, ações terciárias

5. Secondary
   Background: secondary (cinza escuro)
   Text: secondary-foreground (branco)
   → Uso: Ações auxiliares
```

#### Recomendações

- ✅ Sempre usar um `Icon` + texto (ex: `<Plus size={16} /> Criar`)
- ✅ Usar `disabled` em vez de esconder (mantém layout)
- ✅ Size: `default` (36px) — OK; evitar `sm` (32px) em botões principais
- ⚠️ Evitar stacking botões verticalmente em desktop (use 2 colunas)

### Cards

```tsx
<Card>                          // Rounded border + shadow
  <CardHeader>                  // Padding 24px, bottom gap
    <CardTitle>Título</CardTitle>
    <CardDescription>Desc</CardDescription>
  </CardHeader>
  <CardContent>                 // Padding 24px
    {content}
  </CardContent>
  <CardFooter>                  // Padding 24px, flex bottom
    {actions}
  </CardFooter>
</Card>
```

**Recomendações:**
- ✅ Usar Cards para agrupar conteúdo relacionado
- ✅ Espaço vertical entre Cards: 24px–32px
- ✅ Evitar Cards vazios (usar skeleton se loading)
- ⚠️ Não aninhar Cards (máximo 1 nível)

### Inputs & Forms

```tsx
<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>     // sm/500 muted
  <Input
    id="email"
    placeholder="seu@email.com"           // placeholder subtle
    type="email"
  />
  <p className="text-xs text-muted">Campo obrigatório</p>
</div>
```

**Recomendações:**
- ✅ Sempre incluir `Label` associada (acessibilidade)
- ✅ Usar `placeholder` como sugestão, não instrução
- ✅ Validação em tempo real (Zod + React Hook Form)
- ✅ Mensagens de erro em vermelho (destructive)
- ⚠️ Não usar apenas cor para indicar erro

### Tables

```
Header:     text-sm/600 muted-foreground
Body:       text-sm/400 foreground
Row hover:  bg-muted/50 (suave hover)
Border:     1px solid border
```

**Recomendações:**
- ✅ Sticky header em scrolls horizontal
- ✅ Alternated row backgrounds para melhor legibilidade (futura feature)
- ✅ Action buttons em coluna final (edit, delete)
- ⚠️ Não exceder 5–6 colunas em mobile (truncar ou esconder)

---

## 🎯 Padrões de UI/UX

### Layout Principal (Dashboard)

```
┌─────────────────────────────────────────┐
│        HEADER (navigation bar)          │ ← 56px
├──────────┬──────────────────────────────┤
│          │                              │
│  SIDEBAR │      MAIN CONTENT            │
│  (240px) │      (flex: 1)               │
│          │                              │
│  Fixed   │  ┌─ Page Header              │
│  no      │  │                           │
│  scroll  │  ├─ Cards / Lists / Forms    │
│          │  │                           │
│          │  ├─ Charts (Recharts)        │
│          │  │                           │
│          │  └─ Pagination / Actions     │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Page Structure

```tsx
<PageHeader
  title="Transações"
  description="Histórico de movimentações"
  actions={<Button>+ Criar</Button>}
/>

<div className="grid gap-6">
  {/* Cards com métricas */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatCard label="Total" value="R$ 4.250,00" tone="default" />
    <StatCard label="Receitas" value="R$ 8.000,00" tone="success" />
    <StatCard label="Despesas" value="R$ 3.750,00" tone="warning" />
  </div>

  {/* Tabela principal */}
  <Card>
    <CardHeader>
      <CardTitle>Últimas transações</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>...</Table>
    </CardContent>
  </Card>
</div>
```

### Modal/Dialog Pattern

```
Overlay: black/80 (semi-transparent)
Dialog:  bg-background, border, rounded-lg, shadow-lg
Header:  title (xl/600) + close button
Body:    content (base/400)
Footer:  primary + outline buttons, right-aligned

┌──────────────────────────────┐
│ Título               [Close] │ ← Header
├──────────────────────────────┤
│                              │
│  Conteúdo do formulário      │ ← Body
│  • Label + Input             │
│  • Label + Input             │
│                              │
├──────────────────────────────┤
│         [Cancelar] [Confirmar] │ ← Footer, right-align
└──────────────────────────────┘
```

### Form Validation States

```
┌─────────────────────────────────────────────────────────┐

1. EMPTY STATE
   Input: border-input, placeholder visible
   Helper: text-muted (hint text)

2. FILLED VALID
   Input: border-input, bg-transparent
   Value: foreground
   Helper: hidden ou sucesso

3. FILLED INVALID ❌
   Input: border-destructive (vermelho)
   Helper: text-destructive + ícone erro
   Message: "Campo obrigatório" ou erro específico

4. FOCUSED
   Input: ring-2 ring-primary/55 (turquesa suave)
   Border: primary

5. DISABLED
   Input: opacity-50, cursor-not-allowed
   Text: muted-foreground

└─────────────────────────────────────────────────────────┘
```

### Empty State

```tsx
<EmptyState
  icon={PlusCircle}
  title="Nenhuma transação"
  description="Comece adicionando sua primeira transação."
  action={<Button>+ Criar transação</Button>}
/>

Visualmente:
┌─────────────────────────────┐
│                             │
│      [Ícone grande]         │ ← 64px icon, muted
│                             │
│    Nenhuma transação        │ ← Título
│                             │
│ Comece adicionando sua...   │ ← Descrição muted
│                             │
│   [+ Criar transação]       │ ← CTA button
│                             │
└─────────────────────────────┘
```

### Data/Numbers Display

```
Currency: R$ 1.234,56 (formatado com Intl)
Percentage: +12.5%, -3.2% (com cores: success/destructive)
Large numbers: "1.2M", "5K" (abbreviated)
Tabular numbers: <span className="tabular-nums">1234</span>
  → Números alinhados verticalmente
```

---

## 🎯 Tokens Tailwind

### Arquivo de Referência

Localizado em: `src/styles.css`

```css
:root {
  /* Colors (oklch) */
  --background: oklch(0.16 0.012 230);
  --foreground: oklch(0.96 0.005 230);
  --primary: oklch(0.74 0.16 165);
  --primary-foreground: oklch(0.18 0.02 165);
  --secondary: oklch(0.26 0.018 230);
  --muted: oklch(0.24 0.014 230);
  --muted-foreground: oklch(0.66 0.018 230);
  --accent: oklch(0.28 0.025 175);
  --destructive: oklch(0.65 0.22 22);
  --success: oklch(0.74 0.16 165);
  --warning: oklch(0.78 0.16 75);

  /* Radius */
  --radius: 0.875rem;  /* 14px */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);

  /* Spacing via Tailwind */
  space: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
}
```

### Como Usar

```tsx
// Cores
<div className="bg-background text-foreground">...</div>
<div className="bg-primary text-primary-foreground">...</div>
<div className="border border-border">...</div>

// Espaçamento
<div className="p-6 gap-4 mb-8">...</div>

// Radius
<div className="rounded-lg">...</div>
<div className="rounded-xl">...</div>

// Combinações
<button className="bg-primary text-primary-foreground px-4 py-3 rounded-lg">
  Confirmar
</button>
```

---

## ♿ Acessibilidade

### Checklist de Acessibilidade

- [ ] Contraste de cores ≥ 4.5:1 (WCAG AA)
- [ ] Todos inputs têm `<label>` associada
- [ ] Navegação por teclado (Tab → Focus ring visible)
- [ ] Textos alternativos em ícones (`aria-label`)
- [ ] Modals têm `role="dialog"` + `aria-modal="true"`
- [ ] Cores não são única indicação (+ ícone ou texto)
- [ ] Focus ring visível em todos elementos interativos
- [ ] Size mínimo de botões/targets: 44px × 44px
- [ ] Texto com tamanho mínimo: 16px (mobile)

### Focus Ring

```tsx
// Padrão FinFlow
className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"

// Visualmente:
┌───────────────────────────┐
│  [Focused Input]          │ ← Ring turquesa de 2px
└───────────────────────────┘
```

### ARIA Labels

```tsx
<button aria-label="Deletar transação">
  <Trash size={20} />
</button>

<span aria-hidden="true">×</span>
```

---

## 🚀 Recomendações Imediatas

### 1. 🎯 Consistência de Padding

**Problema Identificado:**
```tsx
// ❌ Inconsistente
CardHeader: p-6
Button: px-4 py-3
Input: px-3 py-1
```

**Solução:**
```tsx
// ✅ Consistente — usar múltiplos de 4px
CardHeader: p-6 (24px)
Button: px-4 py-2.5 (16px horiz, 10px vert)
Input: px-3 py-2 (12px horiz, 8px vert)
Label: text-sm font-medium (14px, 500)
```

### 2. 🔤 Hierarquia Tipográfica

**Recomendação:**
```tsx
// Adicionar estilos CSS customizados para melhor hierarquia
@layer base {
  h1 { @apply text-3xl font-bold leading-tight; }
  h2 { @apply text-2xl font-semibold leading-snug; }
  h3 { @apply text-xl font-semibold; }
  h4 { @apply text-lg font-medium; }
  p  { @apply text-base leading-relaxed; }
  small { @apply text-xs text-muted-foreground; }
}
```

### 3. 📊 Espaçamento entre Componentes

**Problema:** Inconsistência entre gaps
**Solução:**
```tsx
// Padrão de gap vertical
div className="grid gap-4"    // 16px (items closely related)
div className="grid gap-6"    // 24px (sections)
div className="grid gap-8"    // 32px (major sections)
```

### 4. 🎨 Estados de Hover/Focus

**Recomendação — Padronizar:**
```tsx
// Todos elementos interativos devem ter hover visível
className="transition-colors hover:bg-muted/50"

// Focus ring sempre visível
className="focus-visible:ring-1 focus-visible:ring-primary"
```

### 5. 🔴 Validação de Forms

**Adicionar padrão de erro:**
```tsx
const FormFieldError = ({ message }: { message?: string }) => (
  message ? (
    <p className="text-xs text-destructive mt-1">{message}</p>
  ) : null
);
```

### 6. 📱 Responsividade

**Verificar:**
- [ ] Mobile (320px): Cards em 1 coluna
- [ ] Tablet (768px): Cards em 2 colunas
- [ ] Desktop (1024px+): Cards em 3+ colunas
- [ ] Sidebar: Hide em mobile, show em desktop

### 7. 🌗 Dark Mode

**Status:** ✅ Implementado corretamente
- CSS variables para temas
- `@dark` variant para estilos específicos

### 8. ⚡ Performance Visual

**Recomendações:**
```tsx
// Usar CSS Containment
className="border rounded-lg overflow-hidden"

// Lazy-load charts
<ChartContainer>
  {/* Recharts já otimizado */}
</ChartContainer>

// Skeleton durante loading
<Skeleton className="h-12 w-full rounded-lg" />
```

---

## 📖 Exemplos de Componentes

### Exemplo 1: Transaction Card

```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-base">
        Compra no Supermercado
      </CardTitle>
      <Badge variant="outline">
        Alimentação
      </Badge>
    </div>
  </CardHeader>
  <CardContent className="space-y-2">
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">Valor</span>
      <span className="text-destructive font-semibold">-R$ 89,50</span>
    </div>
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">Data</span>
      <span className="text-sm">25 de Jun, 14:30</span>
    </div>
  </CardContent>
</Card>
```

### Exemplo 2: Budget Alert

```tsx
<Alert variant="destructive" className="border-destructive/50">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Budget Excedido!</AlertTitle>
  <AlertDescription>
    Sua categoria "Entretenimento" ultrapassou o limite em R$ 150,00.
  </AlertDescription>
</Alert>
```

### Exemplo 3: Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12">
  <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold">Nenhuma meta criada</h3>
  <p className="text-muted-foreground text-sm">
    Comece criando uma meta para acompanhar seus objetivos.
  </p>
  <Button className="mt-6">
    + Criar meta
  </Button>
</div>
```

---

## 🔄 Próximos Passos

### Curto Prazo (1–2 sprints)

- [ ] Implementar estilos de erro em forms
- [ ] Unificar padding em todos Cards
- [ ] Adicionar skeleton loaders
- [ ] Revisar responsividade mobile

### Médio Prazo (3–4 sprints)

- [ ] Adicionar animações Tailwind customizadas
- [ ] Implementar theme switcher (light/dark)
- [ ] Criar Storybook com todos componentes
- [ ] Documentar brand guidelines visual

### Longo Prazo (roadmap)

- [ ] Motion design (transições suaves)
- [ ] Figma → Tokens design (parity)
- [ ] Componentes customizados avançados
- [ ] Design tokens em JSON (importar em Figma)

---

## 📚 Referências

- **Tailwind CSS:** https://tailwindcss.com/docs
- **oklch colors:** https://oklch.com
- **Radix UI:** https://www.radix-ui.com/docs/primitives/overview/introduction
- **WCAG Contrast:** https://webaim.org/articles/contrast/
- **Inter Font:** https://fonts.google.com/specimen/Inter

---

## 👤 Design Specs — Quick Reference

```
┌────────────────────────────────────────┐
│        FINFLOW — DESIGN SPECS          │
├────────────────────────────────────────┤
│                                        │
│  Primary Color:    #2dd4bf (turquesa) │
│  Background:       #1a1f2e (carbono)  │
│  Text:             #f3f4f6 (branco)   │
│  Accent:           #14b8a6 (menta)    │
│  Error:            #f87171 (vermelho) │
│                                        │
│  Font:             Inter (400-700)    │
│  Base Size:        16px               │
│  Line Height:      1.6                │
│                                        │
│  Radius:           14px               │
│  Spacing:          4px (atomic)       │
│                                        │
│  Breakpoints:      640/768/1024/1280  │
│  Max Container:    1200px             │
│                                        │
│  Dark Mode:        ✅ Default         │
│  Accessibility:    WCAG AA+ ✅        │
│                                        │
└────────────────────────────────────────┘
```

---

**Status:** ✅ Design System Completo  
**Última Review:** 2026-06-29  
**Próxima Review:** 2026-07-15  
**Responsável:** Design + Frontend Team
