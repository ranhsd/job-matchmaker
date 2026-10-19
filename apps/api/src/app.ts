import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { stream } from "hono/streaming";
import type { ApiError, JobScope, MatchErrorCode, MatchEvent, MatchFilters, PositionsResponse, TenderAudience } from "@sigma/shared";
import { CvError, readCv } from "./lib/cv.js";
import { env } from "./lib/env.js";
import { MatchError, matchCv } from "./lib/matcher.js";
import { getOpenPositions, getPosition, MerkavaError, stripDetails } from "./lib/merkava.js";
import { checkRateLimit, clientIp } from "./lib/rate-limit.js";

type HttpErrorStatus = 400 | 404 | 429 | 500 | 502;

function errorStatus(err: unknown): HttpErrorStatus {
  if (err instanceof MerkavaError || err instanceof MatchError || err instanceof CvError) {
    return err.status as HttpErrorStatus;
  }
  return 500;
}

function errorMessage(err: unknown): string {
  if (err instanceof MerkavaError || err instanceof MatchError || err instanceof CvError) {
    return err.message;
  }
  const message = (err as Error)?.message ?? "";
  if (/quota|rate limit|resource.?exhausted|429/i.test(message)) {
    return "חרגנו זמנית ממכסת השימוש במודל ה-AI";
  }
  return "אירעה שגיאה בלתי צפויה";
}

function errorCode(err: unknown): MatchErrorCode {
  if (err instanceof CvError) return "file";
  if (err instanceof MatchError) return err.code;
  return "search";
}

function apiError(err: unknown): ApiError {
  return { error: errorMessage(err), code: errorCode(err) };
}

function text(value: unknown, max = 100): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): T | undefined {
  return options.find((option) => option === value);
}

function parseFilters(raw: unknown): MatchFilters {
  if (typeof raw !== "string" || !raw) return {};
  try {
    const f = JSON.parse(raw) as Record<string, unknown>;
    return {
      audience: oneOf<TenderAudience>(f.audience, ["public", "employees"]),
      area: text(f.area),
      jobScope: oneOf<JobScope>(f.jobScope, ["full", "partial"]),
      field: text(f.field),
      level: text(f.level),
      notes: text(f.notes, 500),
    };
  } catch {
    return {};
  }
}

export const app = new Hono().basePath("/api");

app.use(
  "*",
  cors({
    origin: (origin) => (env.allowedOrigins.includes(origin) ? origin : null),
    allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86_400,
  }),
);
app.use(
  secureHeaders({
    // The site on Firebase Hosting calls this API on another origin.
    crossOriginResourcePolicy: "cross-origin",
  }),
);

app.onError((err, c) => {
  console.error(err);
  return c.json(apiError(err), errorStatus(err));
});

app.get("/health", (c) =>
  c.json({ ok: true, llmConfigured: Boolean(env.googleApiKey), model: env.model, scoringModel: env.scoringModel }),
);

app.get("/positions", async (c) => {
  const { positions, fetchedAt } = await getOpenPositions();
  const body: PositionsResponse = {
    positions: positions.map(stripDetails),
    total: positions.length,
    fetchedAt: fetchedAt.toISOString(),
  };
  c.header("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
  return c.json(body);
});

app.get("/positions/:requestId", async (c) => {
  const position = await getPosition(c.req.param("requestId"));
  c.header("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
  return c.json(position);
});

app.post("/match", async (c) => {
  const limit = checkRateLimit(clientIp(c), env.rateLimitPerHour);
  if (!limit.ok) {
    c.header("Retry-After", String(limit.retryAfterSec));
    return c.json<ApiError>({ error: "בוצעו יותר מדי ניסיונות התאמה. נסו שוב מאוחר יותר", code: "search" }, 429);
  }

  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) return c.json<ApiError>({ error: "לא הועלה קובץ קורות חיים", code: "file" }, 400);

  const cv = await readCv(file);
  const filters = parseFilters(body.filters);

  c.header("Content-Type", "application/x-ndjson; charset=utf-8");
  c.header("Cache-Control", "no-store");
  c.header("X-Accel-Buffering", "no");

  return stream(c, async (s) => {
    const send = (event: MatchEvent) => s.write(`${JSON.stringify(event)}\n`);
    try {
      await send({ type: "stage", stage: "parsing", message: "הקובץ התקבל" });
      for await (const event of matchCv(cv, filters)) await send(event);
    } catch (err) {
      console.error(err);
      const { error, code } = apiError(err);
      await send({ type: "error", code, message: error });
    }
  });
});

app.notFound((c) => c.json({ error: "לא נמצא" }, 404));

export default app;
