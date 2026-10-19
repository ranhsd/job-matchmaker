<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/20/solid";
import { OFFICIAL_SITE } from "../lib/format";
import BrandMark from "./BrandMark.vue";

const emit = defineEmits<{ home: [] }>();
</script>

<template>
  <header class="sticky top-0 z-30 bg-white shadow-header">
    <div class="mx-auto flex h-16 max-w-[1190px] items-center justify-between gap-3 px-4 md:h-[72px] md:gap-4">
      <a href="/" class="flex min-w-0 items-center gap-2.5 md:gap-4" aria-label="התאמה בקליק – לדף הבית" @click.prevent="emit('home')">
        <img src="/logo-nashm.png" alt="נציבות שירות המדינה – אגף בכיר גיוס ומיון" class="h-8 w-auto shrink-0 sm:h-10 md:h-11" />
        <span class="h-8 w-px shrink-0 bg-black/15" aria-hidden="true" />
        <span class="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <BrandMark class="size-6 shrink-0 sm:size-7" />
          <span class="truncate text-sm font-extrabold text-primary-900 sm:text-[15px] md:text-base">התאמה בקליק</span>
        </span>
      </a>

      <a
        :href="OFFICIAL_SITE"
        target="_blank"
        rel="noopener"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary-200 px-3 py-1.5 text-sm font-medium sm:px-4 text-primary-900 transition hover:border-primary-400 hover:bg-primary-50"
      >
        אתר הגיוס
        <ArrowTopRightOnSquareIcon class="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
        <span class="sr-only">(נפתח בחלון חדש)</span>
      </a>
    </div>
  </header>
</template>
