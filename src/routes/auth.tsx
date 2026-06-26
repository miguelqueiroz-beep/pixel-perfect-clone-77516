import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet, ShieldCheck, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — FinFlow" },
      { name: "description", content: "Acesse sua conta FinFlow." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // If already logged in, bounce to dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Bem-vindo ao FinFlow.");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left visual panel */}
      <section className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(800px circle at 20% 10%, oklch(0.74 0.16 165 / 0.18), transparent 55%), radial-gradient(600px circle at 80% 80%, oklch(0.72 0.14 200 / 0.14), transparent 55%)",
          }}
        />
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center text-primary-foreground font-bold">
            F
          </div>
          <span className="text-lg font-semibold tracking-tight">FinFlow</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Sua vida financeira,
            <br />
            <span className="text-gradient-primary">clara e em tempo real.</span>
          </h1>
          <p className="text-muted-foreground max-w-md">
            Registre receitas e despesas, acompanhe orçamentos, alcance metas — sem
            planilhas, sem fricção.
          </p>
          <div className="grid grid-cols-1 gap-3 max-w-md">
            <Feature icon={Wallet} title="Visão única" text="Saldo, contas e cartões em um só lugar." />
            <Feature icon={TrendingUp} title="Insights visuais" text="Gráficos que mostram para onde vai o seu dinheiro." />
            <Feature icon={ShieldCheck} title="Seguro por padrão" text="Seus dados, só seus. Criptografados e isolados." />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FinFlow</p>
      </section>

      {/* Right form panel */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md card-surface p-8">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="size-8 rounded-lg gradient-primary grid place-items-center text-primary-foreground font-bold">F</div>
            <span className="font-semibold">FinFlow</span>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <h2 className="text-2xl font-semibold mb-1">Bem-vindo de volta</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Entre para continuar acompanhando suas finanças.
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <Field id="email" name="email" type="email" label="E-mail" autoComplete="email" />
                <Field id="password" name="password" type="password" label="Senha" autoComplete="current-password" />
                <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <h2 className="text-2xl font-semibold mb-1">Crie sua conta</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Comece a organizar seu dinheiro em menos de 1 minuto.
              </p>
              <form onSubmit={handleSignup} className="space-y-4">
                <Field id="fullName" name="fullName" type="text" label="Nome completo" autoComplete="name" />
                <Field id="su-email" name="email" type="email" label="E-mail" autoComplete="email" />
                <Field id="su-password" name="password" type="password" label="Senha (mín. 8 caracteres)" autoComplete="new-password" />
                <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
}

function Field(props: {
  id: string;
  name: string;
  type: string;
  label: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input id={props.id} name={props.name} type={props.type} autoComplete={props.autoComplete} required />
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 card-surface p-4">
      <div className="size-9 rounded-lg bg-accent/40 grid place-items-center text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
