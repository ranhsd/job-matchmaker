import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { stream } from "hono/streaming";
import type { MatchEvent, MatchFilters, PositionsResponse } from "@sigma/shared";
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
    return "חרגנו ממכסת השימוש במודל ה-AI. נסו שוב בעוד מספר דקות";
  }
  return "אירעה שגיאה בלתי צפויה. נסו שוב מאוחר יותר";
}

function parseFilters(raw: unknown): MatchFilters {
  if (typeof raw !== "string" || !raw) return {};
  try {
    const f = JSON.parse(raw) as Record<string, unknown>;
    return {
      publicOnly: f.publicOnly === true,
      areas: Array.isArray(f.areas) ? f.areas.filter((a): a is string => typeof a === "string").slice(0, 10) : [],
      minJobPercent: typeof f.minJobPercent === "number" ? f.minJobPercent : undefined,
      notes: typeof f.notes === "string" ? f.notes.slice(0, 500) : undefined,
    };
  } catch {
    return {};
  }
}

export const app = new Hono().basePath("/api");

app.use(secureHeaders());

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: errorMessage(err) }, errorStatus(err));
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
    return c.json({ error: "בוצעו יותר מדי ניסיונות התאמה. נסו שוב מאוחר יותר" }, 429);
  }

  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) return c.json({ error: "לא הועלה קובץ קורות חיים" }, 400);

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
      await send({ type: "error", message: errorMessage(err) });
    }
  });
});

app.notFound((c) => c.json({ error: "לא נמצא" }, 404));

export default app;
