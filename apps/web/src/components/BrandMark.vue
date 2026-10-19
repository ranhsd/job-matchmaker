<script setup lang="ts">
withDefaults(defineProps<{ inverted?: boolean }>(), { inverted: false });
</script>

<template>
  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="5" y="3" width="17" height="22" rx="3" :fill="inverted ? '#fff' : '#183b80'" />
    <rect x="9" y="8" width="9" height="2" rx="1" :fill="inverted ? '#183b80' : '#fff'" />
    <rect x="9" y="12.5" width="9" height="2" rx="1" :fill="inverted ? '#183b80' : '#fff'" />
    <rect x="9" y="17" width="6" height="2" rx="1" :fill="inverted ? '#183b80' : '#fff'" />
    <circle cx="22.5" cy="23.5" r="7" fill="#dc3080" :stroke="inverted ? '#183b80' : '#fff'" stroke-width="2" />
    <path d="m19.5 23.5 2 2 3.8-3.8" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
