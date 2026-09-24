const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

const WRAPPED_LINE_MIN = 50;
const ENDS_CLAUSE = /[.:;?!]$/;
const STARTS_LIST_ITEM = /^([-•*]|\d+[.)]|[א-ת][.)]\s)/;

/**
 * Converts the SAP rich-text fields into clean plain text. SAP hard-wraps
 * paragraphs with `<br>` every ~70 characters, so long lines that don't end a
 * clause are re-joined with the next line; list items and headings are kept.
 */
export function htmlToText(input: string | null | undefined): string {
  if (!input) return "";
  const lines = input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    // Drop decorative separator lines such as "*******" or "-------"
    .filter((line) => !/^[*\-_=~.]+$/.test(line.replace(/\s/g, "")));

  const out: string[] = [];
  for (const line of lines) {
    const prev = out.at(-1);
    const isContinuation =
      prev && line && prev.length >= WRAPPED_LINE_MIN && !ENDS_CLAUSE.test(prev) && !STARTS_LIST_ITEM.test(line);
    if (isContinuation) out[out.length - 1] = `${prev} ${line}`;
    else out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
