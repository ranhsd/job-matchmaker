<script setup lang="ts">
import { ref } from "vue";
import { CloudArrowUpIcon, DocumentTextIcon, XMarkIcon } from "@heroicons/vue/24/outline";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp";
const ALLOWED = ["pdf", "docx", "txt", "png", "jpg", "jpeg", "webp"];

const file = defineModel<File | null>({ required: true });
defineProps<{ disabled?: boolean }>();

const dragging = ref(false);
const error = ref<string | null>(null);
const input = ref<HTMLInputElement>();

function select(candidate: File | undefined) {
  error.value = null;
  if (!candidate) return;
  const ext = candidate.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "doc") {
    error.value = "פורמט DOC ישן אינו נתמך – נא לשמור כ-DOCX או PDF";
    return;
  }
  if (!ALLOWED.includes(ext)) {
    error.value = "סוג קובץ לא נתמך. ניתן להעלות PDF, DOCX, TXT או תמונה";
    return;
  }
  if (candidate.size > MAX_BYTES) {
    error.value = "הקובץ גדול מדי (מקסימום 4MB)";
    return;
  }
  file.value = candidate;
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  select(e.dataTransfer?.files[0]);
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
      aria-label="העלאת קובץ קורות חיים. ניתן לגרור קובץ לכאן או ללחוץ לבחירה"
      class="group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition"
      :class="
        dragging
          ? 'border-accent-500 bg-accent-50'
          : 'border-primary-300 bg-primary-100/60 hover:border-primary-600 hover:bg-primary-100'
      "
      @click="input?.click()"
      @keydown.enter.prevent="input?.click()"
      @keydown.space.prevent="input?.click()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <div class="mb-3 flex size-14 items-center justify-center rounded-full bg-white shadow-card">
        <CloudArrowUpIcon class="size-7 text-primary-700" aria-hidden="true" />
      </div>
      <p class="text-base font-medium text-primary-900">גררו לכאן את קובץ קורות החיים</p>
      <p class="mt-1 text-sm text-black/60">
        או <span class="font-medium text-accent-600 underline">בחרו קובץ מהמחשב</span>
      </p>
      <p class="mt-3 text-xs text-black/50">קבצי <bdi>PDF</bdi>, <bdi>DOCX</bdi>, <bdi>TXT</bdi> או תמונה · עד <bdi>4MB</bdi></p>
    </div>

    <div v-else class="flex items-center gap-4 rounded-lg border border-primary-200 bg-primary-100/60 p-4">
      <div class="flex size-12 shrink-0 items-center justify-center rounded-gov bg-white shadow-card">
        <DocumentTextIcon class="size-6 text-primary-700" aria-hidden="true" />
      </div>
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

    <input ref="input" type="file" class="sr-only" :accept="ACCEPT" tabindex="-1" @change="onChange" />
    <p v-if="error" role="alert" class="mt-2 text-sm font-medium text-highlight-600">{{ error }}</p>
  </div>
</template>
