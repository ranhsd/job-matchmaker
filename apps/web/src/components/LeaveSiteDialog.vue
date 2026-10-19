<script setup lang="ts">
import { ref, watch } from "vue";
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/vue/24/outline";
import { XMarkIcon } from "@heroicons/vue/20/solid";
import { useLeaveSite } from "../composables/useLeaveSite";

const { pendingUrl, close } = useLeaveSite();

// Keeps the panel rendered while it fades out after pendingUrl clears.
const url = ref("");
watch(pendingUrl, (next) => {
  if (next) url.value = next;
});
</script>

<template>
  <TransitionRoot as="template" :show="pendingUrl !== null">
    <Dialog class="relative z-50" @close="close">
      <TransitionChild as="template" enter="duration-200 ease-out" enter-from="opacity-0" enter-to="opacity-100" leave="duration-150 ease-in" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-primary-950/50" aria-hidden="true" />
      </TransitionChild>
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild as="template" enter="duration-200 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="duration-150 ease-in" leave-from="opacity-100" leave-to="opacity-0">
            <DialogPanel class="relative w-full max-w-sm rounded-2xl bg-white px-6 pb-6 pt-10 text-center shadow-card">
              <button
                type="button"
                class="absolute end-4 top-4 rounded-full p-1 text-black/50 hover:bg-primary-100 hover:text-black/70"
                aria-label="סגירה"
                @click="close"
              >
                <XMarkIcon class="size-6" aria-hidden="true" />
              </button>

              <div class="flex items-center gap-4" aria-hidden="true">
                <span class="h-px flex-1 bg-black/15" />
                <span class="grid size-14 place-items-center rounded-full border-2 border-highlight-500 text-primary-400">
                  <ArrowRightStartOnRectangleIcon class="size-7" />
                </span>
                <span class="h-px flex-1 bg-black/15" />
              </div>

              <DialogTitle class="mt-4 text-[17px] font-medium leading-relaxed text-primary-900">
                המידע המבוקש נמצא בדף תוכן נפרד
                <span class="block">ייתכן ובחזרה תידרש הזדהות מחודשת.</span>
              </DialogTitle>

              <a
                :href="url"
                target="_blank"
                rel="noopener"
                class="mt-5 inline-flex items-center justify-center rounded-md bg-primary-900 px-5 py-2.5 text-[15px] font-bold text-white transition hover:bg-primary-950"
                @click="close"
              >
                מעבר לדף התוכן<span class="sr-only"> (נפתח בחלון חדש)</span>
              </a>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
