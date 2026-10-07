<script setup lang="ts">
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/vue/20/solid";
import ScoreRing from "./ScoreRing.vue";

const emit = defineEmits<{ cta: [] }>();

const EXAMPLE = {
  title: "מרכז/ת בכיר/ה (תכנון ובקרה)",
  meta: "משרד האוצר · ירושלים · משרה מלאה",
  score: 82,
  checks: [
    { ok: true, text: "עומד/ת בדרישת ההשכלה" },
    { ok: true, text: "ניסיון רלוונטי: 4 שנים" },
    { ok: false, text: "חסר: ניסיון ניהולי של שנתיים" },
  ],
};
</script>

<template>
  <section class="bg-surface py-16 md:py-20" aria-labelledby="transparency-title">
    <div class="mx-auto grid max-w-[1190px] items-center gap-12 px-4 lg:grid-cols-2 lg:gap-20">
      <div class="max-w-lg">
        <p class="eyebrow">שקיפות מלאה</p>
        <h2 id="transparency-title" class="section-title mt-2">
          לא רק "מתאים" –
          <span class="block">אלא גם למה.</span>
        </h2>
        <p class="mt-5 text-[17px] leading-relaxed text-black/70">
          לכל משרה תקבלו ציון התאמה, פירוט של דרישות הסף שאתם עומדים בהן, ומה כדאי להשלים לפני הגשת מועמדות.
        </p>
        <button type="button" class="btn-accent mt-8" @click="emit('cta')">נסו עכשיו</button>
      </div>

      <figure class="lg:justify-self-end">
        <figcaption class="mb-2 text-xs font-medium text-black/50">דוגמה להמחשה</figcaption>
        <div class="card w-full max-w-[460px] p-6 md:p-7" aria-hidden="true">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-lg font-bold text-primary-900">{{ EXAMPLE.title }}</p>
              <p class="mt-1 text-sm text-black/60">{{ EXAMPLE.meta }}</p>
            </div>
            <ScoreRing :score="EXAMPLE.score" :size="56" />
          </div>

          <ul class="mt-6 space-y-2.5 text-[15px] text-black/80">
            <li v-for="check in EXAMPLE.checks" :key="check.text" class="flex items-center gap-2.5">
              <CheckCircleIcon v-if="check.ok" class="size-5 shrink-0 text-emerald-600" />
              <ExclamationCircleIcon v-else class="size-5 shrink-0 text-amber-500" />
              {{ check.text }}
            </li>
          </ul>

          <p class="mt-6 text-sm font-bold text-accent-600 underline underline-offset-4">לפרטי המכרז והגשת מועמדות</p>
        </div>
      </figure>
    </div>
  </section>
</template>
