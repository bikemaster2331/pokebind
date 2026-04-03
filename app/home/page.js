'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()

    return (
        /* 1. OVERLAY FIX: Darkened from 0.3 to 0.5 for better depth. Shifting position to center top 20% to move image downward. */
        <main className="min-h-screen bg-[#141414] bg-[linear-gradient(rgba(20,20,20,0.5),rgba(20,20,20,0.5)),url('/assets/images/sss.png')] bg-[length:auto_100%] md:bg-cover bg-[center_top_20%] bg-no-repeat text-[#e0d8c8] flex flex-col select-none">

            <nav className="sticky top-0 z-50 bg-[#0C0C0C]/30 backdrop-blur-sm border-b border-white/5 px-6 md:px-8 h-20 flex items-center justify-center shrink-0">
                <div className="flex items-center gap-8 md:gap-10">
                    <button className="text-xs text-white tracking-widest uppercase transition-colors font-medium cursor-pointer">Home</button>
                    <button onClick={() => router.push('/shop')} className="text-xs text-[#888] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Shop</button>
                    <button onClick={() => router.push('/contact')} className="text-xs text-[#888] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Contact</button>
                </div>
            </nav>

            <div className="flex-1 w-full max-w-[1800px] mx-auto px-6 md:px-12 flex flex-col h-full">
                <div className="flex flex-col justify-between flex-1 py-10 md:py-0 md:grid md:grid-cols-2 md:gap-20 h-full">

                    {/* TOP SECTION: Title - Centered on Mobile */}
                    <div className="w-full flex justify-center md:justify-start items-start pt-6 md:pt-10">
                        <h1 className="font-display text-6xl md:text-[12rem] lg:text-[12rem] text-[#e0d8c8] font-bold tracking-tighter text-center md:text-left drop-shadow-2xl leading-[0.9] select-text">
                            PokéVault
                        </h1>
                    </div>

                    {/* BOTTOM SECTION: CTA - Centered on Mobile */}
                    <div className="w-full flex flex-col justify-end items-center md:items-end pb-10 md:pb-10 mt-auto md:mt-0">
                        <div className="max-w-[320px] flex flex-col items-center md:items-end w-full">
                            <p className="text-[10px] md:text-[12px] text-[#e0d8c8]/60 tracking-[0.3em] uppercase mb-4 drop-shadow-md font-medium select-text text-center md:text-right">
                                Pokémon packs for trainers
                            </p>
                            <p className="text-sm md:text-md text-[#e0d8c8]/90 mb-8 md:mb-4 leading-relaxed drop-shadow-md select-text text-center md:text-right">
                                Authenticated Pokémon booster packs and bundles, shipped across the Philippines.
                            </p>
                            <button
                                onClick={() => router.push('/shop')}
                                className="w-full max-w-[280px] md:max-w-none md:w-auto bg-[#10b981] text-[#0C0C0C] text-xs md:text-sm font-bold uppercase tracking-widest py-4 md:px-20 rounded-xl hover:bg-[#059669] transition-all cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                            >
                                Browse packs
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <footer className="border-t border-white/5 px-6 md:px-8 py-6 text-center bg-[#0C0C0C]/30 backdrop-blur-sm shrink-0">
                <p className="text-[10px] text-[#666] tracking-widest uppercase select-text">
                    © 2026 PokéVault · Philippines
                </p>
            </footer>
        </main>
    )
}