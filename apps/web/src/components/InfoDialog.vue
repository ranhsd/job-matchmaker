<script setup lang="ts">
import { ref, watch } from "vue";
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { XMarkIcon } from "@heroicons/vue/20/solid";
import type { InfoTopic } from "../lib/format";

const props = defineProps<{ topic: InfoTopic | null }>();
const emit = defineEmits<{ close: [] }>();

// Keeps the panel rendered while it fades out after topic clears.
const shown = ref<InfoTopic>("privacy");
watch(
  () => props.topic,
  (next) => {
    if (next) shown.value = next;
  },
);

const CONTENT: Record<InfoTopic, { title: string; paragraphs: string[] }> = {
  privacy: {
    title: "מדיניות פרטיות",
    paragraphs: [
      "קורות החיים שמעלים משמשים רק לצורך יצירת ההתאמות. הקובץ מעובד בזיכרון השרת ואינו נשמר בו לאחר סיום החיפוש.",
      "תוכן הקובץ וההעדפות שבחרת נשלחים לעיבוד באמצעות מודל Gemini של Google, כדי לזהות את הניסיון, ההשכלה והכישורים ולבחון את ההתאמה למשרות.",
      "פרטי המשרות נלקחים מהממשק הציבורי של אתר הגיוס לשירות המדינה. הגשת המועמדות מתבצעת באתר הגיוס הרשמי בלבד, ולא נשלח אליו מידע מתוך הכלי.",
    ],
  },
  accessibility: {
    title: "נגישות",
    paragraphs: [
      "האתר נבנה כך שאפשר להשתמש בו באמצעות מקלדת וקורא מסך, עם תוויות לכל שדה, קישור דילוג לתוכן המרכזי, ניגודיות צבעים ברורה ותמיכה מלאה בכיווניות מימין לשמאל.",
      "קישורים שנפתחים בחלון חדש מסומנים, והודעות על התקדמות החיפוש ועל שגיאות מוקראות לקוראי מסך.",
    ],
  },
};
</script>

<template>
  <TransitionRoot as="template" :show="topic !== null">
    <Dialog class="relative z-50" @close="emit('close')">
      <TransitionChild as="template" enter="duration-200 ease-out" enter-from="opacity-0" enter-to="opacity-100" leave="duration-150 ease-in" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-primary-950/50" aria-hidden="true" />
      </TransitionChild>
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild as="template" enter="duration-200 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="duration-150 ease-in" leave-from="opacity-100" leave-to="opacity-0">
            <DialogPanel class="card w-full max-w-lg p-6">
              <div class="flex items-start justify-between gap-4">
                <DialogTitle class="text-xl font-extrabold text-primary-900">{{ CONTENT[shown].title }}</DialogTitle>
                <button type="button" class="rounded-full p-1.5 text-primary-900 hover:bg-primary-100" aria-label="סגירה" @click="emit('close')">
                  <XMarkIcon class="size-5" aria-hidden="true" />
                </button>
              </div>
              <div class="mt-4 space-y-3 text-[15px] leading-relaxed text-black/75">
                <p v-for="p in CONTENT[shown].paragraphs" :key="p">{{ p }}</p>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
