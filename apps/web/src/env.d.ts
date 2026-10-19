/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Link for the feedback survey on the results page. The survey card is hidden when unset. */
  readonly VITE_SURVEY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
