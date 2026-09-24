<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  CheckCircleIcon,
} from "@heroicons/vue/20/solid";
import type { MatchResult } from "@sigma/shared";
import {
  daysLeftLabel,
  FIT_LABELS,
  formatDate,
  formatSalary,
  scoreColor,
  THRESHOLD_LABELS,
  thresholdClasses,
} from "../lib/format";
import ScoreRing from "./ScoreRing.vue";

const props = defineProps<{ matches: MatchResult[]; totalPositions: number }>();
const emit = defineEmits<{ details: [match: MatchResult] }>();

const MIN_SCORE_OPTIONS = [
  { value: 0, label: "כל ההתאמות" },
  { value: 45, label: "התאמה חלקית ומעלה (45+)" },
  { value: 70, label: "התאמה טובה ומעלה (70+)" },
  { value: 85, label: "התאמה מצוינת (85+)" },
];
const SORT_OPTIONS = [
  { value: "score", label: "מיון לפי ציון התאמה" },
  { value: "deadline", label: "מיון לפי מועד הגשה" },
] as const;

const query = ref("");
const minScore = ref(0);
const sortBy = ref<(typeof SORT_OPTIONS)[number]["value"]>("score");
const expanded = ref(new Set<string>());

const rows = computed(() => {
  const q = query.value.trim();
  const filtered = props.matches.filter((m) => {
    if (m.score < minScore.value) return false;
    if (!q) return true;
    const p = m.position;
    return [p.tenderName, p.jobName, p.officeName, p.officeUnitName, p.locationName, p.tenderNumber].some((f) =>
      f.includes(q),
    );
  });
  const sorted = [...filtered];
  if (sortBy.value === "deadline") {
    sorted.sort((a, b) => (a.position.daysLeft ?? 999) - (b.position.daysLeft ?? 999) || b.score - a.score);
  } else {
    sorted.sort((a, b) => b.score - a.score);
  }
  return sorted;
});

const rankOf = computed(() => new Map(props.matches.map((m, i) => [m.position.requestId, i + 1])));

function toggle(id: string) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}

function deadlineClass(days: number | null) {
  if (days === null) return "text-black/60";
  if (days <= 3) return "text-highlight-600 font-medium";
  if (days <= 7) return "text-amber-700";
  return "text-black/70";
}

