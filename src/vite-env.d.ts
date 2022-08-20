/// <reference types="vite/client" />

interface ImportMetaEnv {
  // From vite
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;

  readonly VITE_DEFAULT_FILE: string;
  readonly VITE_DEFAULT_SOUNDFONT: string;
  readonly VITE_DEBUG_APP: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
