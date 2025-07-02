/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_INSTAGRAM_APP_ID: string;
  readonly VITE_INSTAGRAM_APP_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
