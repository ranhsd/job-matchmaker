import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output, type UserContent } from "ai";
import { z } from "zod";
import type {
  CandidateProfile,
  MatchCategory,
  MatchErrorCode,
  MatchEvent,
  MatchFilters,
  MatchResult,
  PositionDetails,
} from "@sigma/shared";
import type { CvInput } from "./cv.js";
import { env } from "./env.js";
import { getOpenPositions, stripDetails } from "./merkava.js";
import { truncate } from "./text.js";

const SCORING_BATCH_SIZE = 8;
const CATEGORY_ORDER: Record<MatchCategory, number> = { strong: 0, possible: 1, discover: 2 };

export class MatchError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code: MatchErrorCode = "search",
  ) {
    super(message);
  }
}

const profileSchema = z.object({
  isResume: z.boolean().describe("האם המסמך הוא אכן קורות חיים של אדם"),
  fullName: z.string().nullable(),
  headline: z.string().describe("תיאור מקצועי קצר במשפט אחד, למשל: 'מהנדסת תוכנה עם 6 שנות ניסיון'"),
  summary: z.string().describe("סיכום של 2-3 משפטים על הרקע, הניסיון והחוזקות"),
  yearsOfExperience: z.number().nullable(),
  seniority: z.string().describe("רמת בכירות: סטודנט/ית, מתחיל/ה, מנוסה, בכיר/ה, מנהל/ת"),
  education: z.array(z.string()).describe("תארים ותעודות, כולל תחום ומוסד"),
  skills: z.array(z.string()).describe("עד 15 כישורים מקצועיים מרכזיים"),
  languages: z.array(z.string()),
  domains: z.array(z.string()).describe("תחומי עיסוק, למשל: משפטים, הנדסה, מחשוב, חינוך, בריאות"),
  preferredLocations: z.array(z.string()).describe("מקומות מגורים/עבודה שמוזכרים בקורות החיים"),
  licenses: z.array(z.string()).describe("רישיונות מקצועיים (עו\"ד, רו\"ח, מהנדס רשום, רישיון רפואה וכו')"),
});

const screeningSchema = z.object({
  candidates: z
    .array(
      z.object({
        id: z.number().int().describe("מזהה המשרה מהרשימה"),
        relevance: z.number().int().min(0).max(100),
        kind: z
          .enum(["direct", "adjacent"])
          .describe("direct: משרה בתחום המקצועי של המועמד/ת. adjacent: תחום משיק שבו הכישורים עשויים להיות רלוונטיים"),
      }),
    )
    .describe("המשרות הרלוונטיות ביותר, ממוינות מהרלוונטית ביותר"),
});

const scoringSchema = z.object({
  results: z.array(
    z.object({
      id: z.number().int(),
      category: z
        .enum(["strong", "possible", "discover", "none"])
        .describe(
          "strong: התאמה מקצועית גבוהה. possible: התאמה מקצועית אפשרית. discover: הזדמנות נוספת בתחום משיק. none: המשרה אינה רלוונטית",
        ),
      score: z.number().int().min(0).max(100).describe("עוצמת ההתאמה, לסידור המשרות בתוך הקטגוריה"),
      whyRelevant: z
        .string()
        .describe("1-2 משפטים: מהות התפקיד והקשר בין תחומי העיסוק בו לניסיון ולכישורים שזוהו בקורות החיים"),
      evidence: z
        .array(z.string())
        .describe("1-3 נתונים קצרים מקורות החיים שתומכים בהתאמה, למשל: 'ניסיון בהובלת פרויקטים ובעבודה מול ממשקים'"),
      checks: z
        .array(
          z.object({
            status: z
              .enum(["supported", "unclear", "gap"])
              .describe("supported: נמצא מידע תומך. unclear: לא נמצא מספיק מידע. gap: זוהה פער מהותי"),
            requirement: z.string().describe("הדרישה המהותית מהמכרז, בקצרה"),
            note: z.string().describe("מה נמצא או לא נמצא בקורות החיים לגבי הדרישה"),
          }),
        )
        .describe("1-4 דרישות מהותיות מהמכרז, דרישות הסף קודם"),
    }),
  ),
});

// Outputs are typed explicitly: inference through `Output.object` falls back to `unknown`.
type Profile = z.infer<typeof profileSchema>;
type Screening = z.infer<typeof screeningSchema>;
type Scoring = z.infer<typeof scoringSchema>;

