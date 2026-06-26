import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { firstOfMonth, lastOfMonth, toISODate } from "@/lib/format";

export type Account = {
  id: string;
  name: string;
  type: "checking" | "savings" | "wallet" | "credit_card" | "investment" | "other";
  initial_balance: number;
  credit_limit: number | null;
  color: string;
  icon: string;
  is_archived: boolean;
};

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  type: "income" | "expense" | "both";
  icon: string;
  color: string;
  is_system: boolean;
  is_archived: boolean;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  kind: "income" | "expense";
  amount: number;
  description: string | null;
  date: string;
  payment_method: string | null;
  income_type: string | null;
  installment_group_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
  status: "paid" | "pending";
};

export type Budget = {
  id: string;
  scope: "general" | "category";
  category_id: string | null;
  limit_amount: number;
  reference_month: string;
};

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string;
  priority: "low" | "medium" | "high";
  color: string;
  icon: string;
  status: "active" | "completed" | "archived";
};

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Account[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as Category[];
    },
  });
}

export function useTransactions(opts?: { from?: string; to?: string; limit?: number }) {
  return useQuery({
    queryKey: ["transactions", opts],
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select("*")
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (opts?.from) q = q.gte("date", opts.from);
      if (opts?.to) q = q.lte("date", opts.to);
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Transaction[];
    },
  });
}

export function useMonthTransactions(date = new Date()) {
  return useTransactions({
    from: toISODate(firstOfMonth(date)),
    to: toISODate(lastOfMonth(date)),
  });
}

export function useBudgets(referenceMonth: string) {
  return useQuery({
    queryKey: ["budgets", referenceMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("reference_month", referenceMonth);
      if (error) throw error;
      return (data || []) as Budget[];
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Goal[];
    },
  });
}
