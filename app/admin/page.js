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