<script setup lang="ts">
import { computed } from "vue";
import { CheckIcon } from "@heroicons/vue/20/solid";
import type { MatchStage } from "@sigma/shared";

const props = defineProps<{ stage: MatchStage | null; message: string }>();

const STEPS: { id: MatchStage; label: string }[] = [
  { id: "parsing", label: "העלאת הקובץ" },
  { id: "profiling", label: "זיהוי הניסיון, ההשכלה והכישורים" },
  { id: "screening", label: "סריקת המשרות הפתוחות" },
  { id: "scoring", label: "בחינת ההתאמה לכל משרה" },
];

const currentIndex = computed(() => {
  if (props.stage === "done") return STEPS.length;
  return Math.max(0, STEPS.findIndex((s) => s.id === props.stage));
});
</script>

<template>
  <div class="rounded-xl bg-primary-50 p-4" role="status" aria-live="polite">
    <p class="text-sm font-bold text-primary-900">{{ message || "מתחילים…" }}</p>
    <ol class="mt-3 space-y-2">
      <li v-for="(step, i) in STEPS" :key="step.id" class="flex items-center gap-2.5 text-sm">
        <span
          class="grid size-5 shrink-0 place-items-center rounded-full"
          :class="i < currentIndex ? 'bg-accent-500 text-white' : i === currentIndex ? 'bg-white ring-2 ring-accent-500' : 'bg-primary-200'"
        >
          <CheckIcon v-if="i < currentIndex" class="size-3.5" aria-hidden="true" />
          <span v-else-if="i === currentIndex" class="size-2 animate-pulse rounded-full bg-accent-500" aria-hidden="true" />
        </span>
        <span :class="i <= currentIndex ? 'font-medium text-primary-900' : 'text-black/50'">{{ step.label }}</span>
      </li>
    </ol>
    <p class="mt-3 text-xs text-black/55">התהליך אורך בדרך כלל 20–60 שניות.</p>
  </div>
</template>
