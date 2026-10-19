<script setup lang="ts">
const SURVEY_URL = import.meta.env.VITE_SURVEY_URL;

const QUESTIONS = [
  "עד כמה המשרות שהוצעו לך התאימו לניסיון המקצועי שלך?",
  "איך הייתה חוויית השימוש ברכיב, מהעלאת קורות החיים ועד לצפייה בתוצאות?",
  "מה היית רוצה שנשפר או נוסיף לרכיב?",
];
</script>

<template>
  <section v-if="SURVEY_URL" class="card p-6 md:p-7" aria-labelledby="survey-title">
    <p class="eyebrow">עזרו לנו להשתפר</p>
    <div class="mt-2 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 id="survey-title" class="text-xl font-extrabold text-primary-900">איך היה? נשמח לשמוע</h2>
        <p class="mt-1 text-sm text-black/60">סקר קצר של שלוש שאלות פתוחות, פחות מדקה:</p>
        <ol class="mt-3 list-inside list-decimal space-y-1.5 text-sm text-black/75">
          <li v-for="q in QUESTIONS" :key="q">{{ q }}</li>
        </ol>
      </div>
      <a :href="SURVEY_URL" target="_blank" rel="noopener" class="btn-pill shrink-0 self-start md:self-auto">
        למילוי הסקר<span class="sr-only"> (נפתח בחלון חדש)</span>
      </a>
    </div>
  </section>
</template>
