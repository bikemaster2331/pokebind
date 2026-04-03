/*
  POKEVAULT - CLIENT-SIDE SUPABASE BROWSER CLIENT
  ----------------------------------------------
  This file provides a function to create a Supabase client specifically 
  for use in Client Components ('use client'). It uses the @supabase/ssr 
  package to handle authentication state in the browser.
*/

import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowser() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
}