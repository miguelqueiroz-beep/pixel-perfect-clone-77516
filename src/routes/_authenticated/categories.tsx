import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/lib/queries";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({ meta: [{ title: "Categorias — FinFlow" }] }),
  component: CategoriesPage,
});

const PALETTE = ["#10B981", "#06B6D4", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#22D3EE", "#A855F7", "#14B8A6"];

function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: { name: string; type: "income" | "expense"; color: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Sessão expirada");
      const { error } = await supabase.from("categories").insert({
        user_id: userId,
        name: input.name,
        type: input.type,
        color: input.color,
        icon: "tag",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria criada");
      qc.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria removida");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error("Não foi possível remover. Pode haver transações vinculadas."),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      name: String(fd.get("name") || "").trim(),
      type: String(fd.get("type")) as "income" | "expense",
      color: String(fd.get("color")),
    });
  }

  const expense = categories.filter((c) => c.type === "expense" || c.type === "both");
  const income = categories.filter((c) => c.type === "income" || c.type === "both");

  return (
    <PageContainer>
      <PageHeader
        title="Categorias"
        description="Organize suas transações com categorias personalizadas."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="size-4" /> Nova categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" required maxLength={40} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select name="type" defaultValue={tab}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Cor</Label>
                  <div className="flex gap-2 flex-wrap">
                    {PALETTE.map((c, i) => (
                      <label key={c} className="cursor-pointer">
                        <input type="radio" name="color" value={c} defaultChecked={i === 0} className="peer sr-only" />
                        <span
                          className="size-8 rounded-full block ring-2 ring-transparent peer-checked:ring-primary"
                          style={{ background: c }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={create.isPending} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                  {create.isPending ? "Salvando..." : "Salvar categoria"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm mb-4">
          <TabsTrigger value="expense">Despesas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
        </TabsList>
        <TabsContent value="expense">
          <CategoryGrid items={expense} loading={isLoading} onDelete={(id) => del.mutate(id)} />
        </TabsContent>
        <TabsContent value="income">
          <CategoryGrid items={income} loading={isLoading} onDelete={(id) => del.mutate(id)} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function CategoryGrid({
  items,
  loading,
  onDelete,
}: {
  items: Array<{ id: string; name: string; color: string; is_system: boolean }>;
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 card-surface animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((c) => (
        <div key={c.id} className="card-surface p-4 flex items-center justify-between group">
          <div className="flex items-center gap-3 min-w-0">
            <span className="size-9 rounded-lg shrink-0" style={{ background: c.color + "33", border: `1px solid ${c.color}55` }} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              {c.is_system && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">padrão</p>}
            </div>
          </div>
          {!c.is_system && (
            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => onDelete(c.id)}>
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
