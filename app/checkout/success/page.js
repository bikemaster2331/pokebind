'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()


  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4"></div>
        <h1 className="text-xl font-semibold mb-2">Order placed!</h1>
        <p className="text-sm text-gray-500 mb-1">Your order has been received.</p>

        <button
          onClick={() => router.push('/')}
          className="bg-yellow-400 text-black font-medium px-6 py-2.5 rounded-xl hover:bg-yellow-500 text-sm"
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