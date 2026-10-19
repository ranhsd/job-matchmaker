import type { CheckStatus, JobScope, MatchCategory, MatchFilters, Position } from "@sigma/shared";

export const OFFICIAL_SITE = "https://merkava.mrp.gov.il/giusp/index.html#/";

export type InfoTopic = "privacy" | "accessibility";

const dateFormatter = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

export function formatDate(iso: string | null): string {
  return iso ? dateFormatter.format(new Date(iso)) : "—";
}

export function jobScopeLabel(p: Position): string {
  return p.jobPercent >= 100 ? "משרה מלאה" : `משרה חלקית (${p.jobPercent}%)`;
}

export function tenderTypeLabel(p: Position): string {
  return p.isPublic ? "מכרז פומבי" : "מכרז לעובדי מדינה";
}

export const JOB_SCOPE_LABELS: Record<JobScope, string> = {
  full: "משרה מלאה",
  partial: "משרה חלקית",
};

const LEVEL_ORDER = ["משרה תחילית", "משרה תחילית מתקדמת", "משרת ביניים", "משרת ניהול תחום", "משרת ניהול בכיר"];

export function sortLevels(levels: string[]): string[] {
  const rank = (level: string) => {
    const i = LEVEL_ORDER.indexOf(level);
    return i === -1 ? LEVEL_ORDER.length : i;
  };
  return [...levels].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "he"));
}

export function preferenceChips(filters: MatchFilters): string[] {
  return [
    filters.area ?? "כל הארץ",
    filters.jobScope ? JOB_SCOPE_LABELS[filters.jobScope] : "כל ההיקפים",
    filters.field ?? "כל התחומים",
    ...(filters.level ? [filters.level] : []),
    filters.audience === "employees" ? "מכרזים לעובדי מדינה" : "מכרזים פומביים",
  ];
}

interface CategoryMeta {
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  badge: string;
  dot: string;
}

export const CATEGORIES: Record<MatchCategory, CategoryMeta> = {
  strong: {
    label: "התאמה מקצועית גבוהה",
    shortLabel: "התאמה גבוהה",
    title: "רלוונטיות לניסיון שלך",
    description: "משרות עם התאמה מקצועית גבוהה לניסיון ולכישורים שזוהו בקורות החיים.",
    badge: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
    dot: "bg-emerald-600",
  },
  possible: {
    label: "התאמה מקצועית אפשרית",
    shortLabel: "התאמה אפשרית",
    title: "משרות שכדאי לבדוק",
    description: "משרות שבהן זוהתה התאמה מקצועית אפשרית, לצד מידע נוסף שכדאי לברר.",
    badge: "bg-accent-100 text-accent-700 ring-1 ring-accent-500/20",
    dot: "bg-accent-500",
  },
  discover: {
    label: "הזדמנות נוספת שכדאי להכיר",
    shortLabel: "הזדמנות נוספת",
    title: "אפשרויות שאולי לא חשבת עליהן",
    description: "משרות בתחומים משיקים שבהם הניסיון והכישורים שלך עשויים להיות רלוונטיים.",
    badge: "bg-highlight-100 text-highlight-700 ring-1 ring-highlight-300/60",
    dot: "bg-highlight-600",
  },
};

export const CATEGORY_ORDER: MatchCategory[] = ["strong", "possible", "discover"];

interface CheckMeta {
  label: string;
  legend: string;
  box: string;
  title: string;
  icon: string;
}

export const CHECKS: Record<CheckStatus, CheckMeta> = {
  supported: {
    label: "זוהה מידע תומך",
    legend: "זוהה מידע תומך",
    box: "bg-emerald-50",
    title: "text-emerald-800",
    icon: "bg-emerald-100 text-emerald-700",
  },
  unclear: {
    label: "לא נמצא מספיק מידע",
    legend: "לא נמצא מספיק מידע – אינו מעיד על אי־עמידה בדרישות",
    box: "bg-amber-50",
    title: "text-amber-800",
    icon: "bg-amber-100 text-amber-700",
  },
  gap: {
    label: "זוהה פער מהותי",
    legend: "זוהה פער מהותי",
    box: "bg-red-50",
    title: "text-red-700",
    icon: "bg-red-100 text-red-700",
  },
};

export const CHECK_ORDER: CheckStatus[] = ["supported", "unclear", "gap"];

export const UNCLEAR_ADVICE = "אם יש לך ניסיון רלוונטי שלא פורט בקובץ, כדאי לוודא שהוא מוצג במסגרת הגשת המועמדות.";

export const MATCH_DISCLAIMER = "ההתאמה מבוססת על המידע בקורות החיים ואינה מהווה אישור לעמידה בתנאי הסף.";

export const ACCEPTED_FORMATS = "PDF, DOCX, TXT או תמונה | עד 4MB";
