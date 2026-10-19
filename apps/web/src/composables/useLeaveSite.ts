import { ref } from "vue";

const pendingUrl = ref<string | null>(null);

export function useLeaveSite() {
  return {
    pendingUrl,
    confirm: (url: string) => (pendingUrl.value = url),
    close: () => (pendingUrl.value = null),
  };
}
