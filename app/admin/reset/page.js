'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '../../browser'

export default function ResetPassword() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const supabase = createSupabaseBrowser()

        // 1. Check if the URL has an error (like an expired link)
        const hash = window.location.hash
        if (hash && hash.includes('error_description')) {
            const params = new URLSearchParams(hash.substring(1))
            const errMsg = params.get('error_description')?.replace(/\+/g, ' ') || 'Invalid reset link'
            setError(errMsg)
            setReady(true)
        }

        // 2. Listen for auth events, handling more than just PASSWORD_RECOVERY
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Supabase event:", event, "Session:", !!session)
            
            if (event === 'PASSWORD_RECOVERY') {
                setReady(true)
            } else if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
                // If they are successfully logged in from the link, show the form
                setReady(true)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function handleSubmit(e) {
        e.preventDefault()
        if (password !== confirm) {
            setError('Passwords do not match.')
            return
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        setIsLoading(true)
        setError('')

        const supabase = createSupabaseBrowser()
        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            setError('Failed to update password. Please try again.')
            setIsLoading(false)
            return
        }

        router.push('/admin/login')
    }

    if (!ready) {
        return (
            <main className="min-h-screen bg-[#0C0C0C] flex items-center justify-center">
                <p className="text-[#444] text-sm">Verifying reset link...</p>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#0C0C0C] flex items-center justify-center px-6">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8 w-full max-w-sm">
                <div className="mb-6">
                    <h1 className="font-display text-xl text-[#C9A844]">New password</h1>
                    <p className="text-xs text-[#444] mt-1 tracking-widest uppercase">PokeVault Admin</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-1.5">
                            New password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full bg-[#161616] border border-[#2a2a2a] text-[#e0d8c8] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C9A844] transition-colors placeholder-[#333]"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-1.5">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            placeholder="••••••••"
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
                        {isLoading ? 'Updating...' : 'Update password'}
                    </button>
                </form>
            </div>
        </main>
    )
}