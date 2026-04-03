import { createClient } from '@supabase/supabase-js'
import { sendOrderReceipt } from '../../email/receipt'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabaseClient() {
    return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request) {
    try {
        // Safer parsing for PayMongo payloads
        const rawBody = await request.text();
        if (!rawBody) return Response.json({ error: "Empty request" }, { status: 400 });
        const payload = JSON.parse(rawBody);

        const eventType = payload.data?.attributes?.type

        if (eventType !== 'checkout_session.payment.paid') {
            return Response.json({ received: true, message: 'Event ignored' })
        }

        const checkoutSession = payload.data.attributes.data.attributes
        const orderId = checkoutSession.reference_number

        const supabase = getSupabaseClient()

        const { data: existingOrder } = await supabase
            .from('orders')
            .select('payment_status')
            .eq('id', orderId)
            .single()

        if (existingOrder?.payment_status === 'paid') {
            return Response.json({ received: true, message: 'Already processed' })
        }

        const { data: savedItems } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)

        if (!savedItems || savedItems.length === 0) {
            return Response.json({ error: 'Order items not found' }, { status: 404 })
        }

        // JUST MARK AS PAID (Stock is already locked/decremented from checkout)
        const { data: order, error: updateError } = await supabase
            .from('orders')
            .update({ payment_status: 'paid', status: 'pending' })
            .eq('id', orderId)
            .select('*')
            .single()

        if (updateError || !order) {
            console.error('Failed to update order status:', updateError)
            return Response.json({ error: 'Database update failed' }, { status: 500 })
        }

        const { data: savedCards } = await supabase
            .from('pokebox')
            .select('id, name')
            .in('id', savedItems.map(i => i.card_id))

        try {
            await sendOrderReceipt({
                order,
                items: savedItems,
                cards: savedCards,
            })
        } catch (emailError) {
            console.error('Receipt email failed', emailError)
        }

        return Response.json({ received: true, message: 'Order marked as paid and receipt sent.' })

    } catch (err) {
        console.error('Webhook handler failed:', err)
        return Response.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}