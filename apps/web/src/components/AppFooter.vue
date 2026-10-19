<script setup lang="ts">
import { type InfoTopic, OFFICIAL_SITE } from "../lib/format";

const emit = defineEmits<{ info: [topic: InfoTopic] }>();
</script>

<template>
  <footer class="bg-primary-900 text-white">
    <div class="mx-auto flex max-w-[1190px] flex-col gap-3 px-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        <span class="font-bold">התאמה בקליק</span>
        <span class="text-white/75"> · מגלים הזדמנויות בשירות המדינה</span>
      </p>
      <nav aria-label="קישורי תחתית" class="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
        <button type="button" class="underline underline-offset-4 hover:text-highlight-300" @click="emit('info', 'privacy')">
          מדיניות פרטיות
        </button>
        <button type="button" class="underline underline-offset-4 hover:text-highlight-300" @click="emit('info', 'accessibility')">
          נגישות
        </button>
        <a :href="OFFICIAL_SITE" target="_blank" rel="noopener" class="underline underline-offset-4 hover:text-highlight-300">
          לאתר הגיוס הרשמי<span class="sr-only"> (נפתח בחלון חדש)</span>
        </a>
      </nav>
    </div>
  </footer>
</template>
