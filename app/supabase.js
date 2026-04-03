/*
  POKEVAULT - SERVER-SIDE SUPABASE CLIENT
  --------------------------------------
  This file initializes the Supabase client for use in Server Components 
  and API routes. It uses the environment variables defined in .env.local.
*/

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// This client is used for standard database operations.
export const supabase = createClient(supabaseUrl, supabaseKey)