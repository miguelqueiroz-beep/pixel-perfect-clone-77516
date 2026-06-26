import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6", className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</div>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-surface p-10 text-center flex flex-col items-center gap-3">
      <div className="size-12 rounded-2xl bg-accent/40 grid place-items-center text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "success" | "destructive" | "warning";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    destructive: "text-destructive",
    warning: "text-warning",
  }[tone];
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="size-4" />}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums", toneClass)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
