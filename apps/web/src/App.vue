<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from "vue";
import { ArrowPathIcon, ExclamationCircleIcon, SparklesIcon } from "@heroicons/vue/20/solid";
import { DocumentMagnifyingGlassIcon, ListBulletIcon, ScaleIcon } from "@heroicons/vue/24/outline";
import type { MatchFilters, MatchResult, Position } from "@sigma/shared";
import AppFooter from "./components/AppFooter.vue";
import AppHeader from "./components/AppHeader.vue";
import CvUploader from "./components/CvUploader.vue";
import HeroSection from "./components/HeroSection.vue";
import HotJobsSection from "./components/HotJobsSection.vue";
import MatchOptions from "./components/MatchOptions.vue";
import MatchProgress from "./components/MatchProgress.vue";
import OfficesSection from "./components/OfficesSection.vue";
import PositionDialog from "./components/PositionDialog.vue";
import ProfileCard from "./components/ProfileCard.vue";
import ResultsTable from "./components/ResultsTable.vue";
import { useMatch } from "./composables/useMatch";
import { fetchPositions } from "./lib/api";

const file = ref<File | null>(null);
const filters = ref<MatchFilters>({ publicOnly: true });
const positions = shallowRef<Position[] | null>(null);
const selected = shallowRef<MatchResult | null>(null);
const resultsAnchor = ref<HTMLElement>();

const { status, stage, stageMessage, profile, matches, totalPositions, error, run, reset } = useMatch();

const areas = computed(() => [...new Set((positions.value ?? []).map((p) => p.area).filter(Boolean))]);
const hotPositions = computed(() => (positions.value ?? []).filter((p) => p.isHot));
const offices = computed(() =>
  positions.value ? new Set(positions.value.map((p) => p.officeName)).size : null,
);
const running = computed(() => status.value === "running");

onMounted(async () => {
  try {
    positions.value = (await fetchPositions()).positions;
  } catch {
    positions.value = [];
  }
});

async function submit() {
  if (!file.value || running.value) return;
  await nextTick();
  resultsAnchor.value?.scrollIntoView({ behavior: "smooth", block: "start" });
  await run(file.value, filters.value);
}

function startOver() {
  reset();
  file.value = null;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

watch(status, (s) => {
  if (s === "done") nextTick(() => resultsAnchor.value?.scrollIntoView({ behavior: "smooth", block: "start" }));
});

const HOW_IT_WORKS = [
  { icon: DocumentMagnifyingGlassIcon, title: "ניתוח קורות החיים", text: "ה-AI מזהה השכלה, ניסיון, כישורים ורישיונות מקצועיים – גם בקבצי PDF בעברית." },
  { icon: ListBulletIcon, title: "סריקת כל המכרזים", text: "כל המשרות הפתוחות באתר נציבות שירות המדינה נסרקות ומסוננות לפי התחום שלך." },
  { icon: ScaleIcon, title: "דירוג והסבר", text: "המשרות הרלוונטיות מדורגות לעומק מול דרישות הסף, עם הסבר מדוע הן מתאימות ומה חסר." },
];
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2">
      דלג לתוכן המרכזי
    </a>
    <AppHeader />

    <main id="main" class="flex-1">
      <HeroSection
        v-model="filters"
        :open-positions="positions ? positions.length : null"
        :offices="offices"
        :hot-count="positions ? hotPositions.length : null"
        :areas="areas"
      />

      <HotJobsSection v-model="filters" :hot-positions="hotPositions" :loaded="positions !== null" />

      <div class="mx-auto max-w-[1190px] space-y-8 px-4 py-10 md:py-14">
        <section id="upload" class="card scroll-mt-24 p-6 md:p-8" aria-labelledby="upload-title">
          <div class="grid gap-8 lg:grid-cols-5">
            <div class="lg:col-span-3">
              <h2 id="upload-title" class="mb-1 text-xl font-bold text-primary-900 md:text-2xl">העלאת קורות חיים</h2>
              <p class="mb-5 text-sm text-black/60">הקובץ מעובד לצורך ההתאמה בלבד ואינו נשמר.</p>
              <CvUploader v-model="file" :disabled="running" />
            </div>
            <div class="flex flex-col justify-between gap-6 lg:col-span-2">
              <MatchOptions v-model="filters" :areas="areas" :disabled="running" />
              <button type="button" class="btn-primary w-full text-base" :disabled="!file || running" @click="submit">
                <ArrowPathIcon v-if="running" class="size-5 animate-spin" aria-hidden="true" />
                <SparklesIcon v-else class="size-5" aria-hidden="true" />
                {{ running ? "מחפש משרות מתאימות…" : "מצאו לי משרות מתאימות" }}
              </button>
            </div>
          </div>
        </section>

        <div ref="resultsAnchor" class="scroll-mt-24 space-y-8">
          <MatchProgress v-if="running" :stage="stage" :message="stageMessage" />

          <div v-if="status === 'error'" role="alert" class="card flex items-start gap-3 border-s-4 border-highlight-500 p-5">
            <ExclamationCircleIcon class="size-6 shrink-0 text-highlight-600" aria-hidden="true" />
            <div class="flex-1">
              <p class="font-bold text-primary-900">לא הצלחנו להשלים את ההתאמה</p>
              <p class="text-black/70">{{ error }}</p>
            </div>
            <button type="button" class="btn-secondary !py-2 text-sm" :disabled="!file" @click="submit">נסו שוב</button>
          </div>

          <ProfileCard v-if="profile" :profile="profile" />

          <template v-if="status === 'done'">
            <ResultsTable v-if="matches.length" :matches="matches" :total-positions="totalPositions" @details="selected = $event" />
            <div v-else class="card p-10 text-center">
              <p class="text-lg font-bold text-primary-900">לא נמצאו משרות מתאימות כרגע</p>
              <p class="mt-1 text-black/60">נסו להסיר סינונים או לחזור בעוד כמה ימים – משרות חדשות מתפרסמות כל הזמן.</p>
            </div>
            <div class="text-center">
              <button type="button" class="btn-secondary" @click="startOver">התאמה לקורות חיים אחרים</button>
            </div>
          </template>
        </div>

        <section v-if="status === 'idle'" id="how" class="scroll-mt-24 pt-4" aria-labelledby="how-title">
          <h2 id="how-title" class="section-title mb-6 text-center">איך זה עובד?</h2>
          <ol class="grid gap-6 md:grid-cols-3">
            <li v-for="(step, i) in HOW_IT_WORKS" :key="step.title" class="card relative p-6">
              <span class="absolute end-5 top-4 text-5xl font-extrabold text-primary-100">{{ i + 1 }}</span>
              <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-primary-100">
                <component :is="step.icon" class="size-6 text-primary-800" aria-hidden="true" />
              </div>
              <h3 class="mb-1 text-lg font-bold text-primary-900">{{ step.title }}</h3>
              <p class="text-[15px] text-black/70">{{ step.text }}</p>
            </li>
          </ol>
        </section>
      </div>

      <OfficesSection v-if="status === 'idle'" :positions="positions ?? []" />
    </main>

    <AppFooter />
    <PositionDialog :match="selected" @close="selected = null" />
  </div>
</template>
