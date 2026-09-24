import type { MatchEvent, MatchFilters, PositionDetails, PositionsResponse } from "@sigma/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // non-JSON error body
  }
  return `שגיאת שרת (${res.status})`;
}

export async function fetchPositions(): Promise<PositionsResponse> {
  const res = await fetch(`${API_BASE}/positions`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchPosition(requestId: string): Promise<PositionDetails> {
  const res = await fetch(`${API_BASE}/positions/${encodeURIComponent(requestId)}`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

/** Uploads the CV and yields progress events streamed back as NDJSON. */
export async function* streamMatch(
  file: File,
  filters: MatchFilters,
  signal?: AbortSignal,
): AsyncGenerator<MatchEvent> {
  const form = new FormData();
  form.append("file", file);
  form.append("filters", JSON.stringify(filters));

  const res = await fetch(`${API_BASE}/match`, { method: "POST", body: form, signal });
  if (!res.ok || !res.body) throw new Error(await readError(res));

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) yield JSON.parse(line) as MatchEvent;
    }
  }
  if (buffer.trim()) yield JSON.parse(buffer) as MatchEvent;
}
