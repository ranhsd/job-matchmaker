import type { FitLevel, ThresholdStatus } from "@sigma/shared";

const dateFormatter = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
const currency = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });

export function formatDate(iso: string | null): string {
  return iso ? dateFormatter.format(new Date(iso)) : "—";
}

export function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${currency.format(min)} – ${currency.format(max)}`;
  return currency.format((min ?? max)!);
}

export function daysLeftLabel(days: number | null): string {
  if (days === null) return "";
  if (days === 0) return "היום אחרון";
  if (days === 1) return "יום אחרון מחר";
  return `${days} ימים להגשה`;
}

export const FIT_LABELS: Record<FitLevel, string> = {
  excellent: "התאמה מצוינת",
  good: "התאמה טובה",
  partial: "התאמה חלקית",
  low: "התאמה נמוכה",
};

export const THRESHOLD_LABELS: Record<ThresholdStatus, string> = {
  yes: "עומד/ת בדרישות הסף",
  partial: "עומד/ת חלקית",
  no: "לא עומד/ת בדרישות הסף",
  unknown: "לא ניתן לקבוע",
};

export function scoreColor(score: number): { ring: string; text: string; bg: string } {
  if (score >= 85) return { ring: "#1a8754", text: "text-emerald-700", bg: "bg-emerald-50" };
  if (score >= 70) return { ring: "#0574d6", text: "text-accent-600", bg: "bg-accent-50" };
  if (score >= 45) return { ring: "#d98a00", text: "text-amber-700", bg: "bg-amber-50" };
  return { ring: "#8a94a6", text: "text-slate-600", bg: "bg-slate-100" };
}

export function thresholdClasses(status: ThresholdStatus): string {
  switch (status) {
    case "yes":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "partial":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "no":
      return "bg-highlight-50 text-highlight-600 ring-highlight-100";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}
