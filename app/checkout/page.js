/*
  POKEVAULT - CHECKOUT PAGE COMPONENT
  ---------------------------------
  This component handles the customer checkout process.
  - Collects trainer information (name, email, phone, address).
  - Displays an order summary with subtotal, shipping fee, and total.
  - Submits the order to the backend API (/api/checkout).
  - Redirects to PayMongo secure checkout upon successful stock validation.
*/

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CART_STORAGE_KEY = 'pokevault-cart'
const TRAINER_STORAGE_KEY = 'pokevault-checkout-form' // User-requested storage key
const SESSION_KEY = 'pokevault-checkout-session'

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
  const [isLoaded, setIsLoaded] = useState(false) // ADDED: Flag to track initial load
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('gcash') // ADDED: Track payment method
  const [sessionId, setSessionId] = useState('') // ADDED: Persistent session ID
  const [form, setForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    shipping_address: '',
    region: 'Metro Manila', // Default region
  })

  const shippingRates = {
    'Metro Manila': 80,
    'Luzon': 120,
    'Visayas': 150,
    'Mindanao': 180
  }

  useEffect(() => {
    try {
      // --- Handle Cart ---
      const saved = window.localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const items = Object.entries(parsed).map(([id, val]) => ({
          id,
          quantity: val.quantity,
          price: val.price,
          name: val.name,
        }))
        setCartItems(items)
      }

      // --- Handle Session ID ---
      // Check if they already have an active checkout session
      let activeSession = window.localStorage.getItem(SESSION_KEY)
      if (!activeSession) {
        // Generate a random ID if this is their first time clicking checkout
        activeSession = 'sess_' + Math.random().toString(36).substr(2, 9)
        window.localStorage.setItem(SESSION_KEY, activeSession)
      }
      setSessionId(activeSession)

    } catch (e) {
      console.error('Initial load error', e)
      setCartItems([])
    }
  }, [])
  // Load trainer details from localStorage on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TRAINER_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // If it's the old format (object with form and paymentMethod), migrate. Otherwise use as is.
        const savedForm = parsed.form || parsed
        const savedMethod = parsed.paymentMethod
        
        if (savedForm) setForm(prev => ({ ...prev, ...savedForm }))
        if (savedMethod) setPaymentMethod(savedMethod)
      }
    } catch (e) {
      console.error('Error loading trainer details:', e)
    } finally {
      setIsLoaded(true) // Flag that initial load is done
    }
  }, [])

  // Save trainer details to localStorage on change
  useEffect(() => {
    if (!isLoaded) return // Don't wipe storage on initial empty mount!
    if (!form.guest_name && !form.guest_email) return // Don't save if form is basically empty
    
    try {
      // Save form and paymentMethod so both persist
      window.localStorage.setItem(TRAINER_STORAGE_KEY, JSON.stringify({ form, paymentMethod }))
    } catch (e) {
      console.error('Error saving trainer details:', e)
    }
  }, [form, paymentMethod, isLoaded])

  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'guest_phone') {
      const sanitizedValue = value.replace(/[^0-9+]/g, '')
      setForm((prev) => ({ ...prev, [name]: sanitizedValue }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
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
          region: form.region,
          payment_method: paymentMethod,
          session_id: sessionId,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Checkout failed. Please try again.')
      }

      if (payload.checkout_url) {
        window.location.replace(payload.checkout_url)
      } else {
        router.push(`/checkout/success?order=${payload.orderId}`)
      }

    } catch (err) {
      setError(err.message)
      setIsSubmitting(false) // Only stop submitting if there's an error. If successful, keep it disabled while redirecting.
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)
  const shippingFee = shippingRates[form.region] || 80
  const total = subtotal + shippingFee

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
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

            <div className="grid grid-cols-2 gap-4">
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
                  Region
                </label>
                <div className="relative group">
                  <select
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    required
                    className="w-full appearance-none border border-gray-300 text-black rounded-lg px-3 py-2 text-sm outline-none focus:border-black bg-white cursor-pointer pr-10 transition-all font-medium"
                  >
                    {Object.keys(shippingRates).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
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

            {/* ADDED: Payment Method Selector */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('gcash')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMethod === 'gcash'
                      ? 'border-[#10b981] bg-[#10b981]/10 text-black shadow-sm'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-center">E-Wallet</span>
                  <span className="text-[10px] mt-0.5 opacity-70 text-center">GCash / Maya</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMethod === 'card'
                      ? 'border-[#10b981] bg-[#10b981]/10 text-black shadow-sm'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-center">Card</span>
                  <span className="text-[10px] mt-0.5 opacity-70 text-center">Visa / Mastercard</span>
                </button>

                {/* Online Banking Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('dob')} // dob = Direct Online Banking
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMethod === 'dob' 
                    ? 'border-[#10b981] bg-[#10b981]/10 text-black shadow-sm' 
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-center">Bank</span>
                  <span className="text-[10px] mt-0.5 opacity-70 text-center">BPI / UnionBank</span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full bg-[#10b981] text-white font-semibold py-3 rounded-xl hover:bg-[#059669] disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isSubmitting ? 'Processing securely...' : 'Proceed to Payment'}
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
                <span>Shipping ({form.region})</span>
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