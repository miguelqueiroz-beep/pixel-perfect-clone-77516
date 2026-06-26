export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatMoney = (n: number | string | null | undefined) =>
  BRL.format(Number(n ?? 0));

export const formatMoneySigned = (n: number, kind: "income" | "expense") => {
  const sign = kind === "income" ? "+" : "−";
  return `${sign} ${BRL.format(Math.abs(n))}`;
};

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d,
  );

export const formatDateLong = (d: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d,
  );

export const monthLabel = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d);

export const firstOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1);

export const lastOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const toISODate = (d: Date) => d.toISOString().slice(0, 10);
