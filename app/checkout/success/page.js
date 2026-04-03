'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Clear both the cart and any leftover form data
    window.localStorage.removeItem('pokevault-cart')
    window.localStorage.removeItem('pokevault-checkout-form')
    window.localStorage.removeItem('pokevault-checkout-session')
  }, [])


  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white border border-gray-200 rounded-2xl pt-5 pb-8 px-8 max-w-md w-full text-center">
        <div className="text-3xl mb-3">✓</div>
        <h1 className="text-xl font-semibold text-black mb-2">Order placed!</h1>
        <p className="text-sm text-gray-500 mb-6">Your order has been received. We&apos;ll send you a confirmation email shortly.</p>

        <button
          onClick={() => router.push('/')}
          className="bg-[#10b981] text-white font-medium px-6 py-2.5 rounded-xl hover:bg-[#059669] text-sm transition-colors"
        >
          Back to shop
        </button>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}