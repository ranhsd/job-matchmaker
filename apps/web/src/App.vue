<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from "vue";
import type { MatchFilters, Position } from "@sigma/shared";
import AboutSection from "./components/AboutSection.vue";
import AppFooter from "./components/AppFooter.vue";
import AppHeader from "./components/AppHeader.vue";
import CtaBanner from "./components/CtaBanner.vue";
import HeroSection from "./components/HeroSection.vue";
import HowItWorksSection from "./components/HowItWorksSection.vue";
import InfoDialog from "./components/InfoDialog.vue";
import LeaveSiteDialog from "./components/LeaveSiteDialog.vue";
import MatchExampleSection from "./components/MatchExampleSection.vue";
import ResultsView from "./components/ResultsView.vue";
import SystemMessage from "./components/SystemMessage.vue";
import { useMatch } from "./composables/useMatch";
import { fetchPositions } from "./lib/api";
import { type InfoTopic, sortLevels } from "./lib/format";

const file = ref<File | null>(null);
const filters = ref<MatchFilters>({ audience: "public" });
const positions = shallowRef<Position[]>([]);
const infoTopic = ref<InfoTopic | null>(null);

const { status, stage, stageMessage, profile, matches, error, errorCode, run, reset } = useMatch();

const running = computed(() => status.value === "running");
const view = computed(() => {
  if (status.value === "done") return matches.value.length ? "results" : "empty";
  if (status.value === "error") return errorCode.value;
  return "landing";
});

const sorted = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "he"));
const areas = computed(() => sorted(positions.value.map((p) => p.area)));
const fields = computed(() => sorted(positions.value.flatMap((p) => p.fields)));
const levels = computed(() => sortLevels([...new Set(positions.value.map((p) => p.level).filter(Boolean))]));

onMounted(async () => {
  try {
    positions.value = (await fetchPositions()).positions;
  } catch {
    positions.value = [];
  }
});

async function submit() {
  if (!file.value || running.value) return;
  await run(file.value, filters.value);
}

async function goToForm() {
  if (view.value !== "landing") reset();
  await nextTick();
  document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startOver() {
  file.value = null;
  goToForm();
}

function goHome() {
  if (view.value !== "landing") reset();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

watch(view, (next, prev) => {
  if (next !== prev && next !== "landing") nextTick(() => window.scrollTo({ top: 0 }));
});
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2">
      דלג לתוכן המרכזי
    </a>
    <AppHeader @home="goHome" />

    <main id="main" class="flex-1">
      <template v-if="view === 'landing'">
        <HeroSection
          v-model:file="file"
          v-model:filters="filters"
          :areas="areas"
          :fields="fields"
          :levels="levels"
          :running="running"
          :stage="stage"
          :stage-message="stageMessage"
          @submit="submit"
        />
        <HowItWorksSection />
        <MatchExampleSection />
        <CtaBanner @cta="goToForm" />
        <AboutSection @privacy="infoTopic = 'privacy'" />
      </template>

      <ResultsView
        v-else-if="view === 'results'"
        :profile="profile"
        :matches="matches"
        :filters="filters"
        @change="goToForm"
        @restart="startOver"
      />

      <SystemMessage
        v-else
        :kind="view"
        :detail="error?.replace(/\.\s*$/, '')"
        @home="goHome"
        @upload="startOver"
        @retry="submit"
      />
    </main>

    <AppFooter @info="infoTopic = $event" />
    <InfoDialog :topic="infoTopic" @close="infoTopic = null" />
    <LeaveSiteDialog />
  </div>
</template>
