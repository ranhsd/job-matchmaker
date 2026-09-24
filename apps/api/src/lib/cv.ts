import mammoth from "mammoth";

/** Vercel functions reject request bodies above 4.5MB, so stay safely below. */
export const MAX_CV_BYTES = 4 * 1024 * 1024;

/**
 * A CV ready to be sent to the LLM. PDFs and images are passed as-is because
 * Gemini reads them natively (and handles Hebrew/RTL PDFs far better than
 * text extraction, which often reverses Hebrew characters).
 */
export type CvInput =
  | { kind: "text"; text: string; fileName: string }
  | { kind: "file"; data: Uint8Array; mediaType: string; fileName: string };

export class CvError extends Error {
  readonly status = 400;
}

const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function extension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((b, i) => bytes[i] === b);
}

export async function readCv(file: File): Promise<CvInput> {
  if (file.size === 0) throw new CvError("הקובץ ריק");
  if (file.size > MAX_CV_BYTES) throw new CvError("הקובץ גדול מדי (מקסימום 4MB)");

  const fileName = file.name || "cv";
  const ext = extension(fileName);
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (ext === "pdf" || file.type === "application/pdf") {
    if (!startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) throw new CvError("קובץ ה-PDF פגום או אינו PDF תקין");
    return { kind: "file", data: bytes, mediaType: "application/pdf", fileName };
  }

  if (ext === "docx") {
    if (!startsWith(bytes, [0x50, 0x4b])) throw new CvError("קובץ ה-DOCX פגום");
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return { kind: "text", text: normalizeText(value), fileName };
  }

  if (ext === "doc") {
    throw new CvError("פורמט DOC ישן אינו נתמך. נא לשמור את הקובץ כ-DOCX או PDF ולנסות שוב");
  }

  if (ext === "txt" || ext === "md" || file.type.startsWith("text/")) {
    return { kind: "text", text: normalizeText(new TextDecoder().decode(bytes)), fileName };
  }

  const imageType = IMAGE_TYPES[ext];
  if (imageType) return { kind: "file", data: bytes, mediaType: imageType, fileName };

  throw new CvError("סוג קובץ לא נתמך. ניתן להעלות PDF, DOCX, TXT או תמונה (PNG/JPG)");
}

function normalizeText(text: string): string {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length < 80) throw new CvError("לא נמצא מספיק טקסט בקובץ. ודא/י שזהו קובץ קורות חיים");
  return clean.slice(0, 40_000);
}
