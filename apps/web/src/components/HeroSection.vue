<script setup lang="ts">
import { computed } from "vue";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import type { MatchFilters } from "@sigma/shared";

const filters = defineModel<MatchFilters>({ required: true });
const props = defineProps<{
  openPositions: number | null;
  offices: number | null;
  hotCount: number | null;
  areas: string[];
}>();

const sortedAreas = computed(() => [...props.areas].sort((a, b) => a.localeCompare(b, "he")));

const query = computed({
  get: () => filters.value.notes ?? "",
  set: (notes) => (filters.value = { ...filters.value, notes }),
});

const area = computed({
  get: () => filters.value.areas?.[0] ?? "",
  set: (value) => (filters.value = { ...filters.value, areas: value ? [value] : [] }),
});

const stats = computed(() => [
  { label: "משרות פנויות", value: props.openPositions },
  { label: "משרדים ויחידות מגייסים", value: props.offices },
  { label: "משרות חמות", value: props.hotCount },
]);

function search(event: Event) {
  event.preventDefault();
  document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <section class="relative isolate overflow-hidden bg-[#dfe6ee]">
    <img src="/hero-office.jpg" alt="" class="absolute inset-0 size-full object-cover object-[50%_35%]" />
    <!-- Replicates the recruitment site's bg-into.png: clear at the top, near-white at the bottom. -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(249,249,249,0.16)_12%,rgba(245,249,249,0.31)_25%,rgba(244,246,249,0.46)_37%,rgba(242,244,247,0.62)_50%,rgba(239,242,246,0.69)_57%,rgba(239,242,246,0.75)_63%,rgba(244,245,249,0.8)_75%,rgba(246,248,249,0.86)_88%,rgba(250,251,252,0.91)_100%)]"
    />

    <div class="relative mx-auto flex min-h-[540px] max-w-[1190px] flex-col px-4 pb-12 pt-14 md:min-h-[720px] md:pt-[150px] lg:h-[800px] lg:pb-0 lg:pt-[202px]">
      <h1 class="text-[36px] font-bold leading-[44px] text-[#0c3058] md:text-[52px] md:leading-[62px] lg:text-[60px] lg:leading-[72px]">
        המשרה הבאה שלך
        <span class="block">בשירות המדינה</span>
      </h1>

      <form
        class="mt-10 flex w-full flex-wrap items-center rounded-[4px] bg-white shadow-[0_2px_12px_rgba(12,48,88,0.10)] sm:h-[69px] sm:flex-nowrap lg:mt-24"
        @submit="search"
      >
        <label class="relative flex basis-full items-center border-b border-black/10 px-3 sm:basis-[344px] sm:border-b-0">
          <span class="sr-only">תחום או אזור</span>
          <select
            v-model="area"
            class="h-[52px] w-full appearance-none bg-transparent pe-8 text-base text-black/85 outline-none sm:h-[37px]"
          >
            <option value="">מעניין אותי...</option>
            <option v-for="item in sortedAreas" :key="item" :value="item">{{ item }}</option>
          </select>
          <ChevronDownIcon class="pointer-events-none absolute end-3 size-6 text-black/60" aria-hidden="true" />
        </label>

        <span class="hidden h-[37px] w-px shrink-0 bg-black/20 sm:block" aria-hidden="true" />

        <label class="flex min-w-0 flex-1 items-center px-3">
          <span class="sr-only">חיפוש משרה במלל חופשי</span>
          <input
            v-model="query"
            type="search"
            placeholder="המשרה הבאה שלי"
            class="h-[52px] w-full bg-transparent text-lg text-[#0c3058] outline-none placeholder:text-[#0c3058]/70 sm:h-[37px] sm:text-2xl"
          />
        </label>

        <button
          type="submit"
          class="me-3 grid size-9 shrink-0 place-items-center rounded-full text-black/55 transition hover:bg-black/5 hover:text-[#0c3058]"
          aria-label="חפש"
        >
          <MagnifyingGlassIcon class="size-6" aria-hidden="true" />
        </button>
      </form>

      <dl class="mt-12 grid grid-cols-3 justify-items-center gap-x-4 text-center text-[#0c3058] lg:mt-14 lg:flex lg:justify-center lg:gap-x-[282px]">
        <div v-for="stat in stats" :key="stat.label" class="w-full max-w-[170px]">
          <dd class="text-[28px] font-medium leading-10 tabular-nums md:text-[40px] md:leading-[60px]">
            <span v-if="stat.value !== null">{{ stat.value.toLocaleString("he-IL") }}</span>
            <span v-else class="inline-block h-8 w-16 animate-pulse rounded bg-[#0c3058]/10 align-middle md:h-10" />
          </dd>
          <dt class="text-sm font-medium leading-5 md:text-[20px] md:leading-[30px]">{{ stat.label }}</dt>
        </div>
      </dl>
    </div>
  </section>
</template>
