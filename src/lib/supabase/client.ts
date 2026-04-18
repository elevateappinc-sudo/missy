import { createBrowserClient } from "@supabase/ssr";

// Fallback stubs keep createBrowserClient from throwing during SSG/prerender
// when the env vars are missing at build time. Real requests still fail until
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are provided.
const FALLBACK_URL = "https://missing-supabase-url.supabase.co";
const FALLBACK_KEY = "missing-anon-key";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY
  );
}
