'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
    const router = useRouter()

    // State to hold form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    // State for button loading and success message
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState(null) // 'success' or 'error'

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setStatus(null)

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error('Failed to send')

            setStatus('success')
            setFormData({ name: '', email: '', subject: '', message: '' }) // Clear form
        } catch (error) {
            setStatus('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0C0C0C] text-[#e0d8c8] flex flex-col">

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-[#0C0C0C]/30 backdrop-blur-sm border-b border-white/5 px-6 md:px-8 h-20 flex items-center justify-center shrink-0">
                <div className="flex items-center gap-8 md:gap-10">
                    <button onClick={() => router.push('/home')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Home</button>
                    <button onClick={() => router.push('/shop')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Shop</button>
                    <button className="text-xs text-white tracking-widest uppercase transition-colors font-medium cursor-pointer">Contact</button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center px-6 py-12 md:py-20 relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#10b981] opacity-[0.03] blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-xl bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 md:p-12 shadow-2xl">

                    <div className="text-center mb-10">
                        <h1 className="font-display text-3xl md:text-4xl text-white font-bold mb-2">Reach the Vault</h1>
                        <p className="text-[10px] md:text-xs text-[#666] uppercase tracking-widest">Questions about an order? Let us know.</p>
                    </div>

                    {status === 'success' && (
                        <div className="mb-6 p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg text-center">
                            <p className="text-[#10b981] text-xs font-bold tracking-widest uppercase">Transmission Sent Successfully</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                            <p className="text-red-500 text-xs font-bold tracking-widest uppercase">Failed to send. Please try again.</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2">Trainer Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-[#10b981] transition-colors"
                                    placeholder="Ash Ketchum"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-[#10b981] transition-colors"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2">Subject</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-[#10b981] transition-colors"
                                placeholder="Order Inquiry / Restock Request"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2">Message *</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="5"
                                className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-[#10b981] transition-colors resize-none"
                                placeholder="How can we help?"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#10b981] text-[#0C0C0C] font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-[#059669] transition-colors text-xs mt-2 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Transmission'}
                        </button>
                    </form>

                    {/* Direct Email Fallback */}
                    <div className="mt-10 pt-8 border-t border-[#1a1a1a] text-center">
                        <p className="text-[10px] text-[#666] uppercase tracking-widest mb-1.5">Direct Line</p>
                        <a
                            href="mailto:[EMAIL_ADDRESS]"
                            className="text-sm font-bold text-white hover:text-[#10b981] transition-colors"
                        >
                            [EMAIL_ADDRESS]
                        </a>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#1a1a1a] px-8 py-6 text-center">
                <p className="text-[10px] text-[#333] tracking-widest uppercase">
                    © 2026 PokéVault · Philippines ·{' '}
                    <a
                        href="https://github.com/bikemaster2331"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#fff] transition-colors cursor-pointer"
                    >
                        mll
                    </a>
                </p>
            </footer>
        </div>
    )
}