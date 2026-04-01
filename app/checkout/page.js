'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CART_STORAGE_KEY = 'pokevault-cart'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    shipping_address: '',
  })

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY)
      if (!saved) return

      const parsed = JSON.parse(saved)
      const items = Object.entries(parsed).map(([id, val]) => ({
        id,
        quantity: val.quantity,
        price: val.price,
        name: val.name,
      }))

      setCartItems(items)
    } catch {
      setCartItems([])
    }
  }, [])

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          guest_name: form.guest_name,
          guest_email: form.guest_email,
          guest_phone: form.guest_phone,
          shipping_address: form.shipping_address,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Checkout failed. Please try again.')
      }

      window.localStorage.removeItem(CART_STORAGE_KEY)
      router.push(`/checkout/success?order=${payload.orderId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)
  const shippingFee = 80
  const total = subtotal + shippingFee

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">Checkout</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-base font-semibold mb-4">Your details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trainer name
              </label>
              <input
                type="text"
                name="guest_name"
                value={form.guest_name}
                onChange={handleChange}
                required
                placeholder="Ash Ketchum"
                className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                name="guest_email"
                value={form.guest_email}
                onChange={handleChange}
                required
                placeholder="ash@pokemon.com"
                className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number
              </label>
              <input
                type="tel"
                name="guest_phone"
                value={form.guest_phone}
                onChange={handleChange}
                placeholder="09171234567"
                className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping address
              </label>
              <textarea
                name="shipping_address"
                value={form.shipping_address}
                onChange={handleChange}
                required
                rows={3}
                placeholder="House no., Street, Barangay, City, Province"
                className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 text-sm outline-none focus:border-black resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full bg-[#10b981] text-white font-semibold py-3 rounded-xl hover:bg-[#059669] disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Placing order...' : 'Place order'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-4">Order summary</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            {cartItems.length === 0 ? (
              <p className="text-sm text-gray-400">Your cart is empty.</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name} x{item.quantity}</span>
                  <span className="text-gray-600">{formatCurrency((item.price ?? 0) * item.quantity)}</span>
                </div>
              ))
            )}
            <div className="border-t border-gray-100 pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Shipping</span>
                <span>{formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-black">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}