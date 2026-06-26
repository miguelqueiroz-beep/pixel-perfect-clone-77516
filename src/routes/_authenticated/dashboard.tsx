import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAccounts, useCategories, useMonthTransactions, useGoals } from "@/lib/queries";
import { PageContainer, PageHeader, StatCard, EmptyState } from "@/components/page";
import { TransactionFormDialog } from "@/components/transaction-form";
import { formatMoney, formatDate, monthLabel } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, Target, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FinFlow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: tx = [], isLoading } = useMonthTransactions();
  const { data: goals = [] } = useGoals();

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of tx) {
      if (t.status !== "paid") continue;
      if (t.kind === "income") income += Number(t.amount);
      else expense += Number(t.amount);
    }
    const accountsBalance = accounts.reduce((s, a) => s + Number(a.initial_balance), 0);
    const balance = accountsBalance + income - expense;
    return { income, expense, balance, savings: income - expense };
  }, [tx, accounts]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tx) {
      if (t.kind !== "expense" || t.status !== "paid") continue;
      map.set(t.category_id, (map.get(t.category_id) || 0) + Number(t.amount));
    }
    const catName = new Map(categories.map((c) => [c.id, c.name] as const));
    const catColor = new Map(categories.map((c) => [c.id, c.color] as const));
    return Array.from(map.entries())
      .map(([id, value]) => ({ name: catName.get(id) || "—", value, color: catColor.get(id) || "#10B981" }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [tx, categories]);

  const dailyFlow = useMemo(() => {
    const today = new Date();
    const days = today.getDate();
    const arr = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      income: 0,
      expense: 0,
    }));
    for (const t of tx) {
      if (t.status !== "paid") continue;
      const d = new Date(t.date + "T00:00:00").getDate();
      if (d < 1 || d > days) continue;
      if (t.kind === "income") arr[d - 1].income += Number(t.amount);
      else arr[d - 1].expense += Number(t.amount);
    }
    return arr;
  }, [tx]);

  const recent = tx.slice(0, 6);
  const accountById = new Map(accounts.map((a) => [a.id, a] as const));
  const categoryById = new Map(categories.map((c) => [c.id, c] as const));

  return (
    <PageContainer>
      <PageHeader
        title="Olá 👋"
        description={`Resumo de ${monthLabel(new Date())}`}
        actions={<TransactionFormDialog />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Saldo total" value={formatMoney(totals.balance)} icon={Wallet} />
        <StatCard label="Receitas no mês" value={formatMoney(totals.income)} tone="success" icon={ArrowUpRight} />
        <StatCard label="Despesas no mês" value={formatMoney(totals.expense)} tone="destructive" icon={ArrowDownRight} />
        <StatCard
          label="Economia"
          value={formatMoney(totals.savings)}
          tone={totals.savings >= 0 ? "success" : "destructive"}
          icon={TrendingUp}
          hint={totals.income > 0 ? `${Math.round((totals.savings / totals.income) * 100)}% da receita` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* Fluxo diário */}
        <div className="card-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Fluxo do mês</h3>
              <p className="text-xs text-muted-foreground">Receitas vs. despesas por dia</p>
            </div>
          </div>
          {dailyFlow.length === 0 ? (
            <div className="h-56 grid place-items-center text-muted-foreground text-sm">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyFlow}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.74 0.16 165)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="oklch(0.74 0.16 165)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.22 22)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.65 0.22 22)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.014 230 / 0.4)" />
                <XAxis dataKey="day" stroke="oklch(0.66 0.018 230)" fontSize={11} />
                <YAxis stroke="oklch(0.66 0.018 230)" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.205 0.015 230)",
                    border: "1px solid oklch(0.28 0.014 230)",
                    borderRadius: 8,
                    color: "oklch(0.96 0.005 230)",
                  }}
                  formatter={(v: number) => formatMoney(v)}
                  labelFormatter={(l) => `Dia ${l}`}
                />
                <Area type="monotone" dataKey="income" stroke="oklch(0.74 0.16 165)" fill="url(#inc)" name="Receita" />
                <Area type="monotone" dataKey="expense" stroke="oklch(0.65 0.22 22)" fill="url(#exp)" name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Categorias */}
        <div className="card-surface p-5">
          <h3 className="font-semibold mb-1">Top categorias</h3>
          <p className="text-xs text-muted-foreground mb-4">Despesas por categoria</p>
          {byCategory.length === 0 ? (
            <div className="h-56 grid place-items-center text-muted-foreground text-sm">Sem despesas</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2}>
                    {byCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.205 0.015 230)",
                      border: "1px solid oklch(0.28 0.014 230)",
                      borderRadius: 8,
                      color: "oklch(0.96 0.005 230)",
                    }}
                    formatter={(v: number) => formatMoney(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 mt-2">
                {byCategory.slice(0, 4).map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{formatMoney(c.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* Recent transactions */}
        <div className="card-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Últimas movimentações</h3>
            <Link to="/transactions" className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Nenhuma transação ainda"
              description="Registre sua primeira receita ou despesa para começar."
              action={<TransactionFormDialog />}
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((t) => {
                const cat = categoryById.get(t.category_id);
                const acc = accountById.get(t.account_id);
                return (
                  <li key={t.id} className="py-3 flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg grid place-items-center text-xs font-medium"
                      style={{ background: (cat?.color || "#10B981") + "33", color: cat?.color || "#10B981" }}
                    >
                      {cat?.name.slice(0, 1) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description || cat?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat?.name} · {acc?.name} · {formatDate(t.date)}
                        {t.installment_total ? ` · ${t.installment_number}/${t.installment_total}` : ""}
                      </p>
                    </div>
                    <div className={"text-sm font-semibold tabular-nums " + (t.kind === "income" ? "text-success" : "text-destructive")}>
                      {t.kind === "income" ? "+" : "−"} {formatMoney(Number(t.amount))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Metas */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Metas</h3>
            <Link to="/goals" className="text-xs text-primary hover:underline">Gerenciar</Link>
          </div>
          {goals.length === 0 ? (
            <EmptyState icon={Target} title="Sem metas ainda" description="Crie uma meta para visualizar o progresso aqui." />
          ) : (
            <ul className="space-y-4">
              {goals.slice(0, 3).map((g) => {
                const pct = Math.min(100, Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100));
                return (
                  <li key={g.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{g.name}</span>
                      <span className="text-muted-foreground tabular-nums">{pct}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full gradient-primary" style={{ width: pct + "%" }} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {formatMoney(g.saved_amount)} / {formatMoney(g.target_amount)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
