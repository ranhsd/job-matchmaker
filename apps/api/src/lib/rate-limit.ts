import type { Context } from "hono";

/**
 * Best-effort in-memory sliding-window limiter to protect the LLM budget.
 * On serverless each warm instance keeps its own window, so this is a soft limit;
 * use a shared store (e.g. Upstash Redis) if stricter limits are needed.
 */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;

export function clientIp(c: Context): string {
  return (
    c.req.header("x-real-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local"
  );
}

export function checkRateLimit(key: string, limit: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.ceil((recent[0]! + WINDOW_MS - now) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}
