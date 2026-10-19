<script setup lang="ts">
import { ArrowPathIcon, DocumentMagnifyingGlassIcon, ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import { ACCEPTED_FORMATS, OFFICIAL_SITE } from "../lib/format";

defineProps<{ kind: "empty" | "file" | "search"; detail?: string | null }>();
const emit = defineEmits<{ home: []; upload: []; retry: [] }>();
</script>

<template>
  <section class="bg-surface px-4 py-14 md:py-20" aria-live="polite">
    <div class="card mx-auto max-w-lg p-7 md:p-8" role="alert" aria-labelledby="message-title">
      <template v-if="kind === 'empty'">
        <p class="text-sm font-bold text-black/60">לא נמצאו התאמות</p>
        <span class="mt-4 grid size-11 place-items-center rounded-xl bg-accent-50 text-accent-600">
          <DocumentMagnifyingGlassIcon class="size-6" aria-hidden="true" />
        </span>
        <h1 id="message-title" class="mt-4 text-xl font-extrabold leading-snug text-primary-900 md:text-[22px]">
          לא מצאנו כרגע התאמות מספקות.
          <span class="block">אבל החיפוש לא נגמר כאן.</span>
        </h1>
        <p class="mt-3 text-[15px] leading-relaxed text-black/70">
          יכול להיות שהניסיון שלך מתאים לתחומים נוספים, או שחסר לנו מידע כדי לזהות את האפשרויות הנכונות.
        </p>
        <p class="mt-2 text-[15px] leading-relaxed text-black/70">
          אפשר להרחיב את החיפוש ולשנות העדפות או להוסיף פרטים ולעדכן את קובץ קורות החיים.
        </p>
        <div class="mt-6 flex flex-col items-start gap-3">
          <button type="button" class="btn-primary" @click="emit('home')">חזרה לדף הבית</button>
          <a :href="OFFICIAL_SITE" target="_blank" rel="noopener" class="btn-secondary">
            צפייה בכל המשרות הפתוחות<span class="sr-only"> (נפתח בחלון חדש)</span>
          </a>
        </div>
      </template>

      <template v-else-if="kind === 'file'">
        <p class="text-sm font-bold text-black/60">קובץ לא נקלט</p>
        <span class="mt-4 grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700">
          <ExclamationTriangleIcon class="size-6" aria-hidden="true" />
        </span>
        <h1 id="message-title" class="mt-4 text-xl font-extrabold text-primary-900 md:text-[22px]">לא הצלחנו לקרוא את הקובץ.</h1>
        <p v-if="detail" class="mt-3 text-[15px] text-black/70">{{ detail }}.</p>
        <p class="mt-2 text-[15px] text-black/70">אפשר לנסות להעלות קובץ אחר בפורמט נתמך.</p>
        <p class="mt-2 text-xs text-black/55">{{ ACCEPTED_FORMATS }}</p>
        <button type="button" class="btn-pill mt-6" @click="emit('upload')">העלאת קורות חיים</button>
      </template>

      <template v-else>
        <p class="text-sm font-bold text-black/60">החיפוש נכשל</p>
        <span class="mt-4 grid size-11 place-items-center rounded-xl bg-red-50 text-red-700">
          <ArrowPathIcon class="size-6" aria-hidden="true" />
        </span>
        <h1 id="message-title" class="mt-4 text-xl font-extrabold text-primary-900 md:text-[22px]">לא הצלחנו להשלים את החיפוש כרגע.</h1>
        <p v-if="detail" class="mt-3 text-[15px] text-black/70">{{ detail }}.</p>
        <p class="mt-2 text-[15px] text-black/70">אפשר לנסות שוב בעוד כמה רגעים.</p>
        <button type="button" class="btn-primary mt-6" @click="emit('retry')">ניסיון חוזר</button>
      </template>
    </div>
  </section>
</template>
