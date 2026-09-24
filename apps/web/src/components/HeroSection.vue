<script setup lang="ts">
defineProps<{ openPositions: number | null; offices: number | null }>();
</script>

<template>
  <section class="relative overflow-hidden bg-primary-900 text-white">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div class="absolute -top-24 -start-24 size-96 rounded-full bg-primary-600/40 blur-3xl" />
      <div class="absolute -bottom-32 end-0 size-[28rem] rounded-full bg-accent-500/25 blur-3xl" />
      <svg class="absolute bottom-0 start-0 w-full text-primary-50" viewBox="0 0 1440 60" preserveAspectRatio="none">
        <path fill="currentColor" d="M0 60h1440V20c-240 30-480 40-720 20S240 0 0 30z" />
      </svg>
    </div>

    <div class="relative mx-auto max-w-7xl px-4 pb-20 pt-12 md:px-8 md:pb-28 md:pt-16">
      <p class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-sky-soft">
        <span class="size-2 rounded-full bg-highlight-500" />
        מבוסס על המשרות הפתוחות באתר נציבות שירות המדינה
      </p>
      <h1 class="max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
        המשרה הבאה שלך בשירות המדינה,
        <span class="text-sky-soft">מותאמת לקורות החיים שלך</span>
      </h1>
      <p class="mt-4 max-w-2xl text-base text-white/80 md:text-lg">
        מעלים קורות חיים, ובינה מלאכותית סורקת את כל המכרזים הפתוחים ומדרגת את המשרות לפי מידת ההתאמה – כולל הסבר
        מדוע כל משרה מתאימה ומה עלול לחסור.
      </p>

      <dl class="mt-8 flex flex-wrap gap-8">
        <div>
          <dt class="text-sm text-white/70">משרות פנויות כרגע</dt>
          <dd class="text-3xl font-bold tabular-nums">
            <span v-if="openPositions !== null">{{ openPositions.toLocaleString("he-IL") }}</span>
            <span v-else class="inline-block h-8 w-16 animate-pulse rounded bg-white/20" />
          </dd>
        </div>
        <div>
          <dt class="text-sm text-white/70">משרדים ויחידות</dt>
          <dd class="text-3xl font-bold tabular-nums">
            <span v-if="offices !== null">{{ offices.toLocaleString("he-IL") }}</span>
            <span v-else class="inline-block h-8 w-12 animate-pulse rounded bg-white/20" />
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>
