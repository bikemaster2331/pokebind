'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '../../browser'

export default function AdminLogin() {
    const router = useRouter()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const supabase = createSupabaseBrowser()

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
        })

        if (signInError) {
            setError('Invalid email or password.')
            setIsLoading(false)
            return
        }

        if (form.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
            await supabase.auth.signOut()
            setError('You are not authorized to access this page.')
            setIsLoading(false)
            return
        }

        router.push('/admin')
    }

    return (
        <main className="min-h-screen bg-[#0C0C0C] flex items-center justify-center px-6">
            <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-white tracking-tight uppercase">Admin Login</h1>
                    <p className="text-xs text-[#666] mt-1.5 uppercase tracking-widest font-medium">PokeVault Dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2">
                            Email address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="admin@pokevault.ph"
                            className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-[#C9A844] transition-colors placeholder-[#333]"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-[#C9A844] transition-colors placeholder-[#333]"
                        />
                    </div>

                    {error && (
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wide">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#C9A844] text-[#0C0C0C] font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-all mt-2"
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                    
                    <div className='text-center mt-4'>
                        <a
                            href="/admin/forgot"
                            className="text-[10px] text-[#444] hover:text-[#C9A844] font-bold uppercase tracking-widest transition-colors"
                        >
                            Forgot password?
                        </a>
                    </div>
                </form>
            </div>
        </main>

    )
}