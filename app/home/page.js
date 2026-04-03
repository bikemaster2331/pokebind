'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()

    return (
        <main className="min-h-screen bg-[#141414] text-[#e0d8c8] flex flex-col">
            <nav className="sticky top-0 z-10 bg-[#141414] border-b border-[#1a1a1a] px-8 h-20 grid grid-cols-3 items-center">
                <div />
                <div className="hidden md:flex items-center justify-center gap-10">
                    <button className="text-xs text-white tracking-widest uppercase transition-colors font-medium cursor-pointer">Home</button>
                    <button onClick={() => router.push('/')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Shop</button>
                    <button onClick={() => router.push('/contact')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Contact</button>
                </div>
                <div />
            </nav>

            <div className="flex-1 w-full max-w-[1800px] mx-auto px-12 py-20 flex flex-col">
                <div className="grid grid-cols-2 gap-20 flex-1">
                    {/* Left Column: Headline */}
                    <div className="flex flex-col justify-start text-left">
                        <h1 className="font-display text-8xl md:text-9xl text-[#e0d8c8] font-bold leading-tight mb-4 whitespace-nowrap">
                            PokéVault
                        </h1>
                    </div>

                    {/* Right Column: CTA & Description */}
                    <div className="flex flex-col justify-end items-end text-right">
                        <div className="max-w-md">
                            <p className="text-sm text-[#444] tracking-widest uppercase mb-4">
                                Pokémon packs for trainers
                            </p>
                            <p className="text-xs text-[#333] mb-12 leading-relaxed">
                                Authenticated Pokémon booster packs and bundles, shipped across the Philippines.
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="bg-[#10b981] text-[#141414] text-xs font-bold uppercase tracking-widest px-12 py-5 rounded-xl hover:bg-[#059669] transition-all cursor-pointer shadow-2xl shadow-[#10b981]/10"
                            >
                                Browse packs
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="border-t border-[#1a1a1a] px-8 py-6 text-center">
                <p className="text-[10px] text-[#333] tracking-widest uppercase">
                    © 2026 PokéVault · Philippines
                </p>
            </footer>
        </main>
    )
}