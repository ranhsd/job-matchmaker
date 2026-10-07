<script setup lang="ts">
const emit = defineEmits<{ cta: [] }>();
</script>

<template>
  <section class="bg-white py-14 md:py-20" aria-labelledby="cta-title">
    <div class="mx-auto max-w-[1190px] px-4">
      <div class="relative isolate overflow-hidden rounded-2xl bg-accent-600 px-7 py-10 text-white md:px-12 md:py-14">
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-32 -end-24 size-80 rounded-full border-[28px] border-white/10" />
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-20 end-10 size-56 rounded-full bg-white/10" />

        <div class="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="cta-title" class="text-2xl font-extrabold md:text-[32px] md:leading-tight">המשרה שלך כבר מחכה.</h2>
            <p class="mt-2 text-[15px] text-white/85 md:text-base">העלו קורות חיים וגלו אילו משרות בשירות המדינה מתאימות לכם בדיוק.</p>
          </div>
          <button type="button" class="btn-pill shrink-0 self-start md:self-auto" @click="emit('cta')">העלאת קורות חיים</button>
        </div>
      </div>
    </div>
  </section>
</template>
