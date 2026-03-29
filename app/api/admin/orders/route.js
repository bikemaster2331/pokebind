import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(request) {
    const body = await request.json()

    const { error } = await supabase
        .from('orders')
        .update({ status: body.status })
        .eq('id', body.id)

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: 'Order updated.' })
}