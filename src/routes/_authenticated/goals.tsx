import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGoals } from "@/lib/queries";
import { PageContainer, PageHeader, EmptyState } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatMoney, formatDateLong, toISODate } from "@/lib/format";
import { Plus, Target, Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Metas — FinFlow" }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const [open, setOpen] = useState(false);
  const [contributeFor, setContributeFor] = useState<string | null>(null);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: { name: string; target_amount: number; deadline: string; priority: "low" | "medium" | "high" }) => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Sessão expirada");
      const { error } = await supabase.from("goals").insert({
        user_id: userId,
        name: input.name,
        target_amount: input.target_amount,
        saved_amount: 0,
        deadline: input.deadline,
        priority: input.priority,
        color: "#10B981",
        icon: "target",
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meta criada");
      qc.invalidateQueries({ queryKey: ["goals"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const contribute = useMutation({
    mutationFn: async (input: { goal_id: string; amount: number; target: number; current: number }) => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Sessão expirada");
      const newSaved = +(input.current + input.amount).toFixed(2);
      const status = newSaved >= input.target ? "completed" : "active";
      const { error: e1 } = await supabase.from("goal_contributions").insert({
        goal_id: input.goal_id, user_id: userId, amount: input.amount, date: toISODate(new Date()),
      });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("goals")
        .update({ saved_amount: newSaved, status })
        .eq("id", input.goal_id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Aporte registrado!");
      qc.invalidateQueries({ queryKey: ["goals"] });
      setContributeFor(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta excluída");
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      name: String(fd.get("name")),
      target_amount: Number(fd.get("target_amount")),
      deadline: String(fd.get("deadline")),
      priority: String(fd.get("priority")) as "low" | "medium" | "high",
    });
  }

  function onContribute(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const g = goals.find((x) => x.id === contributeFor);
    if (!g) return;
    contribute.mutate({
      goal_id: g.id,
      amount: Number(fd.get("amount")),
      target: Number(g.target_amount),
      current: Number(g.saved_amount),
    });
  }

  const active = goals.filter((g) => g.status === "active");
  const archived = goals.filter((g) => g.status !== "active");

  return (
    <PageContainer>
      <PageHeader
        title="Metas"
        description="Defina objetivos e acompanhe o progresso."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="size-4" /> Nova meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome da meta</Label>
                  <Input id="name" name="name" required placeholder="Ex.: Viagem para o Japão" maxLength={60} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="target_amount">Valor alvo (R$)</Label>
                    <Input id="target_amount" name="target_amount" type="number" step="0.01" min="0.01" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="deadline">Prazo</Label>
                    <Input id="deadline" name="deadline" type="date" required min={toISODate(new Date())} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Prioridade</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={create.isPending} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                  {create.isPending ? "Salvando..." : "Criar meta"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-44 card-surface animate-pulse" />)}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="Nenhuma meta ativa" description="Crie sua primeira meta financeira para começar a acompanhar o progresso." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((g) => {
              const pct = Math.min(100, Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100));
              const remaining = Math.max(0, Number(g.target_amount) - Number(g.saved_amount));
              const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline + "T00:00:00").getTime() - Date.now()) / 86400000));
              return (
                <div key={g.id} className="card-surface p-5 group relative">
                  <div className="flex items-start justify-between">
                    <div className="size-10 rounded-xl grid place-items-center" style={{ background: g.color + "33", color: g.color }}>
                      <Target className="size-5" />
                    </div>
                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => del.mutate(g.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <h3 className="mt-3 font-semibold">{g.name}</h3>
                  <p className="text-xs text-muted-foreground">Até {formatDateLong(g.deadline)} · {daysLeft}d restantes</p>
                  <div className="mt-4 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-primary" style={{ width: pct + "%" }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-medium tabular-nums">{formatMoney(g.saved_amount)}</span>
                    <span className="text-muted-foreground tabular-nums">de {formatMoney(g.target_amount)}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Faltam {formatMoney(remaining)} ({pct}%)
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setContributeFor(g.id)}
                  >
                    <PlusCircle className="size-4" /> Registrar aporte
                  </Button>
                </div>
              );
            })}
          </div>

          {archived.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mt-8 mb-3">Concluídas / arquivadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archived.map((g) => (
                  <div key={g.id} className="card-surface p-5 opacity-70">
                    <h3 className="font-semibold">{g.name} ✓</h3>
                    <p className="text-xs text-muted-foreground mt-1">{formatMoney(g.target_amount)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Dialog open={!!contributeFor} onOpenChange={(o) => !o && setContributeFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar aporte</DialogTitle></DialogHeader>
          <form onSubmit={onContribute} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor do aporte (R$)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required autoFocus />
            </div>
            <Button type="submit" disabled={contribute.isPending} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
              {contribute.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
