<script setup lang="ts">
import type { MatchResult } from "@sigma/shared";
import { CATEGORIES, CATEGORY_ORDER, CHECK_ORDER, CHECKS } from "../lib/format";
import CheckBox from "./CheckBox.vue";
import MatchCard from "./MatchCard.vue";

const SAMPLE_DEADLINE = new Date(Date.now() + 21 * 86_400_000).toISOString();

const SAMPLE: MatchResult = {
  category: "possible",
  score: 68,
  whyRelevant:
    "התפקיד משלב תכנון תוכניות עבודה, בקרה והובלת תהליכים מול גורמים שונים. הניסיון שלך בניהול פרויקטים ובתכנון תהליכים עשוי להיות רלוונטי לתחומי העיסוק האלה.",
  evidence: ["ניסיון רלוונטי בתכנון ובקרה", "ניסיון בהובלת פרויקטים ובעבודה מול ממשקים"],
  checks: [
    {
      status: "unclear",
      requirement: "שנתיים של ניסיון ניהולי",
      note: "לא נמצא בקורות החיים מידע מספק לגבי ניסיון זה.",
    },
  ],
  position: {
    tenderNumber: "",
    requestId: "sample",
    jobName: "",
    tenderName: "מרכז/ת בכיר/ה (תכנון ובקרה)",
    officeName: "משרד האוצר",
    officeUnitName: "",
    locationName: "ירושלים",
    area: "ירושלים",
    publicationType: "מכרז פומבי",
    isPublic: true,
    isHot: false,
    level: "משרת ביניים",
    jobRating: "",
    rankFrom: "",
    rankTo: "",
    jobPercent: 100,
    numberOfJobs: 1,
    salaryMin: null,
    salaryMax: null,
    publicationDate: null,
    lastSubmissionDate: SAMPLE_DEADLINE,
    daysLeft: 21,
    fields: [],
    tags: [],
    logo: null,
    url: "",
  },
};
</script>

<template>
  <section class="bg-surface py-16 md:py-20" aria-labelledby="example-title">
    <div class="mx-auto grid max-w-[1190px] items-start gap-12 px-4 lg:grid-cols-2 lg:gap-16">
      <div class="lg:pt-8">
        <p class="eyebrow">כך נראית התאמה</p>
        <h2 id="example-title" class="section-title mt-2">
          לכל משרה מוצגת מידת ההתאמה המקצועית לניסיון ולכישורים שלך, לצד מידע שיעזור לך להחליט אם כדאי להגיש מועמדות.
        </h2>

        <h3 class="mt-8 text-sm font-bold text-primary-900">רמות ההתאמה</h3>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li v-for="id in CATEGORY_ORDER" :key="id" class="rounded-full px-3 py-1 text-xs font-bold" :class="CATEGORIES[id].badge">
            {{ CATEGORIES[id].label }}
          </li>
        </ul>

        <h3 class="mt-7 text-sm font-bold text-primary-900">מה כדאי לבדוק – שלושה מצבים</h3>
        <ul class="mt-3 space-y-2">
          <li v-for="status in CHECK_ORDER" :key="status">
            <CheckBox :status="status" title="" class="!bg-transparent !p-0">{{ CHECKS[status].legend }}</CheckBox>
          </li>
        </ul>
      </div>

      <figure class="lg:justify-self-end">
        <figcaption class="mb-2 text-xs text-black/55">כרטיסייה לדוגמה</figcaption>
        <MatchCard :match="SAMPLE" layout="stacked" sample class="w-full max-w-[480px]" />
      </figure>
    </div>
  </section>
</template>
