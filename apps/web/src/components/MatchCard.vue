<script setup lang="ts">
import { computed } from "vue";
import { ArrowTopRightOnSquareIcon, CheckIcon } from "@heroicons/vue/20/solid";
import type { MatchResult } from "@sigma/shared";
import {
  CATEGORIES,
  CHECK_ORDER,
  formatDate,
  jobScopeLabel,
  MATCH_DISCLAIMER,
  tenderTypeLabel,
  UNCLEAR_ADVICE,
} from "../lib/format";
import CheckBox from "./CheckBox.vue";
import RecruitmentLink from "./RecruitmentLink.vue";

const props = withDefaults(defineProps<{ match: MatchResult; layout?: "split" | "stacked"; sample?: boolean }>(), {
  layout: "split",
  sample: false,
});

const category = computed(() => CATEGORIES[props.match.category]);
const position = computed(() => props.match.position);
const allSupported = computed(() => props.match.checks.length > 0 && props.match.checks.every((c) => c.status === "supported"));
const groups = computed(() =>
  CHECK_ORDER.map((status) => ({ status, items: props.match.checks.filter((c) => c.status === status) })).filter(
    (g) => g.items.length > 0,
  ),
);
const titleId = computed(() => `match-${props.sample ? "sample" : position.value.requestId}`);
</script>

<template>
  <article
    class="card overflow-hidden"
    :class="layout === 'split' ? 'grid md:grid-cols-2' : 'flex flex-col'"
    :aria-labelledby="titleId"
  >
    <div :class="layout === 'split' ? 'p-5 md:p-6' : 'contents'">
      <header :class="layout === 'stacked' && 'p-5 md:p-6'">
        <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <h3 :id="titleId" class="text-lg font-extrabold leading-snug text-primary-900">{{ position.tenderName }}</h3>
          <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" :class="category.badge">{{ category.label }}</span>
        </div>
        <p class="mt-1 text-sm text-black/65">
          {{ position.officeName }}<span v-if="position.locationName"> | {{ position.locationName }}</span>
        </p>
        <ul class="mt-3 flex flex-wrap gap-1.5" aria-label="פרטי המשרה">
          <li class="chip">{{ jobScopeLabel(position) }}</li>
          <li class="chip">{{ tenderTypeLabel(position) }}</li>
          <li v-if="position.level" class="chip">רמת תפקיד: {{ position.level }}</li>
          <li v-if="position.lastSubmissionDate" class="chip">מועד אחרון להגשה: {{ formatDate(position.lastSubmissionDate) }}</li>
        </ul>
      </header>

      <section :class="layout === 'split' ? 'mt-5' : 'border-t border-primary-100 p-5 md:p-6'">
        <h4 class="text-sm font-bold text-primary-900">למה כדאי לך להכיר את המשרה?</h4>
        <p class="mt-1.5 text-[15px] leading-relaxed text-black/75">{{ match.whyRelevant }}</p>
      </section>

      <section v-if="match.evidence.length" :class="layout === 'split' ? 'mt-5' : 'border-t border-primary-100 p-5 md:p-6'">
        <div class="flex items-center justify-between gap-3">
          <h4 class="text-sm font-bold text-primary-900">מידת ההתאמה המקצועית</h4>
          <span v-if="layout === 'stacked'" class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="category.badge">
            {{ category.shortLabel }}
          </span>
        </div>
        <p class="mt-1.5 text-xs font-bold text-primary-900/80">מה זיהינו בקורות החיים?</p>
        <ul class="mt-2 space-y-1.5">
          <li v-for="item in match.evidence" :key="item" class="flex items-start gap-2 text-sm text-black/80">
            <CheckIcon class="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            {{ item }}
          </li>
        </ul>
      </section>
    </div>

    <div
      class="flex flex-col"
      :class="layout === 'split' ? 'border-t border-primary-100 p-5 md:border-s md:border-t-0 md:p-6' : 'border-t border-primary-100 p-5 md:p-6'"
    >
      <template v-if="allSupported">
        <CheckBox status="supported" title="">נמצא בקורות החיים מידע תומך לדרישות המרכזיות של המשרה.</CheckBox>
      </template>
      <section v-else-if="groups.length">
        <h4 class="text-sm font-bold text-primary-900">מה כדאי לבדוק לפני הגשת מועמדות?</h4>
        <div class="mt-3 space-y-2.5">
          <CheckBox v-for="group in groups" :key="group.status" :status="group.status">
            <ul class="space-y-1.5">
              <li v-for="check in group.items" :key="check.requirement">
                <span class="font-medium text-black/85">{{ check.requirement }}</span>
                <span v-if="check.note"> – {{ check.note }}</span>
              </li>
            </ul>
            <p v-if="group.status === 'unclear'" class="mt-2">{{ UNCLEAR_ADVICE }}</p>
          </CheckBox>
        </div>
      </section>

      <div class="mt-auto pt-6">
        <span v-if="sample" class="btn-primary w-full" aria-hidden="true">
          לפרטי המכרז ולהגשת מועמדות
          <ArrowTopRightOnSquareIcon class="size-4 rtl:-scale-x-100" />
        </span>
        <RecruitmentLink v-else :href="position.url" class="btn-primary w-full">
          לפרטי המכרז ולהגשת מועמדות
          <ArrowTopRightOnSquareIcon class="size-4 rtl:-scale-x-100" aria-hidden="true" />
          <span class="sr-only">(נפתח בחלון חדש)</span>
        </RecruitmentLink>
        <p class="mt-2.5 text-center text-xs text-black/55">{{ MATCH_DISCLAIMER }}</p>
      </div>
    </div>
  </article>
</template>
