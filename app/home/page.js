'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()

    return (
        <main className="min-h-screen bg-[#0C0C0C] text-[#e0d8c8] flex flex-col">
            <nav className="sticky top-0 z-10 bg-[#0C0C0C] border-b border-[#1a1a1a] px-8 h-20 grid grid-cols-3 items-center">
                <div />
                <div className="hidden md:flex items-center justify-center gap-10">
                    <button className="text-xs text-white tracking-widest uppercase transition-colors font-medium">Home</button>
                    <button onClick={() => router.push('/')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors">Shop</button>
                    <button onClick={() => router.push('/contact')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors">Contact</button>
                </div>
                <div />
            </nav>

            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
                <p className="text-[10px] text-[#C9A844] tracking-[0.3em] uppercase mb-6">
                    Premium · Philippines
                </p>

                <h1 className="font-display text-8xl md:text-9xl text-[#e0d8c8] font-bold leading-none mb-4">
                    PokéVault
                </h1>

                <p className="text-sm text-[#444] tracking-widest uppercase mb-2">
                    Pokémon packs for trainers
                </p>

                <p className="text-xs text-[#333] max-w-sm mt-3 mb-12 leading-relaxed">
                    Authenticated Pokémon booster packs and bundles, shipped across the Philippines.
                </p>

                <button
                    onClick={() => router.push('/')}
                    className="bg-[#C9A844] text-[#0C0C0C] text-xs font-bold uppercase tracking-widest px-10 py-4 rounded-xl hover:bg-[#b8973a] transition-all"
                >
                    Browse packs
                </button>

                <div className="mt-24 grid grid-cols-3 gap-16 text-center max-w-lg">
                    <div>
                        <p className="font-display text-3xl text-[#C9A844]">100%</p>
                        <p className="text-[10px] text-[#333] tracking-widest uppercase mt-1">Authentic</p>
                    </div>
                    <div>
                        <p className="font-display text-3xl text-[#C9A844]">PH</p>
                        <p className="text-[10px] text-[#333] tracking-widest uppercase mt-1">Nationwide</p>
                    </div>
                    <div>
                        <p className="font-display text-3xl text-[#C9A844]">Fast</p>
                        <p className="text-[10px] text-[#333] tracking-widest uppercase mt-1">Shipping</p>
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