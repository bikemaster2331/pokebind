/*
  POKEVAULT - SERVER-SIDE SUPABASE SSR CLIENT
  -----------------------------------------
  This utility provides a Supabase client for Server Actions and 
  Server-Side Rendering (SSR). It specifically handles cookie-based 
  authentication as required by Next.js and @supabase/ssr.
*/

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServer() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { }
                },
            },
        }
    )
}