function getModel(modelId: string) {
  if (!env.googleApiKey) {
    throw new MatchError("השרת אינו מוגדר: חסר מפתח GOOGLE_GENERATIVE_AI_API_KEY", 500);
  }
  return createGoogleGenerativeAI({ apiKey: env.googleApiKey })(modelId);
}

function cvContent(cv: CvInput, instruction: string): UserContent {
  if (cv.kind === "text") {
    return [{ type: "text", text: `${instruction}\n\n<קורות_חיים>\n${cv.text}\n</קורות_חיים>` }];
  }
  return [
    { type: "text", text: instruction },
    { type: "file", data: cv.data, mediaType: cv.mediaType, filename: cv.fileName },
  ];
}

function profileToText(p: Profile, filters: MatchFilters): string {
  const lines = [
    `כותרת: ${p.headline}`,
    `סיכום: ${p.summary}`,
    `שנות ניסיון: ${p.yearsOfExperience ?? "לא ידוע"}`,
    `בכירות: ${p.seniority}`,
    `השכלה: ${p.education.join("; ") || "לא צוין"}`,
    `רישיונות: ${p.licenses.join("; ") || "אין"}`,
    `כישורים: ${p.skills.join(", ")}`,
    `תחומים: ${p.domains.join(", ")}`,
    `שפות: ${p.languages.join(", ")}`,
    `מיקום: ${p.preferredLocations.join(", ") || "לא צוין"}`,
  ];
  if (filters.notes?.trim()) lines.push(`העדפות המועמד/ת: ${filters.notes.trim().slice(0, 500)}`);
  return lines.join("\n");
}

function applyFilters(positions: PositionDetails[], filters: MatchFilters): PositionDetails[] {
  return positions.filter((p) => {
    if (filters.audience !== "employees" && !p.isPublic) return false;
    if (filters.area && p.area !== filters.area) return false;
    if (filters.jobScope === "full" && p.jobPercent < 100) return false;
    if (filters.jobScope === "partial" && p.jobPercent >= 100) return false;
    if (filters.field && !p.fields.includes(filters.field)) return false;
    if (filters.level && p.level !== filters.level) return false;
    return true;
  });
}

/** One compact line per position so the whole catalog fits comfortably in a single prompt. */
function catalogLine(p: PositionDetails, id: number): string {
  const threshold = truncate(p.requirements.replace(/\n+/g, " | "), 320);
  return [
    `[${id}] ${p.tenderName}`,
    p.officeName,
    p.locationName,
    p.level,
    p.jobRating,
    p.tags.join("/"),
    `דרישות: ${threshold}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function positionBlock(p: PositionDetails, id: number, adjacent: boolean): string {
  return [
    `### משרה [${id}]: ${p.tenderName}${adjacent ? " (נבחרה בסינון כתחום משיק)" : ""}`,
    `משרד: ${p.officeName}${p.officeUnitName ? ` – ${p.officeUnitName}` : ""}`,
    `מיקום: ${p.locationName} (${p.area}) | סוג: ${p.publicationType} | דרגה: ${p.jobRating} ${p.rankFrom}-${p.rankTo} | ${p.level} | היקף: ${p.jobPercent}%`,
    `תיאור התפקיד:\n${truncate(p.description, 1500)}`,
    `דרישות:\n${truncate(p.requirements, 2500)}`,
  ].join("\n");
}

const SYSTEM_PROMPT = `את/ה יועץ/ת קריירה מומחה/ית לגיוס לשירות המדינה בישראל.
את/ה מכיר/ה היטב את מבנה המכרזים: דרישות סף (השכלה, ניסיון, רישיונות) הן תנאי חובה, ודרישות רצויות הן יתרון.
את/ה מדייק/ת ומבוסס/ת רק על מה שכתוב בקורות החיים ובמשרה – לא ממציא/ה ניסיון או כישורים.
כל הטקסט שאת/ה מחזיר/ה חייב להיות בעברית.
כשאת/ה פונה למועמד/ת, כתוב/כתבי בגוף שני יחיד בלשון ניטרלית מגדרית ("הניסיון שלך", "עשוי להיות רלוונטי לך"), בלי פעלים בלשון זכר או נקבה.`;

