'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '../../browser'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const supabase = createSupabaseBrowser()

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/admin/reset`,
        })

        if (resetError) {
            setError('Something went wrong. Please try again.')
            setIsLoading(false)
            return
        }

        setSent(true)
        setIsLoading(false)
    }

    return (
        <main className="min-h-screen bg-[#0C0C0C] flex items-center justify-center px-6">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8 w-full max-w-sm">
                <div className="mb-6">
                    <h1 className="font-display text-xl text-[#C9A844]">Reset password</h1>
                    <p className="text-xs text-[#444] mt-1 tracking-widest uppercase">PokeVault Admin</p>
                </div>

                {sent ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-[#e0d8c8] mb-2">Check your email!</p>
                        <p className="text-xs text-[#444]">We sent a reset link to {email}</p>

                        <a href="/admin/login"
                        className="block mt-6 text-xs text-[#C9A844] hover:underline"
            >
                        Back to login
                    </a>
          </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-1.5">
                        Email address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="admin@email.com"
                        className="w-full bg-[#161616] border border-[#2a2a2a] text-[#e0d8c8] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C9A844] transition-colors placeholder-[#333]"
                    />
                </div>

                {error && (
                    <p className="text-xs text-red-500">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#C9A844] text-[#0C0C0C] font-bold uppercase tracking-widest py-2.5 rounded-xl hover:bg-[#b8973a] disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-all"
                >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                </button>

                <div className="text-center">

                    <a href="/admin/login"
                    className="text-xs text-[#444] hover:text-[#C9A844] transition-colors"
              >
                    Back to login
                </a>
            </div>
        </form>
    )
}
      </div >
    </main >
  )
}