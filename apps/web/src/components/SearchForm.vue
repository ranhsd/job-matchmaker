<script setup lang="ts">
import { computed } from "vue";
import { RadioGroup, RadioGroupLabel, RadioGroupOption } from "@headlessui/vue";
import { ArrowPathIcon, ChevronDownIcon, SparklesIcon } from "@heroicons/vue/20/solid";
import type { JobScope, MatchFilters, MatchStage, TenderAudience } from "@sigma/shared";
import { JOB_SCOPE_LABELS } from "../lib/format";
import CvUploader from "./CvUploader.vue";
import MatchProgress from "./MatchProgress.vue";

const file = defineModel<File | null>("file", { required: true });
const filters = defineModel<MatchFilters>("filters", { required: true });
defineProps<{
  areas: string[];
  fields: string[];
  levels: string[];
  running: boolean;
  stage: MatchStage | null;
  stageMessage: string;
}>();
const emit = defineEmits<{ submit: [] }>();

const AUDIENCES: { value: TenderAudience; label: string }[] = [
  { value: "public", label: "מכרזים פומביים לציבור הרחב" },
  { value: "employees", label: "מכרזים לעובדי מדינה" },
];

function model<K extends keyof MatchFilters>(key: K) {
  return computed({
    get: () => filters.value[key] ?? "",
    set: (value) => (filters.value[key] = (value || undefined) as MatchFilters[K]),
  });
}

const audience = computed({
  get: () => filters.value.audience ?? "public",
  set: (value: TenderAudience) => (filters.value.audience = value),
});
const area = model("area");
const jobScope = model("jobScope");
const field = model("field");
const level = model("level");
const notes = model("notes");

const SCOPES = Object.entries(JOB_SCOPE_LABELS) as [JobScope, string][];
</script>

<template>
  <div id="upload" class="card scroll-mt-24 p-6 text-black/85 shadow-float md:p-7" role="region" aria-labelledby="upload-title">
    <h2 id="upload-title" class="text-xl font-extrabold text-primary-900">מתחילים מקורות החיים שלך</h2>
    <p class="mt-1 text-sm text-black/60">קובץ אחד, ומתחילים לגלות אפשרויות.</p>

    <RadioGroup v-model="audience" :disabled="running" class="mt-5">
      <RadioGroupLabel class="field-label">סינון לפי סוגי מכרזים</RadioGroupLabel>
      <div class="grid grid-cols-2 gap-1 rounded-xl bg-primary-100 p-1">
        <RadioGroupOption v-for="option in AUDIENCES" :key="option.value" v-slot="{ checked }" :value="option.value" as="template">
          <button
            type="button"
            class="rounded-lg px-2 py-2.5 text-[13px] font-medium transition sm:text-sm"
            :class="checked ? 'bg-white font-bold text-primary-900 shadow-sm' : 'text-primary-900/75 hover:text-primary-900'"
          >
            {{ option.label }}
          </button>
        </RadioGroupOption>
      </div>
    </RadioGroup>

    <div class="mt-4">
      <CvUploader v-model="file" :disabled="running" />
    </div>

    <fieldset class="mt-5 border-t border-primary-200/70 pt-5" :disabled="running">
      <legend class="sr-only">התאמת החיפוש להעדפות</legend>
      <p class="mb-3 text-sm font-bold text-primary-900" aria-hidden="true">התאמת החיפוש להעדפות</p>
      <div class="grid grid-cols-2 gap-x-3 gap-y-3.5">
        <div>
          <label for="pref-area" class="field-label">אזור עבודה</label>
          <div class="relative">
            <select id="pref-area" v-model="area" class="field-control appearance-none pe-9">
              <option value="">כל הארץ</option>
              <option v-for="a in areas" :key="a" :value="a">{{ a }}</option>
            </select>
            <ChevronDownIcon class="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-primary-900" aria-hidden="true" />
          </div>
        </div>
        <div>
          <label for="pref-scope" class="field-label">היקף משרה</label>
          <div class="relative">
            <select id="pref-scope" v-model="jobScope" class="field-control appearance-none pe-9">
              <option value="">כל ההיקפים</option>
              <option v-for="[value, label] in SCOPES" :key="value" :value="value">{{ label }}</option>
            </select>
            <ChevronDownIcon class="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-primary-900" aria-hidden="true" />
          </div>
        </div>
        <div>
          <label for="pref-field" class="field-label">תחום מקצועי</label>
          <div class="relative">
            <select id="pref-field" v-model="field" class="field-control appearance-none pe-9">
              <option value="">כל התחומים</option>
              <option v-for="f in fields" :key="f" :value="f">{{ f }}</option>
            </select>
            <ChevronDownIcon class="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-primary-900" aria-hidden="true" />
          </div>
        </div>
        <div>
          <label for="pref-level" class="field-label">רמת תפקיד</label>
          <div class="relative">
            <select id="pref-level" v-model="level" class="field-control appearance-none pe-9">
              <option value="">כל הרמות</option>
              <option v-for="l in levels" :key="l" :value="l">{{ l }}</option>
            </select>
            <ChevronDownIcon class="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-primary-900" aria-hidden="true" />
          </div>
        </div>
        <div class="col-span-2">
          <label for="pref-notes" class="field-label">העדפות נוספות</label>
          <input
            id="pref-notes"
            v-model="notes"
            type="text"
            maxlength="500"
            placeholder="לדוגמה: עבודה היברידית"
            class="field-control"
          />
        </div>
      </div>
    </fieldset>

    <button type="button" class="btn-primary mt-5 w-full text-base" :disabled="!file || running" @click="emit('submit')">
      <ArrowPathIcon v-if="running" class="size-5 animate-spin" aria-hidden="true" />
      <SparklesIcon v-else class="size-5" aria-hidden="true" />
      {{ running ? "מחפשים משרות…" : "מצאו לי משרות" }}
    </button>

    <MatchProgress v-if="running" class="mt-4" :stage="stage" :message="stageMessage" />
    <p v-else class="mt-3 text-center text-xs text-black/55">ההתאמה מבוססת על המידע בקורות החיים ועל ההעדפות שבחרת.</p>
  </div>
</template>
