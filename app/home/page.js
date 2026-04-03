'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()

    return (
        /* 1. OVERLAY FIX: Darkened from 0.3 to 0.5 for better depth. Shifting position to center top 20% to move image downward. */
        <main className="min-h-screen bg-[#141414] bg-[linear-gradient(rgba(20,20,20,0.5),rgba(20,20,20,0.5)),url('/assets/images/sss.png')] bg-cover bg-[center_top_20%] bg-no-repeat text-[#e0d8c8] flex flex-col select-none">

            {/* 2. NAV BLUR FIX: Changed backdrop-blur-md to backdrop-blur-sm so the image is sharper behind the nav. */}
            <nav className="sticky top-0 z-50 bg-[#0C0C0C]/30 backdrop-blur-sm border-b border-white/5 px-8 h-20 grid grid-cols-3 items-center">
                <div />
                <div className="hidden md:flex items-center justify-center gap-10">
                    <button className="text-xs text-white tracking-widest uppercase transition-colors font-medium cursor-pointer">Home</button>
                    <button onClick={() => router.push('/')} className="text-xs text-[#888] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Shop</button>
                    <button onClick={() => router.push('/contact')} className="text-xs text-[#888] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Contact</button>
                </div>
                <div />
            </nav>

            <div className="flex-1 w-full max-w-[1800px] mx-auto px-12 pt-10 pb-20 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 flex-1 h-full">

                    {/* Left Column: Headline */}
                    <div className="flex flex-col justify-start items-start text-left">
                        <h1 className="font-display text-7xl md:text-[12rem] lg:text-[12rem] text-[#e0d8c8] font-bold tracking-tighter mb-4 whitespace-nowrap drop-shadow-2xl leading-[0.8] select-text">
                            PokéVault
                        </h1>
                    </div>

                    {/* Right Column: CTA & Description */}
                    <div className="flex flex-col justify-end items-center md:items-end text-center md:text-right pb-10">
                        <div className="max-w-[320px] flex flex-col items-center md:items-end">
                            <p className="text-[12px] text-[#e0d8c8]/60 tracking-[0.3em] uppercase mb-4 drop-shadow-md font-medium select-text">
                                Pokémon packs for trainers
                            </p>
                            <p className="text-md text-[#e0d8c8]/90 mb-4 leading-relaxed drop-shadow-md select-text">
                                Authenticated Pokémon booster packs and bundles, shipped across the Philippines.
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="bg-[#10b981] text-[#0C0C0C] text-sm font-bold uppercase tracking-widest px-20 py-4 rounded-xl hover:bg-[#059669] transition-all cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                            >
                                Browse packs
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. FOOTER BLUR FIX: Softened the blur here as well. */}
            <footer className="border-t border-white/5 px-8 py-6 text-center bg-[#0C0C0C]/30 backdrop-blur-sm">
                <p className="text-[10px] text-[#666] tracking-widest uppercase select-text">
                    © 2026 PokéVault · Philippines
                </p>
            </footer>
        </main>
    )
}