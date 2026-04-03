/*
  POKEVAULT - ADMIN ORDERS API
  ---------------------------
  Backend API for managing customer orders.
  - PATCH: Update order status (pending -> shipped).
  - Triggers 'shipped' notification emails to customers.
  - Required Header: Admin authentication check (isAdmin).
*/

import { createClient } from '@supabase/supabase-js'

import { sendShippedNotification } from '../../email/receipt'
import { createSupabaseServer } from '../../../server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function isAdmin() {
    const serverSupabase = await createSupabaseServer()
    const { data } = await serverSupabase.auth.getUser()
    return data?.user?.email === process.env.ADMIN_EMAIL
}

export async function PATCH(request) {
    if (!(await isAdmin())) {
        return Response.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()

    const { error } = await supabase
        .from('orders')
        .update({ status: body.status })
        .eq('id', body.id)

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    if (body.status === 'shipped') {
        try {
            const { data: order } = await supabase
                .from('orders')
                .select('id, guest_name, guest_email, shipping_address')
                .eq('id', body.id)
                .single()

            await sendShippedNotification({ order })
        } catch (emailError) {
            console.error('Failed to send shipped notification.', emailError)
        }
    }

    return Response.json({ message: 'Order updated.' })
}