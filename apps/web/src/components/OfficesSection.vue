<script setup lang="ts">
import { computed } from "vue";
import { BuildingOffice2Icon } from "@heroicons/vue/24/outline";
import type { Position } from "@sigma/shared";

const props = defineProps<{ positions: Position[] }>();

const offices = computed(() => {
  const byOffice = new Map<string, { name: string; logo: string | null; count: number }>();
  for (const p of props.positions) {
    const entry = byOffice.get(p.officeName) ?? { name: p.officeName, logo: null, count: 0 };
    entry.count += 1;
    entry.logo ??= p.logo;
    byOffice.set(p.officeName, entry);
  }
  return [...byOffice.values()].sort((a, b) => b.count - a.count).slice(0, 12);
});
</script>

<template>
  <section v-if="offices.length" class="bg-white py-14" aria-labelledby="offices-title">
    <div class="mx-auto max-w-[1190px] px-4">
      <h2 id="offices-title" class="mb-10 text-center text-[32px] font-medium leading-tight text-[#0c3058] md:text-[45px]">
        משרות פנויות במשרדי הממשלה
      </h2>

      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <li
          v-for="office in offices"
          :key="office.name"
          class="flex flex-col items-center rounded-[4px] border border-black/10 bg-white p-4 text-center transition hover:shadow-card"
        >
          <div class="grid size-16 place-items-center">
            <img v-if="office.logo" :src="office.logo" alt="" class="max-h-16 max-w-16 object-contain" loading="lazy" />
            <BuildingOffice2Icon v-else class="size-10 text-primary-300" aria-hidden="true" />
          </div>
          <p class="mt-3 line-clamp-2 min-h-[2.5rem] text-[15px] font-medium leading-5 text-[#0c3058]">{{ office.name }}</p>
          <p class="mt-1 text-sm text-black/60">{{ office.count.toLocaleString("he-IL") }} משרות פנויות</p>
        </li>
      </ul>
    </div>
  </section>
</template>
