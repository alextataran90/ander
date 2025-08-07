// This file is for future Supabase integration when DATABASE_URL is provided
// Currently using in-memory storage as per the blueprint guidelines

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

// Future implementation would use:
// import { createClient } from '@supabase/supabase-js'
// export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)
