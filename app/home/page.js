'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()

    return (
        /* 1. OVERLAY FIX: Darkened from 0.3 to 0.5 for better depth. Shifting position to center top 20% to move image downward. */
        <main className="min-h-screen bg-[#141414] bg-[linear-gradient(rgba(20,20,20,0.5),rgba(20,20,20,0.5)),url('/assets/images/sss.png')] bg-[length:auto_100%] md:bg-cover bg-[center_top_20%] bg-no-repeat text-[#e0d8c8] flex flex-col select-none">

            {/* Responsive Navbar: Mobile Icons (Static Left) / Desktop Text (Centered) */}
            <nav className="sticky top-0 z-50 bg-[#0C0C0C]/30 backdrop-blur-sm border-b border-white/5 px-6 md:px-8 h-20 flex items-center justify-between shrink-0">
                
                {/* MOBILE ONLY: 3-Icon Set (Absolute Left for Static Placement) */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex md:hidden items-center gap-1">
                    <button
                        className="text-white transition-colors p-2 -ml-2"
                        title="Home"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><path d="M12 18v4"/><path d="m17 18 1.956-11.468"/><path d="m3 8 7.82-5.615a2 2 0 0 1 2.36 0L21 8"/><path d="M4 18h16"/><path d="M7 18 5.044 6.532"/><circle cx="12" cy="10" r="2"/></svg>
                    </button>
                    <button
                        onClick={() => router.push('/shop')}
                        className="text-[#444] hover:text-white transition-colors p-2"
                        title="Shop"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-[#444]"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/></svg>
                    </button>
                    <button
                        onClick={() => router.push('/contact')}
                        className="text-[#444] hover:text-white transition-colors p-2"
                        title="Contact"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-[#444]"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                    </button>
                </div>

                {/* DESKTOP ONLY: Centered Text Links */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
                    <button className="text-xs text-white tracking-widest uppercase transition-colors font-medium cursor-pointer">Home</button>
                    <button onClick={() => router.push('/shop')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Shop</button>
                    <button onClick={() => router.push('/contact')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Contact</button>
                </div>

                <div />
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

            <footer className="border-t border-[#1a1a1a] px-6 md:px-8 py-6 text-center bg-[#0C0C0C]/30 backdrop-blur-sm shrink-0">
                <p className="text-[10px] text-[#333] tracking-widest uppercase select-text">
                    © 2026 PokéVault · Philippines ·{' '}
                    <a
                        href="https://github.com/bikemaster2331"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors cursor-pointer"
                    >
                        mll
                    </a>
                </p>
            </footer>
        </main>
    )
}