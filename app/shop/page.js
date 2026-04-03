/*
  POKEVAULT - SHOP PAGE (SERVER COMPONENT)
  ---------------------------------------
  This is the main storefront page. It performs the initial 
  server-side fetch of the 'pokebox' data from Supabase and passes 
  it to the client-side Storefront component.
*/

export const revalidate = 0

import { supabase } from '../supabase'
import Storefront from '../storefront'

export default async function ShopPage() {
  const { data: cards, error } = await supabase
    .from('pokebox')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <Storefront cards={cards || []} />
  )
}