async function extractProfile(cv: CvInput): Promise<Profile> {
  const { output } = await generateText({
    model: getModel(env.model),
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: profileSchema }),
    messages: [
      {
        role: "user",
        content: cvContent(
          cv,
          "נתח/י את קורות החיים המצורפים והפק/י פרופיל מועמד/ת מובנה. אם המסמך אינו קורות חיים, סמן/י isResume=false.",
        ),
      },
    ],
  });
  return output as Profile;
}

interface ShortlistItem {
  id: number;
  adjacent: boolean;
}

async function screenPositions(
  profileText: string,
  positions: PositionDetails[],
  limit: number,
): Promise<ShortlistItem[]> {
  const adjacentSlots = Math.max(1, Math.round(limit / 3));
  const catalog = positions.map((p, i) => catalogLine(p, i)).join("\n");
  const { output } = await generateText({
    model: getModel(env.model),
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: screeningSchema }),
    prompt: `להלן פרופיל מועמד/ת ורשימה של ${positions.length} משרות פתוחות בשירות המדינה.
בחר/י עד ${limit} משרות שכדאי למועמד/ת להכיר:
- רוב המשרות (kind=direct): בתחום המקצועי של המועמד/ת, לפי השכלה, ניסיון, כישורים ודרישות סף.
- עד ${adjacentSlots} משרות (kind=adjacent): בתחומים משיקים שהמועמד/ת אולי לא חשב/ה עליהם, שבהם הניסיון והכישורים עשויים להיות רלוונטיים (למשל ניהול פרויקטים, תכנון, בקרה, שירות, ניתוח נתונים).
העדף/י משרות שהמועמד/ת עשוי/ה לעמוד בדרישות הסף שלהן. אל תבחר/י משרות שאין להן קשר ממשי לניסיון או לכישורים.

## פרופיל המועמד/ת
${profileText}

## משרות
${catalog}`,
  });

  const seen = new Set<number>();
  const candidates = (output as Screening).candidates
    .filter((c) => c.id >= 0 && c.id < positions.length && !seen.has(c.id) && seen.add(c.id))
    .sort((a, b) => b.relevance - a.relevance);
  const direct = candidates.filter((c) => c.kind === "direct");
  const adjacent = candidates.filter((c) => c.kind === "adjacent");
  const picked = adjacent.slice(0, adjacentSlots);
  picked.push(...direct.slice(0, limit - picked.length));
  picked.push(...adjacent.slice(adjacentSlots, adjacentSlots + limit - picked.length));
  return picked.map((c) => ({ id: c.id, adjacent: c.kind === "adjacent" }));
}

async function scoreBatch(
  profileText: string,
  batch: { id: number; position: PositionDetails; adjacent: boolean }[],
): Promise<MatchResult[]> {
  const { output } = await generateText({
    model: getModel(env.scoringModel),
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: scoringSchema }),
    prompt: `בחן/י את ההתאמה של המועמד/ת לכל אחת מהמשרות הבאות, וסווג/י כל משרה לאחת הקטגוריות:
- strong (התאמה מקצועית גבוהה): המשרה בתחום המקצועי של המועמד/ת, הניסיון והכישורים רלוונטיים ישירות, ונמצא בקורות החיים מידע תומך לדרישות המרכזיות. אין פער מהותי.
- possible (התאמה מקצועית אפשרית): יש ניסיון או כישורים רלוונטיים, אבל חלק מהדרישות לא מופיעות בבירור בקורות החיים, או שהניסיון רלוונטי רק בחלקו.
- discover (הזדמנות נוספת שכדאי להכיר): המשרה בתחום אחר או משיק לתחום העיקרי של המועמד/ת, אבל כישורים שזוהו בקורות החיים עשויים להיות רלוונטיים גם לה.
- none: אין קשר ממשי בין המשרה לניסיון ולכישורים. משרות אלה לא יוצגו.

הנחיות:
- whyRelevant: תקציר אישי וקצר בגוף שני, למשל: "התפקיד משלב תכנון תוכניות עבודה ובקרה. הניסיון שלך בניהול פרויקטים עשוי להיות רלוונטי לתחומי העיסוק האלה."
- evidence: רק נתונים שמופיעים בפועל בקורות החיים.
- checks: הדרישות המהותיות של המכרז (השכלה, שנות ניסיון, ניסיון ניהולי, רישיון). לכל דרישה:
  - supported כשקורות החיים מראים בבירור שהדרישה מתקיימת.
  - unclear כשלא נמצא מספיק מידע. זה אינו מעיד על אי-עמידה בדרישה. ב-note כתוב/כתבי מה נדרש ומה לא נמצא, למשל: "במכרז נדרשות שנתיים של ניסיון ניהולי. לא נמצא בקורות החיים מידע מספק לגבי ניסיון זה."
  - gap כשקורות החיים מראים שהדרישה אינה מתקיימת (למשל תואר או רישיון חובה שאינו קיים, או מעט מדי שנות ניסיון).
- score: 0-100, לסידור המשרות בתוך הקטגוריה.

## פרופיל המועמד/ת
${profileText}

## משרות
${batch.map(({ id, position, adjacent }) => positionBlock(position, id, adjacent)).join("\n\n")}`,
  });

  const byId = new Map(batch.map((b) => [b.id, b.position]));
  return (output as Scoring).results.flatMap((r) => {
    const position = byId.get(r.id);
    if (!position || r.category === "none") return [];
    byId.delete(r.id);
    return [
      {
        position: stripDetails(position),
        category: r.category,
        score: Math.max(0, Math.min(100, r.score)),
        whyRelevant: r.whyRelevant,
        evidence: r.evidence.slice(0, 3),
        checks: r.checks.slice(0, 4),
      },
    ];
  });
}

