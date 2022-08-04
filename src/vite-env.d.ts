/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEFAULT_FILE: string;
  readonly DEFAULT_SOUNDFONT: string;
  readonly DEBUG_APP: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
