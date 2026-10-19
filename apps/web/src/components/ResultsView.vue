<script setup lang="ts">
import { computed } from "vue";
import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/vue/20/solid";
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

const NOT_FOUND = "לא זוהה";

const domains = computed(() => props.profile?.domains.slice(0, 6) ?? []);
const education = computed(() => props.profile?.education.slice(0, 3) ?? []);
const skills = computed(() => [...(props.profile?.licenses ?? []), ...(props.profile?.skills ?? [])].slice(0, 8));
const years = computed(() => {
  const n = props.profile?.yearsOfExperience;
  if (n === null || n === undefined) return NOT_FOUND;
  if (n <= 0) return "ללא ניסיון";
  return n === 1 ? "שנה אחת" : `${n} שנים`;
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

        <div class="card overflow-hidden text-black/85 shadow-float" role="region" aria-labelledby="profile-title">
          <div class="h-1.5 bg-gradient-to-l from-accent-500 to-highlight-500" aria-hidden="true" />
          <div class="p-5 md:p-6">
            <p class="eyebrow">מה זיהינו בקורות החיים שלך</p>
            <h2 id="profile-title" class="mt-1 text-lg font-extrabold text-primary-900">פירוט הפרופיל האישי</h2>

            <dl class="mt-5 space-y-4">
              <div class="flex gap-3">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-600" aria-hidden="true">
                  <BriefcaseIcon class="size-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <dt class="text-xs font-bold text-primary-900/75">תחומי ניסיון שזוהו</dt>
                  <dd class="mt-1.5">
                    <ul v-if="domains.length" class="flex flex-wrap gap-1.5">
                      <li v-for="item in domains" :key="item" class="chip bg-accent-50 text-accent-700">
                        {{ item }}
                      </li>
                    </ul>
                    <span v-else class="text-sm text-black/55">{{ NOT_FOUND }}</span>
                  </dd>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div class="flex gap-3">
                  <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-600" aria-hidden="true">
                    <AcademicCapIcon class="size-5" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <dt class="text-xs font-bold text-primary-900/75">השכלה</dt>
                    <dd class="mt-1">
                      <ul v-if="education.length" class="space-y-1 text-sm leading-snug">
                        <li v-for="item in education" :key="item">
                          {{ item }}
                        </li>
                      </ul>
                      <span v-else class="text-sm text-black/55">{{ NOT_FOUND }}</span>
                    </dd>
                  </div>
                </div>

                <div class="flex gap-3 sm:w-[150px]">
                  <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-600" aria-hidden="true">
                    <ClockIcon class="size-5" />
                  </span>
                  <div class="min-w-0">
                    <dt class="text-xs font-bold text-primary-900/75">שנות ניסיון</dt>
                    <dd class="mt-1 text-sm text-black/85">{{ years }}</dd>
                  </div>
                </div>
              </div>

              <div class="flex gap-3">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-600" aria-hidden="true">
                  <WrenchScrewdriverIcon class="size-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <dt class="text-xs font-bold text-primary-900/75">כישורים ורישיונות</dt>
                  <dd class="mt-1.5">
                    <ul v-if="skills.length" class="flex flex-wrap gap-1.5">
                      <li v-for="item in skills" :key="item" class="chip">
                        {{ item }}
                      </li>
                    </ul>
                    <span v-else class="text-sm text-black/55">{{ NOT_FOUND }}</span>
                  </dd>
                </div>
              </div>
            </dl>

            <div class="mt-5 border-t border-primary-100 pt-4">
              <p class="flex items-center gap-1.5 text-xs font-bold text-primary-900/75">
                <AdjustmentsHorizontalIcon class="size-4 text-accent-600" aria-hidden="true" />
                ההעדפות שבחרת
              </p>
              <ul class="mt-2 flex flex-wrap gap-1.5" aria-label="ההעדפות שבחרת">
                <li
                  v-for="chip in preferenceChips(filters)"
                  :key="chip"
                  class="rounded-full bg-primary-900 px-3 py-1 text-xs font-bold text-white"
                >
                  {{ chip }}
                </li>
              </ul>
            </div>
          </div>
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
