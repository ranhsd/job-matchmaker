<script setup lang="ts">
import { CheckIcon, SparklesIcon } from "@heroicons/vue/20/solid";
import type { MatchFilters, MatchStage } from "@sigma/shared";
import SearchForm from "./SearchForm.vue";

const file = defineModel<File | null>("file", { required: true });
const filters = defineModel<MatchFilters>("filters", { required: true });
defineProps<{
  areas: string[];
  fields: string[];
  levels: string[];
  running: boolean;
  stage: MatchStage | null;
  stageMessage: string;
}>();
const emit = defineEmits<{ submit: [] }>();

const PROMISES = [
  "התאמה אישית לניסיון, השכלה ולכישורים שלך",
  "הזדמנויות ממגוון תחומים בשירות המדינה",
  "הסבר על כל התאמה ומה כדאי לבדוק",
];
</script>

<template>
  <section class="relative isolate overflow-hidden bg-primary-900 text-white" aria-labelledby="hero-title">
    <div aria-hidden="true" class="pointer-events-none absolute -bottom-56 start-[8%] size-[460px] rounded-full bg-accent-500/25" />
    <div aria-hidden="true" class="pointer-events-none absolute -end-48 -top-64 size-[620px] rounded-full bg-white/[0.035]" />

    <div class="relative mx-auto grid max-w-[1190px] items-start gap-10 px-4 pb-16 pt-10 md:pt-14 lg:grid-cols-[1fr_minmax(0,480px)] lg:gap-14 lg:pb-20">
      <div class="max-w-xl lg:pt-6">
        <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/20">
          <SparklesIcon class="size-4 text-highlight-300" aria-hidden="true" />
          התאמה בקליק · מגלים הזדמנויות בשירות המדינה
        </span>

        <h1 id="hero-title" class="mt-6 text-[36px] font-black leading-[1.15] md:text-[50px]">
          אולי המשרה הבאה שלך
          <span class="block text-highlight-300">היא דווקא זו שלא חיפשת.</span>
        </h1>

        <p class="mt-6 text-lg leading-relaxed text-white/85">
          מעלים קורות חיים ומגלים הזדמנויות בשירות המדינה שמתאימות לניסיון, השכלה ולכישורים שלך – גם בתחומים שעוד לא חשבת עליהם.
        </p>

        <ul class="mt-8 space-y-3 text-[15px] text-white/90">
          <li v-for="item in PROMISES" :key="item" class="flex items-center gap-3">
            <span class="grid size-6 shrink-0 place-items-center rounded-full bg-white/12 ring-1 ring-white/20">
              <CheckIcon class="size-3.5 text-highlight-300" aria-hidden="true" />
            </span>
            {{ item }}
          </li>
        </ul>
      </div>

      <SearchForm
        v-model:file="file"
        v-model:filters="filters"
        :areas="areas"
        :fields="fields"
        :levels="levels"
        :running="running"
        :stage="stage"
        :stage-message="stageMessage"
        @submit="emit('submit')"
      />
    </div>
  </section>
</template>
