<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/20/solid";

const OFFICIAL_SITE = "https://merkava.mrp.gov.il/giusp/index.html#/";
</script>

<template>
  <header class="sticky top-0 z-30 bg-white shadow-header">
    <div class="mx-auto flex h-16 max-w-[1190px] items-center justify-between gap-4 px-4 md:h-[76px]">
      <a href="/" class="flex min-w-0 items-center gap-3 md:gap-4" aria-label="התאמה בקליק – לדף הבית">
        <img src="/logo-nashm.png" alt="נציבות שירות המדינה – אגף בכיר גיוס ומיון" class="h-10 w-auto shrink-0 md:h-12" />
        <span class="hidden h-9 w-px shrink-0 bg-black/15 sm:block" aria-hidden="true" />
        <span class="min-w-0 leading-tight">
          <span class="block truncate text-[15px] font-bold text-primary-900 sm:text-base md:text-[17px]">התאמה בקליק</span>
          <span class="hidden text-xs text-black/60 sm:block">התאמת משרות בשירות המדינה בעזרת AI</span>
        </span>
      </a>

      <nav aria-label="ניווט ראשי" class="flex items-center gap-1 text-[15px] font-medium text-primary-900 md:gap-2">
        <a
          :href="OFFICIAL_SITE"
          target="_blank"
          rel="noopener"
          class="hidden rounded-lg px-3 py-2 text-black/70 transition hover:bg-primary-50 hover:text-primary-900 md:inline-block"
        >
          חיפוש משרות
        </a>
        <a href="#upload" class="hidden rounded-lg px-3 py-2 font-bold transition hover:bg-primary-50 md:inline-block" aria-current="page">
          התאמה לפי קורות חיים
        </a>
        <a href="#how" class="hidden rounded-lg px-3 py-2 text-black/70 transition hover:bg-primary-50 hover:text-primary-900 md:inline-block">
          איך זה עובד
        </a>
        <a
          :href="OFFICIAL_SITE"
          target="_blank"
          rel="noopener"
          title="האזור האישי באתר הגיוס הרשמי של נציבות שירות המדינה"
          class="ms-1 inline-flex items-center gap-1.5 rounded-full bg-primary-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-700"
        >
          אזור אישי
          <ArrowTopRightOnSquareIcon class="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
        </a>
      </nav>
    </div>
  </header>
</template>
