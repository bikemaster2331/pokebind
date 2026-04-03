/*
  POKEVAULT - ADMIN INDEX PAGE (SERVER COMPONENT)
  ----------------------------------------------
  This page handles the server-side logic for the admin dashboard.
  - Verifies admin authentication (via Supabase and ADMIN_EMAIL check).
  - Fetches cards, orders, and order items from Supabase.
  - Passes the data to the client-side AdminDashboard component.
*/

import { createSupabaseServer } from '../server'

import { redirect } from 'next/navigation'
import AdminDashboard from './dashboard'

export default async function AdminPage() {
    const supabase = await createSupabaseServer()
    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
        redirect('/admin/login')
    }

    const { data: cards } = await supabase
        .from('pokebox')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')

    return (
        <AdminDashboard
            cards={cards ?? []}
            orders={orders ?? []}
            orderItems={orderItems ?? []}
            user={user}
        />
    )
}