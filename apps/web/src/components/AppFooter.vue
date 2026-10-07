<script setup lang="ts">
const OFFICIAL_SITE = "https://merkava.mrp.gov.il/giusp/index.html#/";
</script>

<template>
  <footer class="bg-primary-950 text-white">
    <div class="mx-auto flex max-w-[1190px] flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <span class="shrink-0 rounded-md bg-white px-2 py-1">
          <img src="/logo-nashm.png" alt="נציבות שירות המדינה – אגף בכיר גיוס ומיון" class="h-8 w-auto" />
        </span>
        <div>
          <p class="font-bold">התאמה בקליק</p>
          <p class="text-xs text-white/60">כלי עזר עצמאי להתאמת משרות בשירות המדינה · אינו אתר רשמי של נציבות שירות המדינה</p>
        </div>
      </div>
      <nav aria-label="קישורי תחתית" class="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
        <a href="#privacy" class="underline underline-offset-4 hover:text-sky-soft">מדיניות פרטיות</a>
        <a href="#disclaimer" class="underline underline-offset-4 hover:text-sky-soft">הסתייגות</a>
        <a :href="OFFICIAL_SITE" target="_blank" rel="noopener" class="underline underline-offset-4 hover:text-sky-soft">לאתר המשרות הרשמי</a>
      </nav>
    </div>

    <div class="border-t border-white/10">
      <div class="mx-auto grid max-w-[1190px] gap-3 px-4 py-4 text-xs leading-relaxed text-white/55 md:grid-cols-2 md:gap-8">
        <p id="privacy" class="scroll-mt-24">
          <span class="font-bold text-white/75">פרטיות:</span>
          קורות החיים מעובדים בזיכרון לצורך ההתאמה בלבד ואינם נשמרים בשרת. התוכן נשלח לעיבוד במודל Gemini של Google.
        </p>
        <p id="disclaimer" class="scroll-mt-24">
          <span class="font-bold text-white/75">הסתייגות:</span>
          ציוני ההתאמה מופקים על ידי בינה מלאכותית ומהווים המלצה בלבד. נתוני המשרות נשלפים מהממשק הציבורי של אתר המשרות, וההגשה
          למכרזים מתבצעת באתר הרשמי בלבד.
        </p>
      </div>
    </div>
  </footer>
</template>
