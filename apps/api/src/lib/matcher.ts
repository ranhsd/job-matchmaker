import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output, type UserContent } from "ai";
import { z } from "zod";
import type {
  CandidateProfile,
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

export class MatchError extends Error {
  constructor(
    message: string,
    readonly status = 400,
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
      }),
    )
    .describe("המשרות הרלוונטיות ביותר, ממוינות מהרלוונטית ביותר"),
});

const scoringSchema = z.object({
  results: z.array(
    z.object({
      id: z.number().int(),
      score: z.number().int().min(0).max(100).describe("ציון התאמה כולל"),
      fitLevel: z.enum(["excellent", "good", "partial", "low"]),
      meetsThreshold: z
        .enum(["yes", "partial", "no", "unknown"])
        .describe("האם המועמד/ת עומד/ת בדרישות הסף הפורמליות (השכלה, ניסיון, רישיונות)"),
      summary: z.string().describe("משפט אחד שמסכם את ההתאמה"),
      reasons: z.array(z.string()).describe("2-4 סיבות קונקרטיות מדוע המשרה מתאימה, בהתבסס על קורות החיים"),
      gaps: z.array(z.string()).describe("0-3 פערים או דרישות שלא ברור שמתקיימות"),
    }),
  ),
});

// Outputs are typed explicitly: Vercel's builder type-checks with pnpm symlinks
// preserved, which makes inference through `Output.object` fall back to `unknown`.
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
    if (filters.publicOnly && !p.isPublic) return false;
    if (filters.areas?.length && !filters.areas.includes(p.area)) return false;
    if (filters.minJobPercent && p.jobPercent < filters.minJobPercent) return false;
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

function positionBlock(p: PositionDetails, id: number): string {
  return [
    `### משרה [${id}]: ${p.tenderName}`,
    `משרד: ${p.officeName}${p.officeUnitName ? ` – ${p.officeUnitName}` : ""}`,
    `מיקום: ${p.locationName} (${p.area}) | סוג: ${p.publicationType} | דרגה: ${p.jobRating} ${p.rankFrom}-${p.rankTo} | ${p.level} | היקף: ${p.jobPercent}%`,
    `תיאור התפקיד:\n${truncate(p.description, 1500)}`,
    `דרישות:\n${truncate(p.requirements, 2500)}`,
  ].join("\n");
}

const SYSTEM_PROMPT = `את/ה יועץ/ת קריירה מומחה/ית לגיוס לשירות המדינה בישראל.
את/ה מכיר/ה היטב את מבנה המכרזים: דרישות סף (השכלה, ניסיון, רישיונות) הן תנאי חובה, ודרישות רצויות הן יתרון.
את/ה מדייק/ת ומבוסס/ת רק על מה שכתוב בקורות החיים ובמשרה – לא ממציא/ה ניסיון או כישורים.
כל הטקסט שאת/ה מחזיר/ה חייב להיות בעברית.`;

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

async function screenPositions(
  profileText: string,
  positions: PositionDetails[],
  limit: number,
): Promise<number[]> {
  const catalog = positions.map((p, i) => catalogLine(p, i)).join("\n");
  const { output } = await generateText({
    model: getModel(env.model),
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: screeningSchema }),
    prompt: `להלן פרופיל מועמד/ת ורשימה של ${positions.length} משרות פתוחות בשירות המדינה.
בחר/י עד ${limit} משרות שהמועמד/ת הכי מתאים/ה להן – בעיקר לפי תחום מקצועי, השכלה, ניסיון ודרישות סף.
העדף/י משרות שהמועמד/ת עשוי/ה לעמוד בדרישות הסף שלהן. אל תבחר/י משרות שאינן קשורות לתחום.

## פרופיל המועמד/ת
${profileText}

## משרות
${catalog}`,
  });

  const seen = new Set<number>();
  return (output as Screening).candidates
    .sort((a, b) => b.relevance - a.relevance)
    .map((c) => c.id)
    .filter((id) => id >= 0 && id < positions.length && !seen.has(id) && seen.add(id))
    .slice(0, limit);
}

async function scoreBatch(
  profileText: string,
  batch: { id: number; position: PositionDetails }[],
): Promise<MatchResult[]> {
  const { output } = await generateText({
    model: getModel(env.scoringModel),
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: scoringSchema }),
    prompt: `דרג/י את ההתאמה של המועמד/ת לכל אחת מהמשרות הבאות.

כללי ציון:
- 85-100: התאמה מצוינת – עומד/ת בכל דרישות הסף וניסיון רלוונטי ישיר
- 70-84: התאמה טובה – עומד/ת בדרישות הסף, ניסיון רלוונטי חלקי
- 45-69: התאמה חלקית – חסרה דרישה משמעותית או שהניסיון בתחום קרוב בלבד
- 0-44: התאמה נמוכה – לא עומד/ת בדרישות סף מהותיות
אם חסר תואר או רישיון שנדרש כדרישת סף – הציון לא יעלה על 55.
הסיבות והפערים חייבים להיות ספציפיים (לציין את הניסיון/התואר הרלוונטי מקורות החיים ואת הדרישה במשרה).

## פרופיל המועמד/ת
${profileText}

## משרות
${batch.map(({ id, position }) => positionBlock(position, id)).join("\n\n")}`,
  });

  const byId = new Map(batch.map((b) => [b.id, b.position]));
  return (output as Scoring).results.flatMap((r) => {
    const position = byId.get(r.id);
    if (!position) return [];
    byId.delete(r.id);
    return [
      {
        position: stripDetails(position),
        score: Math.max(0, Math.min(100, r.score)),
        fitLevel: r.fitLevel,
        meetsThreshold: r.meetsThreshold,
        summary: r.summary,
        reasons: r.reasons,
        gaps: r.gaps,
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
    throw new MatchError("הקובץ שהועלה לא נראה כמו קורות חיים. נא להעלות קובץ קורות חיים");
  }
  yield { type: "profile", profile: toCandidateProfile(profile) };

  const positions = applyFilters(catalog.positions, filters);
  if (positions.length === 0) {
    throw new MatchError("לא נמצאו משרות פתוחות שעונות על הסינון שנבחר");
  }

  const profileText = profileToText(profile, filters);
  const limit = env.shortlistSize;

  let shortlist: number[];
  if (positions.length <= limit) {
    shortlist = positions.map((_, i) => i);
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
  const items = shortlist.map((id) => ({ id, position: positions[id]! }));
  const batches: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += SCORING_BATCH_SIZE) {
    batches.push(items.slice(i, i + SCORING_BATCH_SIZE));
  }
  const settled = await Promise.allSettled(batches.map((b) => scoreBatch(profileText, b)));
  const matches = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
  if (matches.length === 0) {
    const firstError = settled.find((s): s is PromiseRejectedResult => s.status === "rejected");
    throw firstError?.reason ?? new MatchError("הדירוג נכשל", 502);
  }

  matches.sort((a, b) => b.score - a.score);
  yield {
    type: "result",
    matches,
    totalPositions: positions.length,
    screened: shortlist.length,
    model: env.scoringModel,
  };
}
