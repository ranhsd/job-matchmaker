<script setup lang="ts">
import { computed } from "vue";
import { Switch, SwitchGroup, SwitchLabel } from "@headlessui/vue";
import { ArrowLeftIcon, BriefcaseIcon, CalendarDaysIcon, MapPinIcon } from "@heroicons/vue/24/outline";
import type { MatchFilters, Position } from "@sigma/shared";

const OFFICIAL_SITE = "https://merkava.mrp.gov.il/giusp/index.html#/";

const filters = defineModel<MatchFilters>({ required: true });
const props = defineProps<{ hotPositions: Position[]; loaded: boolean }>();

const publicOnly = computed({
  get: () => filters.value.publicOnly ?? false,
  set: (value) => (filters.value = { ...filters.value, publicOnly: value }),
});

const visible = computed(() =>
  props.hotPositions.filter((p) => !publicOnly.value || p.isPublic).slice(0, 6),
);

function daysLabel(days: number | null): string {
  if (days === null) return "";
  if (days <= 0) return "ההגשה מסתיימת היום";
  if (days === 1) return "נותר יום אחד להגשה";
  return `נותרו ${days} ימים להגשה`;
}
</script>

<template>
  <section class="bg-[#426a9a] py-9 text-white" aria-labelledby="hot-title">
    <div class="mx-auto max-w-[1190px] px-4">
      <div class="relative flex flex-col items-center gap-4 md:block md:py-3">
        <h2 id="hot-title" class="text-center text-[32px] font-medium leading-none md:text-[45px]">משרות חמות</h2>

        <SwitchGroup as="div" class="flex items-center gap-3 md:absolute md:end-0 md:top-1/2 md:-translate-y-1/2">
          <Switch
            v-model="publicOnly"
            class="relative inline-flex h-[14px] w-[34px] shrink-0 items-center rounded-full transition"
            :class="publicOnly ? 'bg-white/90' : 'bg-white/35'"
          >
            <span
              class="absolute size-5 rounded-full shadow transition-[inset-inline-start]"
              :class="publicOnly ? 'start-[14px] bg-[#0c3058]' : 'start-0 bg-white'"
            />
          </Switch>
          <SwitchLabel class="cursor-pointer text-[18px]">למשרות פומביות לציבור הרחב</SwitchLabel>
        </SwitchGroup>
      </div>

      <ul v-if="visible.length" class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="job in visible" :key="job.requestId">
          <a
            :href="job.url"
            target="_blank"
            rel="noopener"
            class="flex h-full flex-col rounded-[4px] bg-white p-6 text-[#0c3058] shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="chip">{{ job.publicationType }}</span>
              <img v-if="job.logo" :src="job.logo" alt="" class="size-12 shrink-0 object-contain" loading="lazy" />
            </div>
            <h3 class="mt-4 text-xl font-bold leading-snug">{{ job.jobName }}</h3>
            <p class="mt-1 text-[15px] text-black/70">{{ job.officeName }}</p>

            <dl class="mt-5 space-y-1.5 text-sm text-black/60">
              <div class="flex items-center gap-2">
                <MapPinIcon class="size-4 shrink-0" aria-hidden="true" />
                <dd>{{ job.locationName || job.area }}</dd>
              </div>
              <div v-if="job.daysLeft !== null" class="flex items-center gap-2">
                <CalendarDaysIcon class="size-4 shrink-0" aria-hidden="true" />
                <dd>{{ daysLabel(job.daysLeft) }}</dd>
              </div>
            </dl>

            <span class="mt-auto inline-flex items-center gap-1 pt-5 text-[15px] font-medium text-accent-600">
              לפרטים ולהגשה
              <ArrowLeftIcon class="size-4" aria-hidden="true" />
            </span>
          </a>
        </li>
      </ul>

      <div v-else-if="loaded" class="mt-10 flex flex-col items-center gap-4 text-center">
        <BriefcaseIcon class="size-20 text-white/70" aria-hidden="true" />
        <p class="text-lg">אין כרגע משרות חמות, היכנסו לצפייה בכל המשרות הנוספות</p>
      </div>

      <div v-else class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="h-56 animate-pulse rounded-[4px] bg-white/20" />
      </div>

      <div class="mt-10 text-center">
        <a
          :href="OFFICIAL_SITE"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center justify-center rounded-[4px] border border-white px-8 py-2.5 text-[15px] font-medium transition hover:bg-white hover:text-[#0c3058]"
        >
          לעוד משרות
        </a>
      </div>
    </div>
  </section>
</template>