function toCandidateProfile(p: Profile): CandidateProfile {
  return {
    fullName: p.fullName,
    headline: p.headline,
    summary: p.summary,
    yearsOfExperience: p.yearsOfExperience,
    seniority: p.seniority,
    education: p.education,
    skills: p.skills,
    licenses: p.licenses,
    languages: p.languages,
    domains: p.domains,
    preferredLocations: p.preferredLocations,
  };
}

/**
 * Three-stage pipeline that keeps cost low while still reading every open position:
 * 1. Extract a structured profile from the CV (1 call, reads PDF natively).
 * 2. Screen the entire catalog in one large-context call using compact summaries.
 * 3. Score the shortlist in parallel batches using the full job description & requirements.
 */
export async function* matchCv(cv: CvInput, filters: MatchFilters): AsyncGenerator<MatchEvent> {
  yield { type: "stage", stage: "profiling", message: "מנתח את קורות החיים…" };
  const [profile, catalog] = await Promise.all([extractProfile(cv), getOpenPositions()]);
  if (!profile.isResume) {
    throw new MatchError("הקובץ שהועלה לא נראה כמו קורות חיים", 400, "file");
  }
  yield { type: "profile", profile: toCandidateProfile(profile) };

  const positions = applyFilters(catalog.positions, filters);
  if (positions.length === 0) {
    yield { type: "result", matches: [], totalPositions: 0, screened: 0, model: env.scoringModel };
    return;
  }

  const profileText = profileToText(profile, filters);
  const limit = env.shortlistSize;

  let shortlist: ShortlistItem[];
  if (positions.length <= limit) {
    shortlist = positions.map((_, id) => ({ id, adjacent: false }));
  } else {
    yield {
      type: "stage",
      stage: "screening",
      message: `סורק ${positions.length} משרות פתוחות…`,
    };
    shortlist = await screenPositions(profileText, positions, limit);
  }

  if (shortlist.length === 0) {
    yield { type: "result", matches: [], totalPositions: positions.length, screened: 0, model: env.scoringModel };
    return;
  }

  yield {
    type: "stage",
    stage: "scoring",
    message: `מדרג ${shortlist.length} משרות מתאימות לעומק…`,
  };
  const items = shortlist.map(({ id, adjacent }) => ({ id, adjacent, position: positions[id]! }));
  const batches: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += SCORING_BATCH_SIZE) {
    batches.push(items.slice(i, i + SCORING_BATCH_SIZE));
  }
  const settled = await Promise.allSettled(batches.map((b) => scoreBatch(profileText, b)));
  if (settled.every((s) => s.status === "rejected")) {
    throw (settled[0] as PromiseRejectedResult).reason ?? new MatchError("הדירוג נכשל", 502);
  }
  const matches = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));

  matches.sort((a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] || b.score - a.score);
  yield {
    type: "result",
    matches,
    totalPositions: positions.length,
    screened: shortlist.length,
    model: env.scoringModel,
  };
}
