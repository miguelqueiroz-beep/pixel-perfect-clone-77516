import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBudgets, useCategories, useMonthTransactions } from "@/lib/queries";
import { PageContainer, PageHeader, EmptyState } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatMoney, firstOfMonth, toISODate, monthLabel } from "@/lib/format";
import { Plus, PiggyBank, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({ meta: [{ title: "Orçamentos — FinFlow" }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const ref = toISODate(firstOfMonth());
  const { data: budgets = [], isLoading } = useBudgets(ref);
  const { data: categories = [] } = useCategories();
  const { data: tx = [] } = useMonthTransactions();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"general" | "category">("general");
  const qc = useQueryClient();

  const expenseByCategory = useMemo(() => {
    const m = new Map<string, number>();
    let total = 0;
    for (const t of tx) {
      if (t.kind !== "expense" || t.status !== "paid") continue;
      m.set(t.category_id, (m.get(t.category_id) || 0) + Number(t.amount));
      total += Number(t.amount);
    }
    return { byCategory: m, total };
  }, [tx]);

  const catById = new Map(categories.map((c) => [c.id, c] as const));
  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  const create = useMutation({
    mutationFn: async (input: { scope: "general" | "category"; category_id: string | null; limit_amount: number }) => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Sessão expirada");
      const { error } = await supabase.from("budgets").insert({
        user_id: userId,
        scope: input.scope,
        category_id: input.category_id,
        limit_amount: input.limit_amount,
        reference_month: ref,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Orçamento criado");
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setOpen(false);
    },
    onError: () => toast.error("Já existe um orçamento para esse escopo neste mês."),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Orçamento removido");
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const scopeVal = String(fd.get("scope")) as "general" | "category";
    create.mutate({
      scope: scopeVal,
      category_id: scopeVal === "category" ? String(fd.get("category_id")) : null,
      limit_amount: Number(fd.get("limit_amount")),
    });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Orçamentos"
        description={`Limites para ${monthLabel(new Date())}.`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="size-4" /> Novo orçamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo orçamento</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Escopo</Label>
                  <Select name="scope" value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral (todas as despesas)</SelectItem>
                      <SelectItem value="category">Por categoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {scope === "category" && (
                  <div className="space-y-1.5">
                    <Label>Categoria</Label>
                    <Select name="category_id" defaultValue={expenseCategories[0]?.id}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="limit_amount">Valor limite (R$)</Label>
                  <Input id="limit_amount" name="limit_amount" type="number" step="0.01" min="0.01" required />
                </div>
                <Button type="submit" disabled={create.isPending} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                  {create.isPending ? "Salvando..." : "Salvar orçamento"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 card-surface animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Nenhum orçamento neste mês"
          description="Crie um orçamento geral ou por categoria para receber alertas ao se aproximar do limite."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const spent = b.scope === "general"
              ? expenseByCategory.total
              : expenseByCategory.byCategory.get(b.category_id!) || 0;
            const pct = Math.min(999, Math.round((spent / Number(b.limit_amount)) * 100));
            const tone = pct >= 100 ? "destructive" : pct >= 75 ? "warning" : "success";
            const toneColor = tone === "destructive" ? "oklch(0.65 0.22 22)" : tone === "warning" ? "oklch(0.78 0.16 75)" : "oklch(0.74 0.16 165)";
            return (
              <div key={b.id} className="card-surface p-5 relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {b.scope === "general" ? "Geral" : "Categoria"}
                    </p>
                    <h3 className="font-semibold">
                      {b.scope === "general" ? "Todas as despesas" : catById.get(b.category_id!)?.name || "—"}
                    </h3>
                  </div>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => del.mutate(b.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-2xl font-bold tabular-nums">{formatMoney(spent)}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">de {formatMoney(b.limit_amount)}</span>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full transition-all" style={{ width: Math.min(100, pct) + "%", background: toneColor }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {pct}% usado
                  {pct >= 100 && (
                    <span className="text-destructive font-medium"> · excedido em {formatMoney(spent - Number(b.limit_amount))}</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
