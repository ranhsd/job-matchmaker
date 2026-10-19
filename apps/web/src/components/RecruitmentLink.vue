<script setup lang="ts">
import { useLeaveSite } from "../composables/useLeaveSite";

const props = defineProps<{ href: string }>();
const { confirm } = useLeaveSite();

function onClick(event: MouseEvent) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  confirm(props.href);
}
</script>

<template>
  <a :href="href" target="_blank" rel="noopener" @click="onClick"><slot /></a>
</template>
