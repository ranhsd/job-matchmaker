import type { ApiError, MatchErrorCode, MatchEvent, MatchFilters, PositionsResponse } from "@sigma/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export class RequestError extends Error {
  constructor(
    message: string,
    readonly code: MatchErrorCode = "search",
  ) {
    super(message);
  }
}

async function readError(res: Response): Promise<RequestError> {
  try {
    const body = (await res.json()) as Partial<ApiError>;
    if (body.error) return new RequestError(body.error, body.code);
  } catch {
    // non-JSON error body
  }
  return new RequestError(`שגיאת שרת (${res.status})`);
}

export async function fetchPositions(): Promise<PositionsResponse> {
  const res = await fetch(`${API_BASE}/positions`);
  if (!res.ok) throw await readError(res);
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

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/match`, { method: "POST", body: form, signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new RequestError("אין חיבור לשרת");
  }
  if (!res.ok || !res.body) throw await readError(res);

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
