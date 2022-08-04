/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_FILE: string;
  readonly VITE_DEFAULT_SOUNDFONT: string;
  readonly VITE_DEBUG_APP: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
