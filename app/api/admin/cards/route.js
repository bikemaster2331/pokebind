/*
  POKEVAULT - ADMIN CARDS API
  ---------------------------
  Backend API for managing the 'pokebox' inventory.
  - POST: Add new card packs.
  - PATCH: Update existing card details or stock.
  - DELETE: Remove card packs.
  - Required Header: Admin authentication check (isAdmin).
*/

import { createClient } from '@supabase/supabase-js'

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

export async function POST(request) {
    if (!(await isAdmin())) {
        return Response.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()

    const { error } = await supabase.from('pokebox').insert({
        name: body.name,
        set_name: body.set_name,
        pack_type: body.pack_type,
        language: body.language,
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
    if (!(await isAdmin())) {
        return Response.json({ error: 'Unauthorized.' }, { status: 401 })
    }

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

export async function DELETE(request) {
    if (!(await isAdmin())) {
        return Response.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
        return Response.json({ error: 'Missing card id.' }, { status: 400 })
    }

    const { error } = await supabase
        .from('pokebox')
        .delete()
        .eq('id', id)

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: 'Card deleted.' })
}