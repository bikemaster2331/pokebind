export const revalidate = 0

import { supabase } from './supabase'
import Storefront from './storefront'

export default async function Home() {
  const { data: cards, error } = await supabase
    .from('pokebox')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return <p>Error loading cards.</p>
  }

  return <Storefront cards={cards ?? []} />
}