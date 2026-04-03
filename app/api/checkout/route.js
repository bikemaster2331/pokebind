/*
  POKEVAULT - CHECKOUT API ROUTE
  -----------------------------
  Key Responsibilities:
  - Validates cart and pricing.
  - Locks inventory atomically (payment_status: unpaid).
  - Sends low-stock alerts.
  - Generates PayMongo Checkout URL and hands it to the frontend.
*/

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
    const id = typeof rawItem?.id === 'string' || typeof rawItem?.id === 'number' ? rawItem.id : null
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
    const rawBody = await request.text()
    if (!rawBody) return Response.json({ error: 'Empty request' }, { status: 400 })
    const body = JSON.parse(rawBody)

    const items = normalizeItems(body?.items)
    const guestEmail = body?.guest_email ?? null
    const guestName = body?.guest_name ?? null
    const guestPhone = body?.guest_phone ?? null
    const shippingAddress = body?.shipping_address ?? null
    const region = body?.region ?? 'Metro Manila'
    const paymentMethod = body?.payment_method ?? 'gcash'
    const sessionId = body?.session_id ?? null

    if (!items || items.length === 0) {
      return Response.json({ error: 'Your cart is invalid or empty.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const itemIds = items.map((item) => item.id)

    // 1. SECURE PRICING FETCH
    const { data: cards, error: fetchError } = await supabase
      .from('pokebox')
      .select('id, name, price, stock_quantity, image_url')
      .in('id', itemIds)

    if (fetchError || !cards) {
      return Response.json({ error: 'Unable to verify stock right now.' }, { status: 500 })
    }

    const cardsById = new Map(cards.map((card) => [String(card.id), card]))

    const shippingRates = {
      'Metro Manila': 80,
      'Luzon': 120,
      'Visayas': 150,
      'Mindanao': 180
    }
    const shippingFee = shippingRates[region] || 80

    const itemTotal = items.reduce((sum, item) => {
      const card = cardsById.get(item.key)
      return sum + (Number(card?.price ?? 0) * item.quantity)
    }, 0)

    const total = itemTotal + shippingFee

    // 2. ATOMIC DATABASE LOCK (Status: pending, Payment_Status: unpaid)
    const { data: rpcData, error: rpcError } = await supabase.rpc('checkout_order', {
      p_guest_email: guestEmail,
      p_guest_name: guestName,
      p_guest_phone: guestPhone,
      p_shipping_address: shippingAddress,
      p_total: total,
      p_shipping_fee: shippingFee,
      p_items: items.map(item => ({ id: item.id, quantity: item.quantity })),
      p_session_id: sessionId,
    })

    if (rpcError) {
      return Response.json({ error: rpcError.message || 'Checkout failed due to an inventory error.' }, { status: 409 })
    }

    const { orderId } = rpcData

    // 3. LOW STOCK ALERTS
    const defaultSender = 'onboarding@resend.dev'
    const adminEmail = process.env.ADMIN_EMAIL


    // 4. PAYMONGO SESSION GENERATION
    const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY
    if (!PAYMONGO_SECRET) {
      throw new Error('PayMongo Secret Key is missing.')
    }

    // FIXED: Prioritize the array based on what the user clicked on the frontend
    let pmtTypes = [];
    if (paymentMethod === 'card') {
      pmtTypes = ['card', 'gcash', 'paymaya', 'dob', 'dob_ubp', 'grab_pay'];
    } else if (paymentMethod === 'dob') {
      pmtTypes = ['dob', 'dob_ubp', 'gcash', 'paymaya', 'card', 'grab_pay'];
    } else {
      pmtTypes = ['gcash', 'paymaya', 'card', 'dob', 'dob_ubp', 'grab_pay'];
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Format for PayMongo (requires amounts in centavos)
    const lineItems = items.map(item => {
      const card = cardsById.get(String(item.id))
      const imageUrl = card?.image_url

      return {
        currency: 'PHP',
        amount: Math.round(Number(card?.price ?? 0) * 100),
        description: card?.name,
        name: card?.name,
        quantity: item.quantity,
        images: imageUrl ? [imageUrl.startsWith('http') ? imageUrl : `${origin}${imageUrl}`] : []
      }
    })

    // FIXED: Removed the images array so PayMongo defaults to the grey "S" box
    lineItems.push({
      currency: 'PHP',
      amount: Math.round(shippingFee * 100),
      description: `Shipping to ${region}`,
      name: 'Shipping Fee',
      quantity: 1,
      // Using a Pokéball icon instead of the 'S' placeholder to maintain the theme
      images: ['https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png']
    })

    const paymongoOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(PAYMONGO_SECRET).toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            line_items: lineItems,
            payment_method_types: pmtTypes,
            reference_number: String(orderId),
            success_url: `${origin}/checkout/success?order=${orderId}`,
            cancel_url: `${origin}/checkout`,
            billing: {
              name: guestName,
              email: guestEmail,
              phone: guestPhone,
              address: { line1: shippingAddress, state: region, country: 'PH' }
            }
          }
        }
      })
    }

    const paymongoRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', paymongoOptions)
    const paymongoData = await paymongoRes.json()

    if (!paymongoRes.ok || !paymongoData.data?.attributes?.checkout_url) {
      console.error('PayMongo Error:', paymongoData)
      throw new Error('Payment gateway is currently unavailable. Please try again.')
    }

    // 5. HANDOFF TO FRONTEND
    return Response.json({
      message: 'Order created, redirecting to payment...',
      orderId: orderId,
      checkout_url: paymongoData.data.attributes.checkout_url
    })

  } catch (error) {
    console.error('Checkout request failed.', error)
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid checkout payload.' }, { status: 400 })
    }
    return Response.json({ error: error instanceof Error ? error.message : 'Invalid checkout request.' }, { status: 500 })
  }
}