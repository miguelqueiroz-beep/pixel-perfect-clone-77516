import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — FinFlow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: userData } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const [fullName, setFullName] = useState("");
  const [mainIncome, setMainIncome] = useState<string>("");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setMainIncome(profile.main_income ? String(profile.main_income) : "");
      setNotifications(profile.notifications_enabled ?? true);
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        full_name: fullName,
        main_income: mainIncome ? Number(mainIncome) : null,
        notifications_enabled: notifications,
      }).eq("id", userData!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <PageContainer>
      <PageHeader title="Configurações" description="Seus dados e preferências." />

      <div className="max-w-xl space-y-6">
        <section className="card-surface p-6 space-y-4">
          <h3 className="font-semibold">Perfil</h3>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={userData?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mainIncome">Renda principal (R$)</Label>
            <Input id="mainIncome" type="number" step="0.01" value={mainIncome} onChange={(e) => setMainIncome(e.target.value)} />
          </div>
        </section>

        <section className="card-surface p-6 space-y-4">
          <h3 className="font-semibold">Preferências</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notificações</p>
              <p className="text-xs text-muted-foreground">Alertas de orçamento e metas</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="gradient-primary text-primary-foreground hover:opacity-90">
            {save.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="size-4" /> Sair da conta
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
