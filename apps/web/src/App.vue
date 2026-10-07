<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from "vue";
import { ExclamationCircleIcon } from "@heroicons/vue/20/solid";
import type { MatchFilters, MatchResult, Position } from "@sigma/shared";
import AppFooter from "./components/AppFooter.vue";
import AppHeader from "./components/AppHeader.vue";
import CtaBanner from "./components/CtaBanner.vue";
import HeroSection from "./components/HeroSection.vue";
import HowItWorksSection from "./components/HowItWorksSection.vue";
import MatchProgress from "./components/MatchProgress.vue";
import PositionDialog from "./components/PositionDialog.vue";
import ProfileCard from "./components/ProfileCard.vue";
import ResultsTable from "./components/ResultsTable.vue";
import StatsBand from "./components/StatsBand.vue";
import TransparencySection from "./components/TransparencySection.vue";
import { useMatch } from "./composables/useMatch";
import { fetchPositions } from "./lib/api";

const file = ref<File | null>(null);
const filters = ref<MatchFilters>({ publicOnly: true });
const positions = shallowRef<Position[] | null>(null);
const selected = shallowRef<MatchResult | null>(null);
const resultsAnchor = ref<HTMLElement>();

const { status, stage, stageMessage, profile, matches, totalPositions, error, run, reset } = useMatch();

const areas = computed(() => [...new Set((positions.value ?? []).map((p) => p.area).filter(Boolean))]);
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
  goToUpload();
}

function goToUpload() {
  document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

watch(status, (s) => {
  if (s === "done") nextTick(() => resultsAnchor.value?.scrollIntoView({ behavior: "smooth", block: "start" }));
});
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2">
      דלג לתוכן המרכזי
    </a>
    <AppHeader />

    <main id="main" class="flex-1">
      <HowItWorksSection />
      <TransparencySection @cta="goToUpload" />
      <CtaBanner @cta="goToUpload" />

      <HeroSection v-model:file="file" v-model:filters="filters" :areas="areas" :running="running" @submit="submit" />

      <StatsBand v-if="status === 'idle'" :open-positions="positions ? positions.length : null" :offices="offices" />

      <div v-else ref="resultsAnchor" class="mx-auto max-w-[1190px] scroll-mt-24 space-y-8 px-4 py-10 md:py-14">
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
        </template>

        <div v-if="status !== 'running'" class="text-center">
          <button type="button" class="btn-secondary" @click="startOver">התאמה לקורות חיים אחרים</button>
        </div>
      </div>
    </main>

    <AppFooter />
    <PositionDialog :match="selected" @close="selected = null" />
  </div>
</template>
