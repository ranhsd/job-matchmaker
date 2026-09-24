<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/20/solid";
</script>

<template>
  <header class="sticky top-0 z-30 bg-white shadow-header">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[72px] md:px-8">
      <a href="/" class="flex min-w-0 items-center gap-2.5 md:gap-3" aria-label="השדכן החכם שלי – לדף הבית">
        <img src="/favicon.svg?v=3" alt="" class="size-9 shrink-0 md:size-10" />
        <div class="min-w-0 leading-tight">
          <div class="text-[15px] font-bold leading-tight text-primary-900 sm:text-lg md:text-xl">השדכן החכם שלי</div>
          <div class="hidden text-xs text-black/60 lg:block">התאמת משרות בשירות המדינה בעזרת AI</div>
        </div>
      </a>

      <nav aria-label="קישורים" class="flex items-center gap-1 text-[15px] font-medium text-primary-900">
        <a href="#how" class="hidden rounded-gov px-3 py-2 hover:bg-primary-100 md:inline-block">איך זה עובד</a>
        <a
          href="https://merkava.mrp.gov.il/giusp/index.html#/"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1 rounded-gov px-3 py-2 hover:bg-primary-100"
        >
          לאתר המשרות הרשמי
          <ArrowTopRightOnSquareIcon class="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </a>
      </nav>
    </div>
  </header>
</template>
