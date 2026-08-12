/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend (bi-back). Fallback en código: http://localhost:3001 */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
