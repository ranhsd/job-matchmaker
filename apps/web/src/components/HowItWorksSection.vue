<script setup lang="ts">
const STEPS = [
  {
    title: "מתחילים מהניסיון וההשכלה שלך",
    text: "המערכת מזהה בקורות החיים תחומי ניסיון, השכלה וכישורים מקצועיים.",
  },
  {
    title: "מגלים הזדמנויות",
    text: "משרות פתוחות נבחנות ביחס לפרופיל שלך, כולל תפקידים בתחומים משיקים.",
  },
  {
    title: "מבינים את ההתאמה",
    text: "מקבלים משרות מומלצות, הסבר על הרלוונטיות שלהן ומידע שכדאי לבדוק לפני הגשת מועמדות.",
  },
];
</script>

<template>
  <section id="how" class="scroll-mt-24 bg-white py-16 md:py-20" aria-labelledby="how-title">
    <div class="mx-auto max-w-[1190px] px-4">
      <div class="text-center">
        <p class="eyebrow">שלושה צעדים. מגוון אפשרויות.</p>
        <h2 id="how-title" class="section-title mt-2">איך מוצאים את ההתאמה?</h2>
      </div>

      <ol class="mt-12 grid gap-10 md:grid-cols-3 md:gap-10">
        <li v-for="(step, i) in STEPS" :key="step.title">
          <span
            class="block text-[40px] font-black leading-none"
            :class="i === STEPS.length - 1 ? 'text-highlight-600' : 'text-accent-500'"
            aria-hidden="true"
          >
            {{ String(i + 1).padStart(2, "0") }}
          </span>
          <h3 class="mt-3 text-lg font-bold text-primary-900">
            <span class="sr-only">שלב {{ i + 1 }}: </span>{{ step.title }}
          </h3>
          <p class="mt-2 text-[15px] leading-relaxed text-black/65">{{ step.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
