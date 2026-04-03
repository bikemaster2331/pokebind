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
        <div className="min-h-screen bg-[#0C0C0C] text-[#e0d8c8] flex flex-col overflow-x-hidden">

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-[#0C0C0C]/30 backdrop-blur-sm border-b border-white/5 px-6 md:px-8 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 md:gap-2">
                    <button
                        onClick={() => router.push('/home')}
                        className="text-[#444] hover:text-[#10b981] transition-colors p-2 -ml-2"
                        title="Home"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 md:w-5 md:h-5 text-[#444]"><path d="M12 18v4"/><path d="m17 18 1.956-11.468"/><path d="m3 8 7.82-5.615a2 2 0 0 1 2.36 0L21 8"/><path d="M4 18h16"/><path d="M7 18 5.044 6.532"/><circle cx="12" cy="10" r="2"/></svg>
                    </button>
                    <button
                        onClick={() => router.push('/shop')}
                        className="text-[#444] hover:text-[#10b981] transition-colors p-2"
                        title="Shop"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 md:w-5 md:h-5 text-[#444]"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/></svg>
                    </button>
                    <button
                        className="text-white transition-colors p-2"
                        title="Contact"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 md:w-5 md:h-5"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                    </button>
                </div>
                {/* Right Area: Empty for minimalism, matching storefront */}
                <div />
            </nav>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center px-6 py-4 md:py-20 relative overflow-x-hidden">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-full h-[500px] bg-[#10b981] opacity-[0.03] blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-xl bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 md:p-12 shadow-2xl">

                    <div className="text-center mb-4 md:mb-10">
                        <h1 className="font-display text-xl md:text-4xl text-white font-bold mb-1.5">Reach the Vault</h1>
                        <p className="text-[9px] md:text-xs text-[#666] uppercase tracking-widest">Questions about an order? Let us know.</p>
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

                    <form className="space-y-3 md:space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                            <div>
                                <label className="block text-[9px] font-bold text-[#666] uppercase tracking-widest mb-1">Trainer Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 text-xs md:text-sm outline-none focus:border-[#10b981] transition-colors"
                                    placeholder="Ash Ketchum"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-[#666] uppercase tracking-widest mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 text-xs md:text-sm outline-none focus:border-[#10b981] transition-colors"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-bold text-[#666] uppercase tracking-widest mb-1">Subject</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 text-xs md:text-sm outline-none focus:border-[#10b981] transition-colors"
                                placeholder="Order Inquiry / Restock Request"
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-bold text-[#666] uppercase tracking-widest mb-1">Message *</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="3"
                                className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 text-xs md:text-sm outline-none focus:border-[#10b981] transition-colors resize-none md:rows-5"
                                placeholder="How can we help?"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#10b981] text-[#0C0C0C] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-[#059669] transition-colors text-[10px] md:text-xs mt-1 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Transmission'}
                        </button>
                    </form>

                    {/* Direct Email Fallback */}
                    <div className="mt-4 md:mt-10 pt-4 md:pt-8 border-t border-[#1a1a1a] text-center">
                        <p className="text-[9px] text-[#666] uppercase tracking-widest mb-1">Direct Line</p>
                        <a
                            href="mailto:[EMAIL_ADDRESS]"
                            className="text-xs md:text-sm font-bold text-white hover:text-[#10b981] transition-colors"
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