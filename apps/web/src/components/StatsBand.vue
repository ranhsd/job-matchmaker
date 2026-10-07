<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ openPositions: number | null; offices: number | null }>();

const stats = computed<{ label: string; value: string | null }[]>(() => [
  { label: "משרות פתוחות כרגע", value: props.openPositions?.toLocaleString("he-IL") ?? null },
  { label: "משרדי ממשלה ויחידות סמך", value: props.offices?.toLocaleString("he-IL") ?? null },
  { label: "זמן ממוצע לקבלת תוצאות", value: "פחות מדקה" },
]);
</script>

<template>
  <section class="border-b border-primary-200/60 bg-surface" aria-label="נתונים על המשרות הפתוחות">
    <dl class="mx-auto grid max-w-[1190px] grid-cols-3 gap-4 px-4 py-8 text-center md:py-10">
      <div v-for="stat in stats" :key="stat.label">
        <dd class="text-2xl font-extrabold tabular-nums text-accent-600 md:text-[34px] md:leading-tight">
          <span v-if="stat.value !== null">{{ stat.value }}</span>
          <span v-else class="inline-block h-8 w-16 animate-pulse rounded bg-accent-600/15 align-middle" />
        </dd>
        <dt class="mt-1 text-xs text-black/60 md:text-sm">{{ stat.label }}</dt>
      </div>
    </dl>
  </section>
</template>
