import { createClient } from '@supabase/supabase-js'
import { sendOrderReceipt } from '../email/receipt'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing.')
  }
  return createClient(supabaseUrl, supabaseKey)
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return []

  const groupedItems = new Map()

  for (const rawItem of items) {
    const id =
      typeof rawItem?.id === 'string' || typeof rawItem?.id === 'number'
        ? rawItem.id
        : null
    const quantity = Number(rawItem?.quantity)

    if (id === null || !Number.isInteger(quantity) || quantity < 1) return null

    const key = String(id)
    const currentQuantity = groupedItems.get(key)?.quantity ?? 0

    groupedItems.set(key, { id, key, quantity: currentQuantity + quantity })
  }

  return Array.from(groupedItems.values())
}

export async function POST(request) {
  try {
    const body = await request.json()
    const items = normalizeItems(body?.items)
    const guestEmail = body?.guest_email ?? null
    const guestName = body?.guest_name ?? null
    const guestPhone = body?.guest_phone ?? null
    const shippingAddress = body?.shipping_address ?? null

    if (!items) {
      return Response.json(
        { error: 'Each checkout item needs a valid id and quantity.' },
        { status: 400 }
      )
    }

    if (items.length === 0) {
      return Response.json({ error: 'Your cart is empty.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const itemIds = items.map((item) => item.id)

    const { data: cards, error: fetchError } = await supabase
      .from('pokebox')
      .select('id, name, price, stock_quantity')
      .in('id', itemIds)

    if (fetchError) {
      console.error('Unable to load checkout items.', fetchError)
      return Response.json({ error: 'Unable to verify stock right now.' }, { status: 500 })
    }

    const cardsById = new Map((cards ?? []).map((card) => [String(card.id), card]))

    if (cardsById.size !== items.length) {
      return Response.json(
        { error: 'One or more cards in your cart no longer exist.' },
        { status: 404 }
      )
    }

    for (const item of items) {
      const card = cardsById.get(item.key)
      const stock = Number(card?.stock_quantity ?? 0)

      if (!card || stock < item.quantity) {
        const cardName = card?.name ?? 'This card'
        return Response.json(
          { error: `${cardName} only has ${stock} left. Please update your cart and try again.` },
          { status: 409 }
        )
      }
    }

    const shippingFee = 80
    const total = items.reduce((sum, item) => {
      const card = cardsById.get(item.key)
      return sum + Number(card.price ?? 0) * item.quantity
    }, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        guest_email: guestEmail,
        guest_name: guestName,
        guest_phone: guestPhone,
        shipping_address: shippingAddress,
        status: 'pending',
        total,
        shipping_fee: shippingFee,
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('Unable to create order.', orderError)
      return Response.json({ error: 'Unable to create order right now.' }, { status: 500 })
    }

    const orderItems = items.map((item) => {
      const card = cardsById.get(item.key)
      return {
        order_id: order.id,
        card_id: item.id,
        quantity: item.quantity,
        unit_price: Number(card.price ?? 0),
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Unable to save order items.', itemsError)
      return Response.json({ error: 'Unable to save order items.' }, { status: 500 })
    }

    const updatedCards = []

    for (const item of items) {
      const card = cardsById.get(item.key)
      const currentStock = Number(card.stock_quantity ?? 0)
      const nextStock = currentStock - item.quantity

      const { data: updatedCard, error: updateError } = await supabase
        .from('pokebox')
        .update({ stock_quantity: nextStock })
        .eq('id', item.id)
        .eq('stock_quantity', currentStock)
        .select('id, name, stock_quantity')
        .maybeSingle()

      if (updateError) {
        console.error(`Unable to update stock for card ${item.key}.`, updateError)
        return Response.json({ error: 'Unable to complete checkout right now.' }, { status: 500 })
      }

      if (!updatedCard) {
        return Response.json(
          { error: `${card.name} changed while you were checking out. Please try again.` },
          { status: 409 }
        )
      }

      updatedCards.push(updatedCard)
    }

    try {
      const { data: savedItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      const { data: savedCards } = await supabase
        .from('pokebox')
        .select('id, name')
        .in('id', savedItems.map((i) => i.card_id))

      await sendOrderReceipt({
        order: {
          id: order.id,
          guest_name: guestName,
          guest_email: guestEmail,
          shipping_address: shippingAddress,
          total,
          shipping_fee: shippingFee,
        },
        items: savedItems,
        cards: savedCards,
      })
    } catch (emailError) {
      console.error('Failed to send receipt email.', emailError)
    }

    return Response.json({
      message: 'Checkout complete. Stock updated successfully.',
      orderId: order.id,
      updatedCards,
    })
  } catch (error) {
    console.error('Checkout request failed.', error)

    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid checkout payload.' }, { status: 400 })
    }

    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid checkout request.' },
      { status: 500 }
    )
  }
}