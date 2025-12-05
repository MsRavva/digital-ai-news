import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// Client-side Supabase client with proper PKCE support
// createBrowserClient из @supabase/ssr автоматически использует singleton pattern
// и предотвращает создание множественных экземпляров GoTrueClient
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
