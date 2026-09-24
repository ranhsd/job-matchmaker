<script setup lang="ts">
import { AcademicCapIcon, BriefcaseIcon, LanguageIcon, UserCircleIcon } from "@heroicons/vue/24/outline";
import type { CandidateProfile } from "@sigma/shared";

defineProps<{ profile: CandidateProfile }>();
</script>

<template>
  <section class="card p-6" aria-labelledby="profile-title">
    <div class="flex items-start gap-4">
      <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-100">
        <UserCircleIcon class="size-7 text-primary-800" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <p class="text-sm text-black/60">כך הבנו את הפרופיל שלך</p>
        <h2 id="profile-title" class="text-xl font-bold text-primary-900">
          {{ profile.fullName ? `${profile.fullName} · ` : "" }}{{ profile.headline }}
        </h2>
        <p class="mt-2 text-[15px] leading-relaxed text-black/75">{{ profile.summary }}</p>
      </div>
    </div>

    <dl class="mt-5 grid gap-4 border-t border-primary-100 pt-5 md:grid-cols-3">
      <div>
        <dt class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-primary-800">
          <BriefcaseIcon class="size-4" aria-hidden="true" /> ניסיון
        </dt>
        <dd class="text-sm text-black/75">
          {{ profile.yearsOfExperience !== null ? `${profile.yearsOfExperience} שנים` : "לא צוין" }} · {{ profile.seniority }}
        </dd>
      </div>
      <div>
        <dt class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-primary-800">
          <AcademicCapIcon class="size-4" aria-hidden="true" /> השכלה
        </dt>
        <dd class="text-sm text-black/75">
          <ul class="space-y-0.5">
            <li v-for="e in profile.education.slice(0, 3)" :key="e">{{ e }}</li>
            <li v-if="profile.education.length === 0">לא צוינה</li>
          </ul>
        </dd>
      </div>
      <div>
        <dt class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-primary-800">
          <LanguageIcon class="size-4" aria-hidden="true" /> שפות
        </dt>
        <dd class="text-sm text-black/75">{{ profile.languages.join(" · ") || "לא צוינו" }}</dd>
      </div>
    </dl>

    <div v-if="profile.skills.length" class="mt-4 flex flex-wrap gap-1.5">
      <span v-for="skill in profile.skills" :key="skill" class="chip">{{ skill }}</span>
    </div>
  </section>
</template>
