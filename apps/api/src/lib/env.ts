function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const env = {
  get googleApiKey() {
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
  },
  /** Model for CV profiling and screening the whole catalog (cheap, large context). */
  get model() {
    return process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  },
  /** Model for detailed scoring of the shortlist. Can be upgraded (e.g. gemini-3.8-flash) for better reasoning. */
  get scoringModel() {
    return process.env.GEMINI_SCORING_MODEL || this.model;
  },
  get shortlistSize() {
    return int(process.env.MATCH_SHORTLIST_SIZE, 24);
  },
  get rateLimitPerHour() {
    return int(process.env.RATE_LIMIT_PER_HOUR, 10);
  },
};
