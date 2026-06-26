import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts, useCategories, useTransactions } from "@/lib/queries";
import { PageContainer, PageHeader, EmptyState } from "@/components/page";
import { TransactionFormDialog } from "@/components/transaction-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate } from "@/lib/format";
import { Search, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transações — FinFlow" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { data: tx = [], isLoading } = useTransactions({ limit: 500 });
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const qc = useQueryClient();

  const catById = new Map(categories.map((c) => [c.id, c] as const));
  const accById = new Map(accounts.map((a) => [a.id, a] as const));

  const filtered = useMemo(() => {
    return tx.filter((t) => {
      if (kindFilter !== "all" && t.kind !== kindFilter) return false;
      if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const cat = catById.get(t.category_id)?.name.toLowerCase() || "";
        return (t.description || "").toLowerCase().includes(s) || cat.includes(s);
      }
      return true;
    });
  }, [tx, kindFilter, categoryFilter, search, catById]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Transação excluída");
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Transações"
        description="Todas as suas receitas e despesas."
        actions={<TransactionFormDialog />}
      />

      <div className="card-surface p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as typeof kindFilter)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Nenhuma transação encontrada"
            description="Ajuste os filtros ou registre uma nova transação."
            action={<TransactionFormDialog />}
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => {
              const cat = catById.get(t.category_id);
              const acc = accById.get(t.account_id);
              return (
                <li key={t.id} className="px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-accent/30">
                  <div
                    className="size-10 rounded-lg grid place-items-center text-sm font-semibold shrink-0"
                    style={{ background: (cat?.color || "#10B981") + "33", color: cat?.color || "#10B981" }}
                  >
                    {cat?.name.slice(0, 1) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description || cat?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat?.name} · {acc?.name} · {formatDate(t.date)}
                      {t.installment_total ? ` · parcela ${t.installment_number}/${t.installment_total}` : ""}
                      {t.status === "pending" ? " · pendente" : ""}
                    </p>
                  </div>
                  <div className={"text-sm font-semibold tabular-nums " + (t.kind === "income" ? "text-success" : "text-destructive")}>
                    {t.kind === "income" ? "+" : "−"} {formatMoney(Number(t.amount))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => del.mutate(t.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Excluir"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
