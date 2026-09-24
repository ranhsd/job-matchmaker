<script setup lang="ts">
import { ref, watch } from "vue";
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { ArrowTopRightOnSquareIcon, XMarkIcon } from "@heroicons/vue/20/solid";
import type { MatchResult, PositionDetails } from "@sigma/shared";
import { fetchPosition } from "../lib/api";
import { formatDate, formatSalary } from "../lib/format";
import ScoreRing from "./ScoreRing.vue";

const props = defineProps<{ match: MatchResult | null }>();
const emit = defineEmits<{ close: [] }>();

const details = ref<PositionDetails | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

watch(
  () => props.match?.position.requestId,
  async (id) => {
    details.value = null;
    error.value = null;
    if (!id) return;
    loading.value = true;
    try {
      details.value = await fetchPosition(id);
    } catch (err) {
      error.value = (err as Error).message;
    } finally {
      loading.value = false;
    }
  },
);
</script>

<template>
  <TransitionRoot as="template" :show="match !== null">
    <Dialog class="relative z-50" @close="emit('close')">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-primary-950/50" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-6">
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0 translate-y-4 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100"
            leave-to="opacity-0 translate-y-4"
          >
            <DialogPanel v-if="match" class="w-full max-w-3xl overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-gov">
              <div class="flex items-start gap-4 bg-primary-900 p-6 text-white">
                <ScoreRing :score="match.score" class="rounded-full bg-white" />
                <div class="min-w-0 flex-1">
                  <DialogTitle class="text-xl font-bold">{{ match.position.tenderName }}</DialogTitle>
                  <p class="text-white/80">{{ match.position.officeName }} · {{ match.position.officeUnitName }}</p>
                  <p class="mt-1 text-sm text-white/60">
                    מכרז {{ match.position.tenderNumber }} · {{ match.position.publicationType }} · הגשה עד
                    {{ formatDate(match.position.lastSubmissionDate) }}
                  </p>
                </div>
                <button type="button" class="rounded-full p-1.5 hover:bg-white/10" aria-label="סגירה" @click="emit('close')">
                  <XMarkIcon class="size-6" />
                </button>
              </div>

              <div class="max-h-[65vh] space-y-6 overflow-y-auto p-6 text-[15px] leading-relaxed">
                <dl class="grid grid-cols-2 gap-4 rounded-gov bg-primary-100 p-4 text-sm md:grid-cols-4">
                  <div>
                    <dt class="text-black/55">מיקום</dt>
                    <dd class="font-medium text-primary-900">{{ match.position.locationName }}</dd>
                  </div>
                  <div>
                    <dt class="text-black/55">דירוג</dt>
                    <dd class="font-medium text-primary-900">{{ match.position.jobRating }}</dd>
                  </div>
                  <div>
                    <dt class="text-black/55">דרגות</dt>
                    <dd class="font-medium text-primary-900">{{ match.position.rankFrom }}–{{ match.position.rankTo }}</dd>
                  </div>
                  <div>
                    <dt class="text-black/55">{{ formatSalary(match.position.salaryMin, match.position.salaryMax) ? "שכר" : "היקף משרה" }}</dt>
                    <dd class="font-medium text-primary-900">
                      {{ formatSalary(match.position.salaryMin, match.position.salaryMax) ?? `${match.position.jobPercent}%` }}
                    </dd>
                  </div>
                </dl>

                <div v-if="loading" class="space-y-3" aria-busy="true">
                  <div v-for="i in 6" :key="i" class="h-4 animate-pulse rounded bg-primary-100" :style="{ width: `${95 - i * 8}%` }" />
                </div>
                <p v-else-if="error" class="text-highlight-600">{{ error }}</p>
                <template v-else-if="details">
                  <section>
                    <h3 class="mb-2 text-lg font-bold text-primary-900">תיאור התפקיד</h3>
                    <p class="whitespace-pre-line text-black/80">{{ details.description }}</p>
                  </section>
                  <section>
                    <h3 class="mb-2 text-lg font-bold text-primary-900">דרישות התפקיד</h3>
                    <p class="whitespace-pre-line text-black/80">{{ details.requirements }}</p>
                  </section>
                  <section v-if="details.remarks">
                    <h3 class="mb-2 text-lg font-bold text-primary-900">הערות</h3>
                    <p class="whitespace-pre-line text-sm text-black/65">{{ details.remarks }}</p>
                  </section>
                </template>
              </div>

              <div class="flex flex-wrap justify-end gap-2 border-t border-primary-100 p-4">
                <button type="button" class="btn-secondary" @click="emit('close')">סגירה</button>
                <a :href="match.position.url" target="_blank" rel="noopener" class="btn-primary">
                  להגשת מועמדות באתר הרשמי
                  <ArrowTopRightOnSquareIcon class="size-4 rtl:-scale-x-100" aria-hidden="true" />
                </a>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
