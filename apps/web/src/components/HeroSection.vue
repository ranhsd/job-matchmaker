<script setup lang="ts">
import { ArrowPathIcon, SparklesIcon } from "@heroicons/vue/20/solid";
import { CheckCircleIcon } from "@heroicons/vue/24/outline";
import type { MatchFilters } from "@sigma/shared";
import CvUploader from "./CvUploader.vue";
import MatchOptions from "./MatchOptions.vue";

const file = defineModel<File | null>("file", { required: true });
const filters = defineModel<MatchFilters>("filters", { required: true });
defineProps<{ areas: string[]; running: boolean }>();
const emit = defineEmits<{ submit: [] }>();

const PROMISES = [
  "סריקה של כל המשרות הפתוחות באתר",
  "דירוג מול דרישות הסף, כולל מה חסר",
  "הקובץ מעובד לצורך ההתאמה בלבד ואינו נשמר",
];
</script>

<template>
  <section class="relative isolate overflow-hidden bg-primary-900 text-white" aria-labelledby="hero-title">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(31_74_125/0.9),transparent_55%),linear-gradient(to_bottom,#0c2e4b,#0c3058_60%,#001a34)]"
    />
    <div aria-hidden="true" class="pointer-events-none absolute -end-40 -top-56 size-[640px] rounded-full bg-primary-700/35 blur-sm" />
    <div aria-hidden="true" class="pointer-events-none absolute -bottom-72 -start-24 size-[620px] rounded-full bg-primary-600/25" />
    <div aria-hidden="true" class="pointer-events-none absolute -bottom-40 start-[18%] size-[380px] rounded-full bg-primary-700/30" />

    <div class="relative mx-auto grid max-w-[1190px] items-center gap-12 px-4 pb-16 pt-12 md:pt-16 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-16 lg:pb-24 lg:pt-20">
      <div class="max-w-xl">
        <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/20">
          <SparklesIcon class="size-4 text-highlight-300" aria-hidden="true" />
          חדש · התאמה חכמה מבוססת AI
        </span>

        <h1 id="hero-title" class="mt-6 text-[38px] font-extrabold leading-[1.15] md:text-[52px] lg:text-[56px]">
          קורות החיים שלך.
          <span class="block text-highlight-300">המשרה הבאה שלך</span>
          <span class="block">בשירות המדינה.</span>
        </h1>

        <p class="mt-6 text-lg leading-relaxed text-white/80">
          העלו קובץ אחד, ותוך רגעים קבלו את המשרות הפתוחות שהכי מתאימות לניסיון ולהשכלה שלכם – עם הסבר ברור לכל התאמה.
        </p>

        <ul class="mt-8 space-y-3 text-[15px] text-white/90">
          <li v-for="item in PROMISES" :key="item" class="flex items-center gap-3">
            <span class="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
              <CheckCircleIcon class="size-4.5 text-white" aria-hidden="true" />
            </span>
            {{ item }}
          </li>
        </ul>
      </div>

      <div id="upload" class="card scroll-mt-24 p-6 text-black/85 shadow-float md:p-8" role="region" aria-labelledby="upload-title">
        <h2 id="upload-title" class="text-xl font-bold text-primary-900">בואו נתחיל</h2>
        <p class="mt-1 text-sm text-black/60">
          העלו קורות חיים בקובץ <bdi>PDF</bdi>, <bdi>DOCX</bdi>, <bdi>TXT</bdi> או תמונה · עד <bdi>4MB</bdi>
        </p>

        <div class="mt-5">
          <CvUploader v-model="file" :disabled="running" />
        </div>

        <div class="mt-5 border-t border-primary-100 pt-5">
          <MatchOptions v-model="filters" :areas="areas" :disabled="running" />
        </div>

        <button type="button" class="btn-primary mt-5 w-full text-base" :disabled="!file || running" @click="emit('submit')">
          <ArrowPathIcon v-if="running" class="size-5 animate-spin" aria-hidden="true" />
          <SparklesIcon v-else class="size-5" aria-hidden="true" />
          {{ running ? "מחפש משרות מתאימות…" : "מצאו לי משרות מתאימות" }}
        </button>
        <p class="mt-3 text-center text-xs text-black/50" aria-live="polite">
          {{ !file ? "יש להעלות קובץ כדי להמשיך" : running ? "התהליך אורך בדרך כלל 20–60 שניות" : "הקובץ מוכן – אפשר להתחיל" }}
        </p>
      </div>
    </div>
  </section>
</template>
