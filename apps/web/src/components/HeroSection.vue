<script setup lang="ts">
import { computed } from "vue";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/vue/20/solid";
import type { MatchFilters, Position } from "@sigma/shared";

const filters = defineModel<MatchFilters>({ required: true });
const props = defineProps<{
  openPositions: number | null;
  offices: number | null;
  areas: string[];
  hotPositions: Position[];
  positionsLoaded: boolean;
}>();

const sortedAreas = computed(() => [...props.areas].sort((a, b) => a.localeCompare(b, "he")));
const hotCount = computed(() => props.hotPositions.length);

const query = computed({
  get: () => filters.value.notes ?? "",
  set: (notes) => (filters.value = { ...filters.value, notes }),
});

const area = computed({
  get: () => filters.value.areas?.[0] ?? "",
  set: (value) => (filters.value = { ...filters.value, areas: value ? [value] : [] }),
});

function search(event: Event) {
  event.preventDefault();
  document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <section class="relative isolate min-h-[34rem] overflow-hidden text-primary-900 md:min-h-[40rem]">
    <img
      src="/hero-office.jpg"
      alt=""
      class="absolute inset-0 size-full object-cover object-center"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_72%_at_50%_46%,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.38)_36%,rgba(255,255,255,0)_68%)]"
    />

    <div class="relative mx-auto flex min-h-[34rem] max-w-6xl flex-col px-4 pb-8 pt-8 md:min-h-[40rem] md:px-8 md:pt-14">
      <h1 class="max-w-xl text-4xl font-extrabold leading-[1.15] text-[#16325c] md:text-6xl">
        המשרה הבאה שלך
        <span class="mt-1 block">בשירות המדינה</span>
      </h1>

      <form
        class="mx-auto mt-8 flex w-full max-w-3xl flex-col gap-1 rounded-3xl bg-white px-3 py-2 shadow-[0_10px_40px_rgba(22,50,92,0.18)] sm:mt-10 sm:flex-row sm:items-center sm:rounded-full sm:px-2 sm:py-1.5"
        @submit="search"
      >
        <label class="flex min-w-0 flex-1 items-center gap-2 px-2">
          <button type="submit" class="grid size-9 shrink-0 place-items-center text-[#16325c]" aria-label="המשך להתאמת קורות חיים">
            <MagnifyingGlassIcon class="size-5" aria-hidden="true" />
          </button>
          <input
            v-model="query"
            type="search"
            placeholder="המשרה הבאה שלי"
            class="w-full bg-transparent py-2 text-[15px] text-[#16325c] outline-none placeholder:text-black/45"
          />
        </label>
        <span class="hidden h-8 w-px bg-black/10 sm:block" aria-hidden="true" />
        <label class="relative flex min-w-0 items-center sm:w-56">
          <span class="sr-only">תחום עניין</span>
          <select
            v-model="area"
            class="w-full appearance-none bg-transparent py-2 pe-8 ps-3 text-[15px] text-[#16325c] outline-none"
          >
            <option value="">מעניין אותי...</option>
            <option v-for="item in sortedAreas" :key="item" :value="item">{{ item }}</option>
          </select>
          <ChevronDownIcon class="pointer-events-none absolute end-2 size-5 text-[#16325c]" aria-hidden="true" />
        </label>
      </form>

      <dl class="mt-auto grid grid-cols-3 gap-2 pt-10 text-center text-[#16325c]">
        <div>
          <dd class="text-3xl font-extrabold tabular-nums md:text-5xl">
            <span v-if="openPositions !== null">{{ openPositions.toLocaleString("he-IL") }}</span>
            <span v-else class="inline-block h-9 w-16 animate-pulse rounded bg-white/60" />
          </dd>
          <dt class="mx-auto mt-1 max-w-[9rem] text-xs leading-snug text-[#16325c]/80 md:text-sm">משרות פנויות</dt>
        </div>
        <div>
          <dd class="text-3xl font-extrabold tabular-nums md:text-5xl">
            <span v-if="offices !== null">{{ offices.toLocaleString("he-IL") }}</span>
            <span v-else class="inline-block h-9 w-12 animate-pulse rounded bg-white/60" />
          </dd>
          <dt class="mx-auto mt-1 max-w-[9rem] text-xs leading-snug text-[#16325c]/80 md:text-sm">משרדים ויחידות</dt>
        </div>
        <div>
          <dd class="text-3xl font-extrabold tabular-nums md:text-5xl">
            <span v-if="positionsLoaded">{{ hotCount.toLocaleString("he-IL") }}</span>
            <span v-else class="inline-block h-9 w-12 animate-pulse rounded bg-white/60" />
          </dd>
          <dt class="mx-auto mt-1 max-w-[9rem] text-xs leading-snug text-[#16325c]/80 md:text-sm">משרות חמות</dt>
        </div>
      </dl>
    </div>
  </section>

  <div class="bg-[#3d7ec4] text-white">
    <div class="relative mx-auto flex min-h-16 max-w-6xl items-center px-4 py-3 md:px-8">
      <a
        href="https://merkava.mrp.gov.il/giusp/index.html#/"
        target="_blank"
        rel="noopener"
        class="absolute start-4 hidden items-center gap-2 text-sm hover:underline md:start-8 md:inline-flex"
      >
        <span class="size-2 rounded-full bg-white" aria-hidden="true" />
        למשרות פומביות לציבור הרחב
      </a>
      <h2 class="w-full text-center text-2xl font-bold md:text-3xl">משרות חמות</h2>
    </div>
  </div>

  <div class="bg-[#f7f9fc]">
    <div class="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <ul v-if="hotPositions.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="job in hotPositions" :key="job.requestId">
          <a
            :href="job.url"
            target="_blank"
            rel="noopener"
            class="flex h-full flex-col rounded-lg bg-white p-5 shadow-[0_2px_10px_rgba(12,46,75,0.08)] transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p class="text-xs font-medium text-[#3d7ec4]">{{ job.publicationType }}</p>
            <h3 class="mt-1 text-lg font-bold text-[#16325c]">{{ job.jobName }}</h3>
            <p class="mt-2 text-sm text-black/70">{{ job.officeName }}</p>
            <p class="mt-auto pt-3 text-sm text-black/55">{{ job.locationName || job.area }}</p>
          </a>
        </li>
      </ul>
      <p v-else-if="positionsLoaded" class="py-8 text-center text-[#16325c]">
        אין כרגע משרות חמות. אפשר להעלות קורות חיים ולמצוא התאמה מבין כל המשרות הפתוחות.
      </p>
    </div>
  </div>
</template>
