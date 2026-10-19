<script setup lang="ts">
const emit = defineEmits<{ privacy: [] }>();
</script>

<template>
  <section class="border-t border-primary-100 bg-white py-10" aria-label="מידע על השירות">
    <div class="mx-auto grid max-w-[1190px] gap-8 px-4 text-sm leading-relaxed text-black/70 md:grid-cols-2 md:gap-16">
      <div>
        <h2 class="mb-2 text-base font-bold text-primary-900">על ההתאמה</h2>
        <p>
          "התאמה בקליק" הוא כלי עזר לאיתור משרות על בסיס ניתוח אוטומטי של קורות החיים. ההמלצות אינן מהוות אישור לעמידה בתנאי הסף
          או לזכאות להתמודד במכרז.
        </p>
        <p class="mt-2">המידע המחייב מופיע בפרסום המכרז הרשמי, והגשת המועמדות מתבצעת באתר הגיוס לשירות המדינה.</p>
      </div>
      <div>
        <h2 class="mb-2 text-base font-bold text-primary-900">פרטיות המידע</h2>
        <p>
          קורות החיים משמשים לצורך יצירת ההתאמות. תוכן הקובץ נשלח לעיבוד באמצעות מודל <bdi>Gemini</bdi> של <bdi>Google</bdi>. למידע על
          אופן עיבוד הנתונים והשמירה על פרטיותך, אפשר לעיין ב<button
            type="button"
            class="font-medium text-accent-600 underline underline-offset-2 hover:text-accent-700"
            @click="emit('privacy')"
          >מדיניות הפרטיות</button>.
        </p>
      </div>
    </div>
  </section>
</template>
