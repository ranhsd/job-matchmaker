<script setup lang="ts">
const emit = defineEmits<{ cta: [] }>();
</script>

<template>
  <section class="bg-white py-14 md:py-20" aria-labelledby="cta-title">
    <div class="mx-auto max-w-[1190px] px-4">
      <div class="relative isolate overflow-hidden rounded-3xl bg-accent-500 px-7 py-10 text-white md:px-12 md:py-12">
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-36 -end-20 size-80 rounded-full border-[32px] border-white/10" />
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-24 end-6 size-48 rounded-full bg-white/10" />

        <div class="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div class="max-w-xl">
            <h2 id="cta-title" class="text-[26px] font-black leading-tight md:text-[32px]">
              אולי המשרה הבאה שלך היא דווקא זו שעוד לא הכרת.
            </h2>
            <p class="mt-3 text-[15px] leading-relaxed text-white/90 md:text-base">
              הניסיון וההשכלה שלך יכולים להיות רלוונטיים ליותר תפקידים ממה שנדמה לך.
              <span class="block">זה הזמן לגלות מה מחכה לך בשירות המדינה.</span>
            </p>
          </div>
          <button type="button" class="btn-pill shrink-0 self-start md:self-auto" @click="emit('cta')">בואו לגלות הזדמנויות</button>
        </div>
      </div>
    </div>
  </section>
</template>
