import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts, useTransactions } from "@/lib/queries";
import { PageContainer, PageHeader, EmptyState } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import { Plus, Wallet, CreditCard, PiggyBank, Banknote, TrendingUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: "Contas — FinFlow" }] }),
  component: AccountsPage,
});

const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta corrente", icon: Wallet },
  { value: "savings", label: "Poupança", icon: PiggyBank },
  { value: "wallet", label: "Carteira", icon: Banknote },
  { value: "credit_card", label: "Cartão de crédito", icon: CreditCard },
  { value: "investment", label: "Investimento", icon: TrendingUp },
  { value: "other", label: "Outra", icon: Wallet },
];

function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: tx = [] } = useTransactions({ limit: 1000 });
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const balanceByAccount = new Map<string, number>();
  for (const a of accounts) balanceByAccount.set(a.id, Number(a.initial_balance));
  for (const t of tx) {
    if (t.status !== "paid") continue;
    const cur = balanceByAccount.get(t.account_id) ?? 0;
    balanceByAccount.set(t.account_id, cur + (t.kind === "income" ? Number(t.amount) : -Number(t.amount)));
  }

  const create = useMutation({
    mutationFn: async (input: { name: string; type: string; initial_balance: number; credit_limit?: number }) => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Sessão expirada");
      const { error } = await supabase.from("accounts").insert({
        user_id: userId,
        name: input.name,
        type: input.type,
        initial_balance: input.initial_balance,
        credit_limit: input.credit_limit ?? null,
        color: "#10B981",
        icon: "wallet",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta criada");
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta removida");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: () => toast.error("Não foi possível excluir. Verifique se há transações vinculadas."),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const type = String(fd.get("type"));
    create.mutate({
      name: String(fd.get("name")),
      type,
      initial_balance: Number(fd.get("initial_balance") || 0),
      credit_limit: type === "credit_card" ? Number(fd.get("credit_limit") || 0) : undefined,
    });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Contas"
        description="Suas contas bancárias, carteiras e cartões."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="size-4" /> Nova conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova conta</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" required maxLength={50} placeholder="Ex.: Nubank, Carteira" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select name="type" defaultValue="checking">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="initial_balance">Saldo inicial (R$)</Label>
                  <Input id="initial_balance" name="initial_balance" type="number" step="0.01" defaultValue={0} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="credit_limit">Limite (apenas cartão de crédito)</Label>
                  <Input id="credit_limit" name="credit_limit" type="number" step="0.01" defaultValue={0} />
                </div>
                <Button type="submit" disabled={create.isPending} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                  {create.isPending ? "Criando..." : "Criar conta"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 card-surface animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhuma conta cadastrada" description="Adicione sua primeira conta para começar." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => {
            const TypeIcon = ACCOUNT_TYPES.find((t) => t.value === a.type)?.icon ?? Wallet;
            const balance = balanceByAccount.get(a.id) ?? 0;
            return (
              <div key={a.id} className="card-surface p-5 relative group">
                <div className="flex items-start justify-between">
                  <div className="size-10 rounded-xl grid place-items-center" style={{ background: a.color + "33", color: a.color }}>
                    <TypeIcon className="size-5" />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => del.mutate(a.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <h3 className="mt-3 font-semibold">{a.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {ACCOUNT_TYPES.find((t) => t.value === a.type)?.label}
                </p>
                <div className="mt-4 text-2xl font-bold tabular-nums">{formatMoney(balance)}</div>
                {a.type === "credit_card" && a.credit_limit && (
                  <p className="text-xs text-muted-foreground mt-1">Limite: {formatMoney(a.credit_limit)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