function exportCsv() {
  const header = ["דירוג", "ציון", "רמת התאמה", "משרה", "משרד", "יחידה", "מיקום", "מספר מכרז", "סוג מכרז", "דרגה", "הגשה עד", "דרישות סף", "סיכום", "סיבות", "פערים", "קישור"];
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.value.map((m) => {
    const p = m.position;
    return [
      rankOf.value.get(p.requestId) ?? "",
      m.score,
      FIT_LABELS[m.fitLevel],
      p.tenderName,
      p.officeName,
      p.officeUnitName,
      p.locationName,
      p.tenderNumber,
      p.publicationType,
      `${p.jobRating} ${p.rankFrom}-${p.rankTo}`,
      formatDate(p.lastSubmissionDate),
      THRESHOLD_LABELS[m.meetsThreshold],
      m.summary,
      m.reasons.join(" | "),
      m.gaps.join(" | "),
      p.url,
    ]
      .map(escape)
      .join(",");
  });
  const blob = new Blob(["\uFEFF" + [header.map(escape).join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "התאמת-משרות.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
</script>

<template>
  <section class="card overflow-hidden" aria-labelledby="results-title">
    <div class="flex flex-col gap-4 border-b border-primary-100 p-5 md:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 id="results-title" class="text-xl font-bold text-primary-900 md:text-2xl">המשרות המתאימות לך</h2>
        <p class="mt-1 text-sm text-black/60">
          {{ matches.length }} משרות דורגו מתוך {{ totalPositions }} משרות פתוחות שנסרקו
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <label class="relative">
          <span class="sr-only">חיפוש בתוצאות</span>
          <MagnifyingGlassIcon class="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-black/40" />
          <input
            v-model="query"
            type="search"
            placeholder="חיפוש משרה, משרד או עיר"
            class="w-56 rounded-gov border border-primary-300 bg-white py-2 pe-3 ps-8 text-sm placeholder:text-black/40 hover:border-primary-600 focus:border-accent-500 focus:outline-none"
          />
        </label>

        <Listbox v-model="minScore" as="div" class="relative">
          <ListboxButton class="relative w-52 rounded-gov border border-primary-300 bg-white py-2 pe-9 ps-3 text-start text-sm hover:border-primary-600">
            <span class="block truncate">{{ MIN_SCORE_OPTIONS.find((o) => o.value === minScore)?.label }}</span>
            <ChevronUpDownIcon class="absolute end-2 top-1/2 size-5 -translate-y-1/2 text-black/40" aria-hidden="true" />
          </ListboxButton>
          <ListboxOptions class="absolute z-20 mt-1 w-full rounded-gov bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            <ListboxOption v-for="o in MIN_SCORE_OPTIONS" :key="o.value" v-slot="{ active, selected }" :value="o.value" as="template">
              <li class="relative cursor-pointer select-none py-2 pe-3 ps-8" :class="active ? 'bg-primary-100' : ''">
                <span :class="selected && 'font-medium'">{{ o.label }}</span>
                <CheckIcon v-if="selected" class="absolute start-2 top-1/2 size-4 -translate-y-1/2 text-primary-900" />
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Listbox>

        <Listbox v-model="sortBy" as="div" class="relative">
          <ListboxButton class="relative w-48 rounded-gov border border-primary-300 bg-white py-2 pe-9 ps-3 text-start text-sm hover:border-primary-600">
            <span class="block truncate">{{ SORT_OPTIONS.find((o) => o.value === sortBy)?.label }}</span>
            <ChevronUpDownIcon class="absolute end-2 top-1/2 size-5 -translate-y-1/2 text-black/40" aria-hidden="true" />
          </ListboxButton>
          <ListboxOptions class="absolute z-20 mt-1 w-full rounded-gov bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            <ListboxOption v-for="o in SORT_OPTIONS" :key="o.value" v-slot="{ active, selected }" :value="o.value" as="template">
              <li class="relative cursor-pointer select-none py-2 pe-3 ps-8" :class="active ? 'bg-primary-100' : ''">
                <span :class="selected && 'font-medium'">{{ o.label }}</span>
                <CheckIcon v-if="selected" class="absolute start-2 top-1/2 size-4 -translate-y-1/2 text-primary-900" />
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Listbox>

        <button type="button" class="btn-secondary !py-2 text-sm" :disabled="rows.length === 0" @click="exportCsv">
          <ArrowDownTrayIcon class="size-4" aria-hidden="true" />
          ייצוא ל-Excel
        </button>
      </div>
    </div>

    <p v-if="rows.length === 0" class="p-10 text-center text-black/60">אין תוצאות שעונות על הסינון שנבחר</p>

    <!-- Desktop table -->
    <div v-else class="hidden overflow-x-auto lg:block">
      <table class="w-full text-sm">
        <thead class="bg-primary-100 text-primary-900">
          <tr class="text-start">
            <th scope="col" class="w-12 px-4 py-3 text-start font-medium">#</th>
            <th scope="col" class="w-20 px-2 py-3 text-start font-medium">התאמה</th>
            <th scope="col" class="px-4 py-3 text-start font-medium">משרה</th>
            <th scope="col" class="px-4 py-3 text-start font-medium">מיקום</th>
            <th scope="col" class="px-4 py-3 text-start font-medium">דירוג ודרגה</th>
            <th scope="col" class="px-4 py-3 text-start font-medium">הגשה עד</th>
            <th scope="col" class="px-4 py-3 text-start font-medium">דרישות סף</th>
            <th scope="col" class="px-4 py-3 text-start font-medium"><span class="sr-only">פעולות</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="m in rows" :key="m.position.requestId">
            <tr
              class="cursor-pointer border-t border-primary-100 align-top transition hover:bg-primary-50"
              :class="expanded.has(m.position.requestId) && 'bg-primary-50'"
              @click="toggle(m.position.requestId)"
            >
              <td class="px-4 py-4 font-bold tabular-nums text-primary-400">{{ rankOf.get(m.position.requestId) }}</td>
              <td class="px-2 py-3"><ScoreRing :score="m.score" /></td>
              <td class="px-4 py-4">
                <div class="flex items-start gap-3">
                  <img
                    v-if="m.position.logo"
                    :src="m.position.logo"
                    alt=""
                    class="size-10 shrink-0 rounded-gov bg-white object-contain p-0.5 ring-1 ring-primary-100"
                    loading="lazy"
                  />
                  <div class="min-w-0">
                    <a
                      :href="m.position.url"
                      target="_blank"
                      rel="noopener"
                      class="font-bold text-primary-900 hover:text-accent-600 hover:underline"
                      @click.stop
                    >
                      {{ m.position.tenderName }}
                    </a>
                    <div class="text-black/70">{{ m.position.officeName }}</div>
                    <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-black/55">
                      <span>מכרז {{ m.position.tenderNumber }}</span>
                      <span aria-hidden="true">·</span>
                      <span>{{ m.position.publicationType }}</span>
                      <span v-if="m.position.isHot" class="rounded-full bg-highlight-50 px-2 py-0.5 font-medium text-highlight-600">משרה חמה</span>
                    </div>
                    <p class="mt-1.5 text-[13px] text-black/75">{{ m.summary }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-black/75">
                {{ m.position.locationName }}
                <div class="text-xs text-black/50">{{ m.position.area }}</div>
              </td>
              <td class="px-4 py-4 text-black/75">
                {{ m.position.jobRating }}
                <div class="text-xs text-black/50">
                  דרגות {{ m.position.rankFrom }}–{{ m.position.rankTo }}<span v-if="m.position.level"> · {{ m.position.level }}</span>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-black/75">{{ formatDate(m.position.lastSubmissionDate) }}</div>
                <div class="text-xs" :class="deadlineClass(m.position.daysLeft)">{{ daysLeftLabel(m.position.daysLeft) }}</div>
              </td>
              <td class="px-4 py-4">
                <span class="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset" :class="thresholdClasses(m.meetsThreshold)">
                  {{ THRESHOLD_LABELS[m.meetsThreshold] }}
                </span>
              </td>
              <td class="px-4 py-4">
                <button
                  type="button"
                  class="rounded-full p-1.5 text-primary-900 hover:bg-primary-100"
                  :aria-expanded="expanded.has(m.position.requestId)"
                  :aria-label="expanded.has(m.position.requestId) ? 'הסתרת פירוט ההתאמה' : 'הצגת פירוט ההתאמה'"
                  @click.stop="toggle(m.position.requestId)"
                >
                  <ChevronDownIcon class="size-5 transition" :class="expanded.has(m.position.requestId) && 'rotate-180'" />
                </button>
              </td>
            </tr>
            <tr v-if="expanded.has(m.position.requestId)" class="bg-primary-50">
              <td />
              <td colspan="7" class="px-4 pb-6 pt-1">
                <div class="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 class="mb-2 font-bold text-primary-900">למה המשרה מתאימה לך</h3>
                    <ul class="space-y-1.5">
                      <li v-for="r in m.reasons" :key="r" class="flex gap-2 text-black/80">
                        <CheckCircleIcon class="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        <span>{{ r }}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 class="mb-2 font-bold text-primary-900">כדאי לשים לב</h3>
                    <ul v-if="m.gaps.length" class="space-y-1.5">
                      <li v-for="g in m.gaps" :key="g" class="flex gap-2 text-black/80">
                        <ExclamationTriangleIcon class="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                        <span>{{ g }}</span>
                      </li>
                    </ul>
                    <p v-else class="text-black/60">לא זוהו פערים מהותיים</p>
                  </div>
                </div>
                <div class="mt-5 flex flex-wrap items-center gap-2">
                  <span v-for="t in m.position.tags" :key="t" class="chip">{{ t }}</span>
                  <span v-if="formatSalary(m.position.salaryMin, m.position.salaryMax)" class="chip !bg-emerald-50 !text-emerald-800">
                    שכר: {{ formatSalary(m.position.salaryMin, m.position.salaryMax) }}
                  </span>
                  <span class="chip">היקף משרה {{ m.position.jobPercent }}%</span>
                  <span v-if="m.position.numberOfJobs > 1" class="chip">{{ m.position.numberOfJobs }} משרות</span>
                </div>
                <div class="mt-5 flex flex-wrap gap-2">
                  <button type="button" class="btn-secondary !py-2 text-sm" @click="emit('details', m)">תיאור התפקיד ודרישות הסף</button>
                  <a :href="m.position.url" target="_blank" rel="noopener" class="btn-primary !py-2 text-sm">
                    לצפייה והגשה באתר הרשמי
                    <ArrowTopRightOnSquareIcon class="size-4 rtl:-scale-x-100" aria-hidden="true" />
                  </a>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <ul v-if="rows.length" class="divide-y divide-primary-100 lg:hidden">
      <li v-for="m in rows" :key="m.position.requestId" class="p-4">
        <Disclosure v-slot="{ open }">
          <div class="flex items-start gap-3">
            <ScoreRing :score="m.score" :size="48" />
            <div class="min-w-0 flex-1">
              <a :href="m.position.url" target="_blank" rel="noopener" class="font-bold text-primary-900 hover:underline">
                {{ m.position.tenderName }}
              </a>
              <div class="text-sm text-black/70">{{ m.position.officeName }}</div>
              <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/60">
                <span class="inline-flex items-center gap-1"><MapPinIcon class="size-3.5" />{{ m.position.locationName }}</span>
                <span :class="deadlineClass(m.position.daysLeft)">{{ daysLeftLabel(m.position.daysLeft) }}</span>
                <span>מכרז {{ m.position.tenderNumber }}</span>
              </div>
            </div>
          </div>
          <p class="mt-3 text-sm text-black/75">
            <span class="font-medium" :class="scoreColor(m.score).text">{{ FIT_LABELS[m.fitLevel] }}:</span>
            {{ m.summary }}
          </p>
          <div class="mt-2 flex items-center justify-between">
            <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset" :class="thresholdClasses(m.meetsThreshold)">
              {{ THRESHOLD_LABELS[m.meetsThreshold] }}
            </span>
            <DisclosureButton class="inline-flex items-center gap-1 text-sm font-medium text-accent-600">
              {{ open ? "פחות" : "למה זה מתאים?" }}
              <ChevronDownIcon class="size-4 transition" :class="open && 'rotate-180'" />
            </DisclosureButton>
          </div>
          <DisclosurePanel class="mt-3 space-y-3 rounded-gov bg-primary-50 p-3 text-sm">
            <ul class="space-y-1.5">
              <li v-for="r in m.reasons" :key="r" class="flex gap-2">
                <CheckCircleIcon class="mt-0.5 size-4 shrink-0 text-emerald-600" />{{ r }}
              </li>
              <li v-for="g in m.gaps" :key="g" class="flex gap-2">
                <ExclamationTriangleIcon class="mt-0.5 size-4 shrink-0 text-amber-600" />{{ g }}
              </li>
            </ul>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn-secondary !px-3 !py-1.5 text-sm" @click="emit('details', m)">פרטי המשרה</button>
              <a :href="m.position.url" target="_blank" rel="noopener" class="btn-primary !px-3 !py-1.5 text-sm">להגשה באתר הרשמי</a>
            </div>
          </DisclosurePanel>
        </Disclosure>
      </li>
    </ul>
  </section>
</template>
