"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Use this client in Client Components (files) — e.g. the
// billing screen, live stock counters, anywhere that needs Realtime.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://citctwsatxfzznqtcuzh.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_2AMsv9U7J-NvZZ_R0RqGyA_taxDd31L";

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
