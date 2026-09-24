<script setup lang="ts">
import { computed } from "vue";
import { scoreColor } from "../lib/format";

const props = withDefaults(defineProps<{ score: number; size?: number }>(), { size: 52 });

const radius = 22;
const circumference = 2 * Math.PI * radius;
const dash = computed(() => (props.score / 100) * circumference);
const color = computed(() => scoreColor(props.score));
</script>

<template>
  <div
    class="relative inline-flex shrink-0 items-center justify-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="`ציון התאמה ${score} מתוך 100`"
  >
    <svg viewBox="0 0 52 52" class="size-full -rotate-90">
      <circle cx="26" cy="26" :r="radius" fill="none" stroke="#eef2fb" stroke-width="5" />
      <circle
        cx="26"
        cy="26"
        :r="radius"
        fill="none"
        :stroke="color.ring"
        stroke-width="5"
        stroke-linecap="round"
        :stroke-dasharray="`${dash} ${circumference}`"
      />
    </svg>
    <span class="absolute text-sm font-bold tabular-nums" :class="color.text">{{ score }}</span>
  </div>
</template>
