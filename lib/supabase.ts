import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for the entire server-side application
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Create a singleton for client-side usage to prevent multiple instances
let clientInstance: ReturnType<typeof createClient> | null = null

export const createClientSupabaseClient = () => {
  if (clientInstance) return clientInstance

  clientInstance = createClient(supabaseUrl, supabaseAnonKey)
  return clientInstance
}
