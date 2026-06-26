import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  PiggyBank,
  Target,
  Settings,
  LogOut,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { to: "/accounts", label: "Contas", icon: Wallet },
  { to: "/categories", label: "Categorias", icon: Tags },
  { to: "/budgets", label: "Orçamentos", icon: PiggyBank },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

function AuthedLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useCurrentUser();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-5 flex items-center gap-2">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center text-primary-foreground font-bold">
            F
          </div>
          <span className="font-semibold tracking-tight text-sidebar-foreground">FinFlow</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors " +
                  (active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")
                }
              >
                <Icon className="size-4" />
                {item.label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="px-3 py-2 text-xs text-sidebar-foreground/70 truncate">
            {user?.email}
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-sidebar/95 backdrop-blur border-b border-sidebar-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg gradient-primary grid place-items-center text-primary-foreground text-xs font-bold">F</div>
          <span className="font-semibold text-sm">FinFlow</span>
        </div>
        <button onClick={signOut} className="text-xs text-muted-foreground flex items-center gap-1">
          <LogOut className="size-3.5" /> Sair
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar/95 backdrop-blur border-t border-sidebar-border flex justify-around py-2">
        {nav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] " +
                (active ? "text-primary" : "text-sidebar-foreground/70")
              }
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 min-w-0 pt-14 md:pt-0 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
