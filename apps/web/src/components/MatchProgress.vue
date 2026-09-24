<script setup lang="ts">
import { computed } from "vue";
import { CheckIcon } from "@heroicons/vue/20/solid";
import type { MatchStage } from "@sigma/shared";

const props = defineProps<{ stage: MatchStage | null; message: string }>();

const STEPS: { id: MatchStage; label: string }[] = [
  { id: "parsing", label: "העלאת הקובץ" },
  { id: "profiling", label: "ניתוח קורות החיים" },
  { id: "screening", label: "סריקת כל המשרות" },
  { id: "scoring", label: "דירוג והסבר ההתאמה" },
];

const currentIndex = computed(() => {
  if (props.stage === "done") return STEPS.length;
  return Math.max(0, STEPS.findIndex((s) => s.id === props.stage));
});
</script>

<template>
  <div class="card p-6 md:p-8" role="status" aria-live="polite">
    <div class="mb-6 flex items-center gap-3">
      <span class="relative flex size-3">
        <span class="absolute inline-flex size-full animate-ping rounded-full bg-highlight-500 opacity-75" />
        <span class="relative inline-flex size-3 rounded-full bg-highlight-500" />
      </span>
      <p class="text-lg font-medium text-primary-900">{{ message || "מעבד…" }}</p>
    </div>

    <ol class="grid gap-4 sm:grid-cols-4">
      <li v-for="(step, i) in STEPS" :key="step.id" class="flex items-center gap-3 sm:flex-col sm:items-start">
        <div class="flex w-full items-center gap-2">
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition"
            :class="
              i < currentIndex
                ? 'bg-primary-900 text-white'
                : i === currentIndex
                  ? 'bg-highlight-500 text-white ring-4 ring-highlight-100'
                  : 'bg-primary-100 text-primary-400'
            "
          >
            <CheckIcon v-if="i < currentIndex" class="size-5" aria-hidden="true" />
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span
            v-if="i < STEPS.length - 1"
            class="hidden h-0.5 flex-1 rounded sm:block"
            :class="i < currentIndex ? 'bg-primary-900' : 'bg-primary-200'"
          />
        </div>
        <span class="text-sm" :class="i <= currentIndex ? 'font-medium text-primary-900' : 'text-black/50'">
          {{ step.label }}
        </span>
      </li>
    </ol>

    <p class="mt-6 text-sm text-black/60">התהליך אורך בדרך כלל 20–60 שניות. אפשר להמשיך לגלוש בינתיים.</p>
  </div>
</template>
