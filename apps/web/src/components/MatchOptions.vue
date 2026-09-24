<script setup lang="ts">
import { computed } from "vue";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Switch,
  SwitchGroup,
  SwitchLabel,
} from "@headlessui/vue";
import { CheckIcon, ChevronDownIcon, ChevronUpDownIcon } from "@heroicons/vue/20/solid";
import type { MatchFilters } from "@sigma/shared";

const filters = defineModel<MatchFilters>({ required: true });
const props = defineProps<{ areas: string[]; disabled?: boolean }>();

const JOB_PERCENT_OPTIONS = [
  { value: 0, label: "כל היקפי המשרה" },
  { value: 100, label: "משרה מלאה בלבד" },
];

const publicOnly = computed({
  get: () => filters.value.publicOnly ?? false,
  set: (v) => (filters.value = { ...filters.value, publicOnly: v }),
});

const selectedAreas = computed({
  get: () => filters.value.areas ?? [],
  set: (v) => (filters.value = { ...filters.value, areas: v }),
});

const jobPercent = computed({
  get: () => filters.value.minJobPercent ?? 0,
  set: (v) => (filters.value = { ...filters.value, minJobPercent: v || undefined }),
});

const notes = computed({
  get: () => filters.value.notes ?? "",
  set: (v) => (filters.value = { ...filters.value, notes: v }),
});

const areasLabel = computed(() =>
  selectedAreas.value.length === 0
    ? "כל האזורים"
    : selectedAreas.value.length <= 2
      ? selectedAreas.value.join(", ")
      : `${selectedAreas.value.length} אזורים נבחרו`,
);

const sortedAreas = computed(() => [...props.areas].sort((a, b) => a.localeCompare(b, "he")));
</script>

<template>
  <div class="space-y-4">
    <SwitchGroup as="div" class="flex items-center justify-between gap-4">
      <SwitchLabel class="cursor-pointer">
        <span class="block font-medium text-primary-900">מכרזים פומביים בלבד</span>
        <span class="block text-sm text-black/60">הסתרת מכרזים פנימיים ובינמשרדיים המיועדים לעובדי מדינה</span>
      </SwitchLabel>
      <Switch
        v-model="publicOnly"
        :disabled="disabled"
        :class="publicOnly ? 'bg-primary-900' : 'bg-primary-300'"
        class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50"
      >
        <span
          :class="publicOnly ? '-translate-x-6' : '-translate-x-1'"
          class="inline-block size-4 rounded-full bg-white shadow transition"
        />
      </Switch>
    </SwitchGroup>

    <Disclosure v-slot="{ open }">
      <DisclosureButton
        class="flex w-full items-center justify-between rounded-gov py-2 text-start text-sm font-medium text-accent-600 hover:text-accent-500"
      >
        הגדרות נוספות (אזור, היקף משרה, העדפות)
        <ChevronDownIcon class="size-5 transition" :class="open && 'rotate-180'" aria-hidden="true" />
      </DisclosureButton>

      <DisclosurePanel class="grid gap-4 pt-2 sm:grid-cols-2">
        <Listbox v-model="selectedAreas" multiple :disabled="disabled" as="div" class="relative">
          <label class="mb-1 block text-sm font-medium text-primary-900">אזור</label>
          <ListboxButton
            class="relative w-full rounded-gov border border-primary-300 bg-white py-2.5 pe-10 ps-3 text-start text-sm hover:border-primary-600"
          >
            <span class="block truncate">{{ areasLabel }}</span>
            <ChevronUpDownIcon class="absolute end-2 top-1/2 size-5 -translate-y-1/2 text-black/40" aria-hidden="true" />
          </ListboxButton>
          <transition leave-active-class="transition duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <ListboxOptions
              class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-gov bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
            >
              <ListboxOption
                v-for="area in sortedAreas"
                :key="area"
                v-slot="{ active, selected }"
                :value="area"
                as="template"
              >
                <li
                  class="relative cursor-pointer select-none py-2 pe-4 ps-9"
                  :class="active ? 'bg-primary-100 text-primary-900' : 'text-black/85'"
                >
                  <span :class="selected ? 'font-medium' : ''">{{ area }}</span>
                  <CheckIcon v-if="selected" class="absolute start-2.5 top-1/2 size-5 -translate-y-1/2 text-primary-900" aria-hidden="true" />
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </Listbox>

        <Listbox v-model="jobPercent" :disabled="disabled" as="div" class="relative">
          <label class="mb-1 block text-sm font-medium text-primary-900">היקף משרה</label>
          <ListboxButton
            class="relative w-full rounded-gov border border-primary-300 bg-white py-2.5 pe-10 ps-3 text-start text-sm hover:border-primary-600"
          >
            <span class="block truncate">{{ JOB_PERCENT_OPTIONS.find((o) => o.value === jobPercent)?.label }}</span>
            <ChevronUpDownIcon class="absolute end-2 top-1/2 size-5 -translate-y-1/2 text-black/40" aria-hidden="true" />
          </ListboxButton>
          <ListboxOptions
            class="absolute z-20 mt-1 w-full overflow-auto rounded-gov bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
          >
            <ListboxOption
              v-for="option in JOB_PERCENT_OPTIONS"
              :key="option.value"
              v-slot="{ active, selected }"
              :value="option.value"
              as="template"
            >
              <li
                class="relative cursor-pointer select-none py-2 pe-4 ps-9"
                :class="active ? 'bg-primary-100 text-primary-900' : 'text-black/85'"
              >
                <span :class="selected ? 'font-medium' : ''">{{ option.label }}</span>
                <CheckIcon v-if="selected" class="absolute start-2.5 top-1/2 size-5 -translate-y-1/2 text-primary-900" aria-hidden="true" />
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Listbox>

        <div class="sm:col-span-2">
          <label for="notes" class="mb-1 block text-sm font-medium text-primary-900">העדפות נוספות (לא חובה)</label>
          <textarea
            id="notes"
            v-model="notes"
            :disabled="disabled"
            rows="2"
            maxlength="500"
            placeholder="לדוגמה: מחפש/ת תפקיד ניהולי בתחום הדיגיטל, מעדיף/ה עבודה בירושלים"
            class="w-full rounded-gov border border-primary-300 bg-white px-3 py-2 text-sm placeholder:text-black/40 hover:border-primary-600 focus:border-accent-500 focus:outline-none"
          />
        </div>
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>
