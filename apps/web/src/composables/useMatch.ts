import { ref, shallowRef } from "vue";
import type { CandidateProfile, MatchFilters, MatchResult, MatchStage } from "@sigma/shared";
import { streamMatch } from "../lib/api";

export type MatchStatus = "idle" | "running" | "done" | "error";

export function useMatch() {
  const status = ref<MatchStatus>("idle");
  const stage = ref<MatchStage | null>(null);
  const stageMessage = ref("");
  const profile = shallowRef<CandidateProfile | null>(null);
  const matches = shallowRef<MatchResult[]>([]);
  const totalPositions = ref(0);
  const screened = ref(0);
  const error = ref<string | null>(null);
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
    stageMessage.value = "מעלה את הקובץ…";

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
            screened.value = event.screened;
            stage.value = "done";
            status.value = "done";
            break;
          case "error":
            throw new Error(event.message);
        }
      }
      if (status.value !== "done") throw new Error("החיבור לשרת נותק לפני שהתקבלו תוצאות. נסו שוב");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      error.value = (err as Error).message || "אירעה שגיאה";
      status.value = "error";
    }
  }

  return { status, stage, stageMessage, profile, matches, totalPositions, screened, error, run, reset };
}
