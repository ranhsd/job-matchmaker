<script setup lang="ts">
import { computed } from "vue";
import { AdjustmentsHorizontalIcon, ArrowPathIcon } from "@heroicons/vue/20/solid";
import type { CandidateProfile, MatchFilters, MatchResult } from "@sigma/shared";
import { CATEGORIES, CATEGORY_ORDER, preferenceChips } from "../lib/format";
import MatchCard from "./MatchCard.vue";
import SurveyCard from "./SurveyCard.vue";

const props = defineProps<{ profile: CandidateProfile | null; matches: MatchResult[]; filters: MatchFilters }>();
const emit = defineEmits<{ change: []; restart: [] }>();

const sections = computed(() =>
  CATEGORY_ORDER.map((id) => ({ id, ...CATEGORIES[id], matches: props.matches.filter((m) => m.category === id) })).filter(
    (s) => s.matches.length > 0,
  ),
);

const profileRows = computed(() => {
  const p = props.profile;
  if (!p) return [];
  return [
    { label: "תחומי ניסיון שזוהו", value: p.domains.join(", ") },
    { label: "השכלה", value: p.education.slice(0, 2).join("; ") },
    { label: "שנות ניסיון", value: p.yearsOfExperience !== null ? `${p.yearsOfExperience}` : "" },
    { label: "כישורים ורישיונות", value: [...p.licenses, ...p.skills].slice(0, 6).join(", ") },
  ].map((row) => ({ ...row, value: row.value || "לא זוהה" }));
});
</script>

<template>
  <div>
    <section class="relative isolate overflow-hidden bg-primary-900 text-white" aria-labelledby="results-title">
      <div aria-hidden="true" class="pointer-events-none absolute -bottom-64 -start-24 size-[420px] rounded-full bg-accent-500/20" />
      <div class="relative mx-auto grid max-w-[1190px] items-start gap-8 px-4 py-10 md:py-12 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-14">
        <div>
          <h1 id="results-title" class="text-[30px] font-black leading-tight md:text-[40px]">מצאנו משרות שכדאי לך להכיר!</h1>
          <p class="mt-4 text-[15px] leading-relaxed text-white/85 md:text-base">
            התוצאות מבוססות על הניסיון והכישורים שזוהו בקורות החיים שלך, לצד ההעדפות שבחרת.
          </p>
          <p class="mt-2 text-[15px] leading-relaxed text-white/85 md:text-base">
            חלק מהמשרות עשויות להיות מוכרות לך, ואחרות יכולות לפתוח כיווני קריירה חדשים.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary-900 transition hover:bg-primary-100"
              @click="emit('change')"
            >
              <AdjustmentsHorizontalIcon class="size-4" aria-hidden="true" />
              שינוי העדפות
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-white/60 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              @click="emit('restart')"
            >
              <ArrowPathIcon class="size-4" aria-hidden="true" />
              חיפוש מחדש
            </button>
          </div>
        </div>

        <div class="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 md:p-6">
          <h2 class="font-bold">פירוט הפרופיל האישי</h2>
          <dl class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div v-for="row in profileRows" :key="row.label">
              <dt class="text-white/70">{{ row.label }}</dt>
              <dd class="mt-0.5 font-bold">{{ row.value }}</dd>
            </div>
          </dl>
          <p class="mt-4 text-sm text-white/70">ההעדפות שבחרת</p>
          <ul class="mt-2 flex flex-wrap gap-1.5">
            <li v-for="chip in preferenceChips(filters)" :key="chip" class="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium ring-1 ring-white/15">
              {{ chip }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-[1190px] space-y-12 px-4 py-10 md:py-14">
      <section v-for="section in sections" :key="section.id" :aria-labelledby="`section-${section.id}`">
        <h2 :id="`section-${section.id}`" class="flex items-center gap-2.5 text-[22px] font-extrabold text-primary-900 md:text-2xl">
          <span class="size-2.5 shrink-0 rounded-full" :class="section.dot" aria-hidden="true" />
          {{ section.title }}
        </h2>
        <p class="mt-1 text-[15px] text-black/65">{{ section.description }}</p>
        <div class="mt-5 space-y-5">
          <MatchCard v-for="match in section.matches" :key="match.position.requestId" :match="match" />
        </div>
      </section>

      <SurveyCard />
    </div>
  </div>
</template>
