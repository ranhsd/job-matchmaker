import { ref, shallowRef } from "vue";
import type { CandidateProfile, MatchErrorCode, MatchFilters, MatchResult, MatchStage } from "@sigma/shared";
import { RequestError, streamMatch } from "../lib/api";

export type MatchStatus = "idle" | "running" | "done" | "error";

export function useMatch() {
  const status = ref<MatchStatus>("idle");
  const stage = ref<MatchStage | null>(null);
  const stageMessage = ref("");
  const profile = shallowRef<CandidateProfile | null>(null);
  const matches = shallowRef<MatchResult[]>([]);
  const totalPositions = ref(0);
  const error = ref<string | null>(null);
  const errorCode = ref<MatchErrorCode>("search");
  let controller: AbortController | null = null;

  function reset() {
    controller?.abort();
    status.value = "idle";
    stage.value = null;
    stageMessage.value = "";
    profile.value = null;
    matches.value = [];
    error.value = null;
  }

  async function run(file: File, filters: MatchFilters) {
    reset();
    controller = new AbortController();
    status.value = "running";
    stage.value = "parsing";
    stageMessage.value = "מעלים את הקובץ…";

    try {
      for await (const event of streamMatch(file, filters, controller.signal)) {
        switch (event.type) {
          case "stage":
            stage.value = event.stage;
            stageMessage.value = event.message;
            break;
          case "profile":
            profile.value = event.profile;
            break;
          case "result":
            matches.value = event.matches;
            totalPositions.value = event.totalPositions;
            stage.value = "done";
            status.value = "done";
            break;
          case "error":
            throw new RequestError(event.message, event.code);
        }
      }
      if (status.value !== "done") throw new RequestError("החיבור לשרת נותק לפני שהתקבלו תוצאות");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      error.value = (err as Error).message || null;
      errorCode.value = err instanceof RequestError ? err.code : "search";
      status.value = "error";
    }
  }

  return { status, stage, stageMessage, profile, matches, totalPositions, error, errorCode, run, reset };
}
