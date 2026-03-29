import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

export async function sendOrderReceipt({ order, items, cards }) {
  const itemRows = items.map((item) => {
    const card = cards.find((c) => String(c.id) === String(item.card_id))
    const lineTotal = (item.unit_price ?? 0) * item.quantity
    return `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;">
          ${card?.name ?? 'Unknown card'}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; text-align: center;">
          x${item.quantity}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; text-align: right;">
          ${formatCurrency(lineTotal)}
        </td>
      </tr>
    `
  }).join('')

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 4px;">PokeVault</h1>
      <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Order confirmation</p>

      <div style="background: #f9f9f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #666; margin: 0 0 4px;">Hi Trainer!</p>
        <p style="font-size: 14px; margin: 0;">Your order has been received!</p>
      </div>

      <h2 style="font-size: 15px; font-weight: 600; margin-bottom: 12px;">Items ordered</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; font-size: 12px; color: #666; padding-bottom: 8px; border-bottom: 1px solid #eee;">Card</th>
            <th style="text-align: center; font-size: 12px; color: #666; padding-bottom: 8px; border-bottom: 1px solid #eee;">Qty</th>
            <th style="text-align: right; font-size: 12px; color: #666; padding-bottom: 8px; border-bottom: 1px solid #eee;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 4px;">
          <span>Subtotal</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 8px;">
          <span>Shipping</span>
          <span>${formatCurrency(order.shipping_fee)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 600;">
          <span>Total</span>
          <span>${formatCurrency((order.total ?? 0) + (order.shipping_fee ?? 0))}</span>
        </div>
      </div>

      <div style="margin-top: 24px; padding: 16px; background: #f9f9f9; border-radius: 12px;">
        <p style="font-size: 13px; font-weight: 600; margin: 0 0 4px;">Shipping to</p>
        <p style="font-size: 13px; color: #666; margin: 0;">${order.shipping_address}</p>
      </div>

      <p style="font-size: 13px; color: #666; margin-top: 24px;">
        We'll notify you once your order has been shipped. For questions, reply to this email.
      </p>

      <p style="font-size: 12px; color: #aaa; margin-top: 24px;">PokeVault PH · Pokémon card shop</p>
    </div>
  `

  await resend.emails.send({
    from: 'PokeVault <onboarding@resend.dev>',
    to: order.guest_email,
    subject: `Order confirmed — PokeVault`,
    html,
  })
}


export async function sendShippedNotification({ order }) {
    const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 4px;">PokeVault</h1>
      <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Your order is on its way!</p>

      <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #666; margin: 0 0 4px;">Hi Trainer!</p>
        <p style="font-size: 14px; margin: 0;">Your order has been shipped!</p>
      </div>

      <div style="padding: 16px; background: #f9f9f9; border-radius: 12px;">
        <p style="font-size: 13px; font-weight: 600; margin: 0 0 4px;">Shipping to</p>
        <p style="font-size: 13px; color: #666; margin: 0;">${order.shipping_address}</p>
      </div>

      <p style="font-size: 13px; color: #666; margin-top: 24px;">
        Your cards are on their way! For questions, reply to this email.
      </p>

      <p style="font-size: 12px; color: #aaa; margin-top: 24px;">PokeVault PH · Pokémon card shop</p>
    </div>
  `

    await resend.emails.send({
        from: 'PokeVault <onboarding@resend.dev>',
        to: order.guest_email,
        subject: `Your order has been shipped — PokeVault `,
        html,
    })
}
