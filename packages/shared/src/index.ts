/**
 * Types shared between the API and the web app.
 * This package is types-only so it can be imported with `import type`
 * from any runtime (Vite, Node, Vercel functions) without a build step.
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
  /** e.g. "משרה תחילית", "משרת ניהול תחום" */
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
  languages: string[];
  domains: string[];
  preferredLocations: string[];
}

export type FitLevel = "excellent" | "good" | "partial" | "low";
export type ThresholdStatus = "yes" | "partial" | "no" | "unknown";

export interface MatchResult {
  position: Position;
  /** 0-100, higher is a better fit */
  score: number;
  fitLevel: FitLevel;
  /** Does the candidate meet the formal threshold requirements (דרישות סף)? */
  meetsThreshold: ThresholdStatus;
  summary: string;
  reasons: string[];
  gaps: string[];
}

export interface MatchFilters {
  publicOnly?: boolean;
  areas?: string[];
  minJobPercent?: number;
  /** Free-text preferences from the user, e.g. "מעדיף עבודה בירושלים" */
  notes?: string;
}

export type MatchStage = "parsing" | "profiling" | "screening" | "scoring" | "done";

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
  | { type: "error"; message: string };
