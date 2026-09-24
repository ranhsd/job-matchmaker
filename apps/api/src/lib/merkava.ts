import type { Position, PositionDetails } from "@sigma/shared";
import { htmlToText } from "./text.js";

/**
 * Client for the public OData (v2, SAP Gateway) service behind
 * https://merkava.mrp.gov.il/giusp/ – the Israeli Civil Service recruitment site.
 */

const ODATA_BASE = "https://merkava.mrp.gov.il/sap/opu/odata/ILG/GIUS_PUBLIC_AREA_SRV/";
const SAP_CLIENT = "470";
const POSITION_URL = "https://merkava.mrp.gov.il/giusp/index.html#/position/";
const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 45_000;

// The site's WAF rejects requests that don't look like they come from a browser.
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "he-IL,he;q=0.9",
  "sap-language": "he",
};

/** Raw `TenderData` entity as returned by the service (only the fields we use). */
interface RawTender {
  TenderNumber: string;
  RequestId: string;
  JobName: string;
  TenderName: string;
  OfficeName: string;
  OfficeUnitName: string;
  LocationName: string;
  Area: string;
  PublishmenTypeName: string;
  IsPublic: boolean;
  HotJob: string;
  HotJobFlg: boolean;
  LevelName: string;
  JobRatingName: string;
  RankFrom: string;
  RankTo: string;
  JobPercent: string;
  NumberOfJobs: string;
  TotalAmountMin: string;
  TotalAmountMax: string;
  TenderPublicationDate: string | null;
  LastSubmittingDate: string | null;
  Tags1: string;
  Tags2: string;
  Tags3: string;
  Tags4: string;
  Tags5: string;
  ClusterName: string;
  Logo: string;
  JobDes: string;
  JobRequirements: string;
  JobRemarks: string;
}

export class MerkavaError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

async function odataGet<T>(path: string): Promise<T> {
  const url = new URL(path, ODATA_BASE);
  url.searchParams.set("sap-client", SAP_CLIENT);

  let res: Response;
  try {
    res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    throw new MerkavaError(`לא ניתן להתחבר לאתר הגיוס של שירות המדינה (${(err as Error).message})`);
  }
  if (res.status === 404) throw new MerkavaError("המשרה לא נמצאה", 404);
  if (!res.ok) throw new MerkavaError(`אתר הגיוס החזיר שגיאה ${res.status}`);

  const body = (await res.json()) as { d: T };
  return body.d;
}

/** "/Date(1791072000000)/" → ISO string */
function parseODataDate(value: string | null | undefined): string | null {
  const ms = value?.match(/\/Date\((-?\d+)/)?.[1];
  return ms ? new Date(Number(ms)).toISOString() : null;
}

function parseAmount(value: string | null | undefined): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const end = new Date(iso);
  end.setUTCHours(23, 59, 59, 999);
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000) - 1);
}

function toPosition(raw: RawTender): Position {
  const lastSubmissionDate = parseODataDate(raw.LastSubmittingDate);
  const tags = [raw.Tags1, raw.Tags2, raw.Tags3, raw.Tags4, raw.Tags5, raw.ClusterName]
    .map((t) => t?.trim())
    .filter((t): t is string => Boolean(t));

  return {
    tenderNumber: raw.TenderNumber,
    requestId: raw.RequestId,
    jobName: raw.JobName?.trim() ?? "",
    tenderName: raw.TenderName?.trim() || raw.JobName?.trim() || "",
    officeName: raw.OfficeName?.trim() ?? "",
    officeUnitName: raw.OfficeUnitName?.trim() ?? "",
    locationName: raw.LocationName?.trim() ?? "",
    area: raw.Area?.trim() ?? "",
    publicationType: raw.PublishmenTypeName?.trim() ?? "",
    isPublic: Boolean(raw.IsPublic),
    isHot: Boolean(raw.HotJobFlg) || raw.HotJob === "H" || raw.HotJob === "D",
    level: raw.LevelName?.trim() ?? "",
    jobRating: raw.JobRatingName?.trim() ?? "",
    rankFrom: raw.RankFrom?.trim() ?? "",
    rankTo: raw.RankTo?.trim() ?? "",
    jobPercent: Number(raw.JobPercent) || 0,
    numberOfJobs: Number(raw.NumberOfJobs) || 1,
    salaryMin: parseAmount(raw.TotalAmountMin),
    salaryMax: parseAmount(raw.TotalAmountMax),
    publicationDate: parseODataDate(raw.TenderPublicationDate),
    lastSubmissionDate,
    daysLeft: daysUntil(lastSubmissionDate),
    tags: [...new Set(tags)],
    logo: raw.Logo ? raw.Logo.replace("https://MERKAVA.MRP.GOV.IL:443", "https://merkava.mrp.gov.il") : null,
    url: `${POSITION_URL}${raw.RequestId}`,
  };
}

function toDetails(raw: RawTender): PositionDetails {
  return {
    ...toPosition(raw),
    description: htmlToText(raw.JobDes),
    requirements: htmlToText(raw.JobRequirements),
    remarks: htmlToText(raw.JobRemarks),
  };
}

function isOpen(p: Position): boolean {
  const now = Date.now();
  const published = p.publicationDate ? new Date(p.publicationDate).getTime() <= now : true;
  const notExpired = p.lastSubmissionDate
    ? new Date(p.lastSubmissionDate).getTime() + 86_400_000 > now
    : true;
  return published && notExpired;
}

interface CacheEntry {
  positions: PositionDetails[];
  fetchedAt: Date;
}

let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;

async function loadAll(): Promise<CacheEntry> {
  const data = await odataGet<{ results: RawTender[] }>("TenderDataSet");
  const positions = data.results
    .map(toDetails)
    .filter(isOpen)
    .sort((a, b) => (b.publicationDate ?? "").localeCompare(a.publicationDate ?? ""));
  return { positions, fetchedAt: new Date() };
}

/**
 * All currently open positions, with full description & requirements.
 * Cached in memory (warm serverless instances reuse it); on upstream failure
 * a stale cache is served rather than failing the request.
 */
export async function getOpenPositions(): Promise<CacheEntry> {
  if (cache && Date.now() - cache.fetchedAt.getTime() < CACHE_TTL_MS) return cache;

  inflight ??= loadAll()
    .then((entry) => (cache = entry))
    .catch((err) => {
      if (cache) return cache;
      throw err;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function stripDetails(p: PositionDetails): Position {
  const { description: _d, requirements: _r, remarks: _m, ...position } = p;
  return position;
}

/** Looks up a position by its RequestId – the id used in the site's `#/position/<id>` URLs. */
export async function getPosition(requestId: string): Promise<PositionDetails> {
  if (!/^\d{1,12}$/.test(requestId)) throw new MerkavaError("מזהה משרה לא תקין", 400);

  const cached = cache?.positions.find((p) => p.requestId === requestId);
  if (cached) return cached;

  const raw = await odataGet<RawTender>(`TenderDataSet('${requestId}')`);
  return toDetails(raw);
}
