<script setup lang="ts">
const STEPS = [
  {
    title: "ניתוח קורות החיים",
    text: "ה-AI מזהה השכלה, ניסיון, כישורים ורישיונות מקצועיים – גם בקבצי PDF בעברית.",
  },
  {
    title: "סריקת כל המכרזים",
    text: "כל המשרות הפתוחות באתר נציבות שירות המדינה נסרקות ומסוננות לפי התחום שלך.",
  },
  {
    title: "דירוג והסבר",
    text: "המשרות הרלוונטיות מדורגות לעומק מול דרישות הסף, עם הסבר מדוע הן מתאימות ומה חסר.",
  },
];
</script>

<template>
  <section id="how" class="scroll-mt-24 bg-white py-16 md:py-20" aria-labelledby="how-title">
    <div class="mx-auto max-w-[1190px] px-4">
      <div class="text-center">
        <p class="eyebrow">שלושה צעדים, אפס ניחושים</p>
        <h2 id="how-title" class="section-title mt-2">איך זה עובד?</h2>
      </div>

      <ol class="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        <li v-for="(step, i) in STEPS" :key="step.title" class="max-w-sm">
          <span
            class="grid size-12 place-items-center rounded-full text-lg font-extrabold text-white"
            :class="i === STEPS.length - 1 ? 'bg-highlight-600' : 'bg-primary-900'"
            aria-hidden="true"
          >
            {{ i + 1 }}
          </span>
          <h3 class="mt-5 text-lg font-bold text-primary-900">
            <span class="sr-only">שלב {{ i + 1 }}: </span>{{ step.title }}
          </h3>
          <p class="mt-2 text-[15px] leading-relaxed text-black/65">{{ step.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
