import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
    const body = await request.json()

    const { error } = await supabase.from('pokebox').insert({
        name: body.name,
        set_name: body.set_name,
        type: body.type || null,
        rarity: body.rarity,
        condition: body.condition,
        price: Number(body.price),
        stock_quantity: Number(body.stock_quantity),
        image_url: body.image_url || null,
    })

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: 'Card added.' })
}

export async function PATCH(request) {
    const body = await request.json()
    const { id, ...updates } = body

    if (updates.price) updates.price = Number(updates.price)
    if (updates.stock_quantity) updates.stock_quantity = Number(updates.stock_quantity)

    const { error } = await supabase
        .from('pokebox')
        .update(updates)
        .eq('id', id)

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: 'Card updated.' })
}