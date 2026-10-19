<script setup lang="ts">
import { CheckIcon } from "@heroicons/vue/20/solid";
import type { CheckStatus } from "@sigma/shared";
import { CHECKS } from "../lib/format";

defineProps<{ status: CheckStatus; title?: string }>();
</script>

<template>
  <div class="flex gap-3 rounded-xl p-3.5" :class="CHECKS[status].box">
    <span class="grid size-6 shrink-0 place-items-center rounded-full text-xs font-black" :class="CHECKS[status].icon" aria-hidden="true">
      <CheckIcon v-if="status === 'supported'" class="size-4" />
      <template v-else>{{ status === "unclear" ? "i" : "!" }}</template>
    </span>
    <div class="min-w-0 flex-1 text-sm leading-relaxed text-black/75">
      <p v-if="title !== ''" class="mb-1 font-bold" :class="CHECKS[status].title">{{ title ?? CHECKS[status].label }}</p>
      <slot />
    </div>
  </div>
</template>
