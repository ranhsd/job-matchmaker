<script setup lang="ts">
import { ref } from "vue";
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { ACCEPTED_FORMATS } from "../lib/format";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp";
const ALLOWED = ["pdf", "docx", "txt", "png", "jpg", "jpeg", "webp"];

const file = defineModel<File | null>({ required: true });
const props = defineProps<{ disabled?: boolean }>();

const dragging = ref(false);
const error = ref<string | null>(null);
const input = ref<HTMLInputElement>();

function select(candidate: File | undefined) {
  error.value = null;
  if (!candidate) return;
  const ext = candidate.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "doc") {
    error.value = "פורמט DOC ישן אינו נתמך. אפשר לשמור את הקובץ כ-DOCX או PDF";
    return;
  }
  if (!ALLOWED.includes(ext)) {
    error.value = "סוג הקובץ אינו נתמך. אפשר להעלות PDF, DOCX, TXT או תמונה";
    return;
  }
  if (candidate.size > MAX_BYTES) {
    error.value = "הקובץ גדול מדי. הגודל המרבי הוא 4MB";
    return;
  }
  file.value = candidate;
}

function browse() {
  if (!props.disabled) input.value?.click();
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  if (!props.disabled) select(e.dataTransfer?.files[0]);
}

function onChange(e: Event) {
  const target = e.target as HTMLInputElement;
  select(target.files?.[0]);
  target.value = "";
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
</script>

<template>
  <div>
    <div
      v-if="!file"
      role="button"
      tabindex="0"
      :aria-disabled="disabled"
      aria-label="העלאת קורות חיים. אפשר לגרור לכאן קובץ או ללחוץ כדי לבחור קובץ מהמכשיר"
      class="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition"
      :class="[
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        dragging ? 'border-accent-500 bg-accent-50' : 'border-primary-300 bg-primary-50/60 hover:border-accent-500 hover:bg-accent-50/60',
      ]"
      @click="browse"
      @keydown.enter.prevent="browse"
      @keydown.space.prevent="browse"
      @dragover.prevent="dragging = !disabled"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <span class="mb-4 grid size-12 place-items-center rounded-xl bg-accent-500 text-white shadow-[0_10px_20px_-8px_rgb(56_112_224/0.7)] transition group-hover:bg-accent-600">
        <ArrowUpTrayIcon class="size-6" aria-hidden="true" />
      </span>
      <p class="text-base font-bold text-primary-900">העלאת קורות חיים</p>
      <p class="mt-1.5 text-sm text-black/70">
        אפשר לגרור לכאן קובץ או <span class="font-bold text-accent-600 underline underline-offset-2">לבחור קובץ מהמכשיר</span>.
      </p>
      <p class="mt-1.5 text-xs text-black/55">{{ ACCEPTED_FORMATS }}</p>
    </div>

    <div v-else class="flex items-center gap-4 rounded-xl border border-primary-200 bg-primary-50 p-4">
      <span class="grid size-12 shrink-0 place-items-center rounded-xl bg-white shadow-card">
        <DocumentTextIcon class="size-6 text-accent-600" aria-hidden="true" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate font-medium text-primary-900" dir="auto">{{ file.name }}</p>
        <p class="text-sm text-black/60">{{ formatSize(file.size) }}</p>
      </div>
      <button
        type="button"
        class="rounded-full p-2 text-primary-900 hover:bg-white disabled:opacity-40"
        :disabled="disabled"
        aria-label="הסרת הקובץ"
        @click="file = null"
      >
        <XMarkIcon class="size-5" aria-hidden="true" />
      </button>
    </div>

    <input ref="input" type="file" class="sr-only" :accept="ACCEPT" tabindex="-1" aria-hidden="true" @change="onChange" />
    <p v-if="error" role="alert" class="mt-2 text-sm font-medium text-red-700">{{ error }}</p>
  </div>
</template>
