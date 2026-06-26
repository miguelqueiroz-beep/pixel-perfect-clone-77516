import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAccounts, useCategories } from "@/lib/queries";
import { toISODate } from "@/lib/format";

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "debit", label: "Débito" },
  { value: "credit", label: "Crédito" },
  { value: "cash", label: "Dinheiro" },
  { value: "bank_slip", label: "Boleto" },
  { value: "transfer", label: "Transferência" },
];

const INCOME_TYPES = [
  { value: "salary", label: "Salário" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investimento" },
  { value: "sale", label: "Venda" },
  { value: "gift", label: "Presente" },
  { value: "refund", label: "Reembolso" },
  { value: "dividends", label: "Dividendos" },
  { value: "other", label: "Outros" },
];

const schema = z.object({
  kind: z.enum(["income", "expense"]),
  amount: z.number().positive("Valor deve ser maior que 0"),
  account_id: z.string().uuid("Selecione uma conta"),
  category_id: z.string().uuid("Selecione uma categoria"),
  date: z.string().min(1),
  description: z.string().max(200).optional(),
  payment_method: z.string().optional(),
  income_type: z.string().optional(),
  installments: z.number().int().min(1).max(60).optional(),
});

export function TransactionFormDialog({
  defaultKind = "expense",
  trigger,
}: {
  defaultKind?: "income" | "expense";
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">(defaultKind);
  const [isInstallment, setIsInstallment] = useState(false);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const qc = useQueryClient();

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === kind || c.type === "both"),
    [categories, kind],
  );

  const mutation = useMutation({
    mutationFn: async (input: z.infer<typeof schema>) => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Sessão expirada");

      if (input.kind === "expense" && isInstallment && input.installments && input.installments > 1) {
        const total = input.installments;
        const base = Math.floor((input.amount * 100) / total) / 100;
        const remainder = +(input.amount - base * (total - 1)).toFixed(2);
        const groupId = crypto.randomUUID();
        const startDate = new Date(input.date + "T00:00:00");
        const rows = Array.from({ length: total }).map((_, i) => {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + i);
          return {
            user_id: userId,
            account_id: input.account_id,
            category_id: input.category_id,
            kind: "expense" as const,
            amount: i === total - 1 ? remainder : base,
            description: input.description,
            date: toISODate(d),
            payment_method: input.payment_method,
            installment_group_id: groupId,
            installment_number: i + 1,
            installment_total: total,
            status: d <= new Date() ? "paid" : "pending",
          };
        });
        const { error } = await supabase.from("transactions").insert(rows);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert({
          user_id: userId,
          account_id: input.account_id,
          category_id: input.category_id,
          kind: input.kind,
          amount: input.amount,
          description: input.description,
          date: input.date,
          payment_method: input.kind === "expense" ? input.payment_method : null,
          income_type: input.kind === "income" ? input.income_type : null,
          status: "paid",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Transação registrada!");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      kind,
      amount: Number(fd.get("amount")),
      account_id: fd.get("account_id"),
      category_id: fd.get("category_id"),
      date: fd.get("date"),
      description: (fd.get("description") as string) || undefined,
      payment_method: (fd.get("payment_method") as string) || undefined,
      income_type: (fd.get("income_type") as string) || undefined,
      installments: isInstallment ? Number(fd.get("installments")) : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gradient-primary text-primary-foreground hover:opacity-90">
            <Plus className="size-4" /> Nova transação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
          <DialogDescription>Registre uma receita ou despesa.</DialogDescription>
        </DialogHeader>

        <Tabs value={kind} onValueChange={(v) => setKind(v as "income" | "expense")}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="expense">Despesa</TabsTrigger>
            <TabsTrigger value="income">Receita</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input id="date" name="date" type="date" defaultValue={toISODate(new Date())} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select name="category_id" required>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {visibleCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Conta</Label>
            <Select name="account_id" required defaultValue={accounts[0]?.id}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => !a.is_archived).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {kind === "expense" && (
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select name="payment_method" defaultValue="pix">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {kind === "income" && (
            <div className="space-y-1.5">
              <Label>Tipo de receita</Label>
              <Select name="income_type" defaultValue="salary">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCOME_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {kind === "expense" && (
            <div className="card-surface p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Parcelado</p>
                  <p className="text-xs text-muted-foreground">Divide o valor em múltiplos meses</p>
                </div>
                <Switch checked={isInstallment} onCheckedChange={setIsInstallment} />
              </div>
              {isInstallment && (
                <div className="space-y-1.5">
                  <Label htmlFor="installments">Número de parcelas (2–60)</Label>
                  <Input id="installments" name="installments" type="number" min={2} max={60} defaultValue={2} />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" name="description" rows={2} maxLength={200} />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
            {mutation.isPending ? "Salvando..." : "Salvar transação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
