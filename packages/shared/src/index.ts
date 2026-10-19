/**
 * Types shared between the API and the web app.
 * This package is types-only so it can be imported with `import type`
 * from any runtime (Vite, Node) without a build step.
 */

export interface Position {
  /** Public tender number shown on the site (e.g. "144108") */
  tenderNumber: string;
  /** Internal id used in the site's position URL: #/position/<requestId> */
  requestId: string;
  jobName: string;
  tenderName: string;
  officeName: string;
  officeUnitName: string;
  locationName: string;
  area: string;
  /** e.g. "מכרז פומבי", "מכרז פנימי", "מכרז בינמשרדי" */
  publicationType: string;
  isPublic: boolean;
  isHot: boolean;
  /** e.g. "משרה תחילית", "משרת ניהול תחום". Empty for most internal tenders. */
  level: string;
  /** Salary scale, e.g. "מח"ר" or "031 רופאים" */
  jobRating: string;
  rankFrom: string;
  rankTo: string;
  jobPercent: number;
  numberOfJobs: number;
  salaryMin: number | null;
  salaryMax: number | null;
  publicationDate: string | null;
  lastSubmissionDate: string | null;
  daysLeft: number | null;
  /** Professional fields the site tags the position with, e.g. "חוק ומשפט" */
  fields: string[];
  tags: string[];
  logo: string | null;
  url: string;
}

export interface PositionDetails extends Position {
  description: string;
  requirements: string;
  remarks: string;
}

export interface PositionsResponse {
  positions: Position[];
  total: number;
  fetchedAt: string;
}

export interface CandidateProfile {
  fullName: string | null;
  headline: string;
  summary: string;
  yearsOfExperience: number | null;
  seniority: string;
  education: string[];
  skills: string[];
  licenses: string[];
  languages: string[];
  domains: string[];
  preferredLocations: string[];
}

/**
 * - `strong`: high professional fit to the experience and skills in the CV
 * - `possible`: a possible fit, with requirements worth checking
 * - `discover`: an adjacent field where the candidate's skills may be relevant
 */
export type MatchCategory = "strong" | "possible" | "discover";

/**
 * - `supported`: the CV supports the requirement
 * - `unclear`: not enough information in the CV, which does not mean the requirement is unmet
 * - `gap`: the CV shows a material gap
 */
export type CheckStatus = "supported" | "unclear" | "gap";

export interface RequirementCheck {
  status: CheckStatus;
  requirement: string;
  note: string;
}

export interface MatchResult {
  position: Position;
  category: MatchCategory;
  /** 0-100, orders matches within a category */
  score: number;
  /** Why the position is worth knowing about, tied to the CV */
  whyRelevant: string;
  /** Facts identified in the CV that support the match */
  evidence: string[];
  /** Material requirements of the tender and what the CV shows about each */
  checks: RequirementCheck[];
}

/**
 * - `public`: public tenders only
 * - `employees`: every tender a civil servant can apply to (internal, inter-office and public)
 */
export type TenderAudience = "public" | "employees";
export type JobScope = "full" | "partial";

export interface MatchFilters {
  audience?: TenderAudience;
  area?: string;
  jobScope?: JobScope;
  field?: string;
  level?: string;
  /** Free-text preferences from the user, e.g. "עבודה היברידית" */
  notes?: string;
}

export type MatchStage = "parsing" | "profiling" | "screening" | "scoring" | "done";

/** `file`: the CV could not be read. `search`: matching failed or is temporarily unavailable. */
export type MatchErrorCode = "file" | "search";

export interface ApiError {
  error: string;
  code: MatchErrorCode;
}

export type MatchEvent =
  | { type: "stage"; stage: MatchStage; message: string }
  | { type: "profile"; profile: CandidateProfile }
  | {
      type: "result";
      matches: MatchResult[];
      totalPositions: number;
      screened: number;
      model: string;
    }
  | { type: "error"; code: MatchErrorCode; message: string };
