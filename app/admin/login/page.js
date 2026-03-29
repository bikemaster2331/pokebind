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
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm">
                <div className="mb-6">
                    <h1 className="text-lg font-semibold">Admin login</h1>
                    <p className="text-sm text-gray-500 mt-1">PokeVault dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="admin@email.com"
                            className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-yellow-400 text-black font-semibold py-2.5 rounded-xl hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed text-sm"
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </div>
        </main>
    )
}