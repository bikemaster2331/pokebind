/*
  POKEVAULT - STOREFRONT COMPONENT
  --------------------------------
  This is the primary shopping interface for the application.
  Features include:
  - Dynamic card listing with search and filtering (language, name, price).
  - Persistent shopping cart (localStorage) with stock validation.
  - Interactive "Trainer Cart" panel with subtotal calculation.
  - Grade-style product presentation with Sold Out states.
*/

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const CART_STORAGE_KEY = 'pokevault-cart'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

function sanitizeCart(savedCart, cards) {
  if (!savedCart || typeof savedCart !== 'object') return {}
  const cardLookup = new Map(cards.map((card) => [String(card.id), card]))
  return Object.entries(savedCart).reduce((nextCart, [id, item]) => {
    const card = cardLookup.get(String(id))
    const rawQuantity = Number(item?.quantity ?? item)
    
    // Check if valid, but DO NOT delete if stock is 0 (they might own the lock)
    if (!card || !Number.isFinite(rawQuantity) || rawQuantity < 1) return nextCart
    
    nextCart[id] = { quantity: rawQuantity, price: card.price, name: card.name }
    return nextCart
  }, {})
}

function CartPanel({ cartItems, itemCount, subtotal, onAdd, onCheckout, onDecrease, onRemove, onClose, checkoutFeedback, checkoutFeedbackTone }) {
  return (
    <div className="flex flex-col h-full bg-[#141414]">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e1e]">
        <div>
          <h3 className="font-display text-xl text-[#e0d8c8]">Trainer cart</h3>
          <p className="text-xs text-[#444] mt-0.5 tracking-widest uppercase">
            {itemCount === 0 ? 'Empty' : `${itemCount} item${itemCount === 1 ? '' : 's'}`}
          </p>
        </div>
        <button onClick={onClose} className="text-[#444] hover:text-white text-xs tracking-widest uppercase transition-colors">
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="border border-dashed border-[#1e1e1e] rounded-xl p-8 text-center mt-8">
            <p className="text-[#333] text-sm">Your cart is empty</p>
            <p className="text-[#222] text-xs mt-1">Add cards to begin</p>
          </div>
        ) : (
          cartItems.map((item) => {
            const stock = Number(item.stock_quantity ?? 0)
            return (
              <div key={item.id} className="cart-item border border-[#1e1e1e] rounded-xl p-4 bg-[#111]">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[#e0d8c8] text-base truncate">{item.name}</p>
                    <p className="text-xs text-[#444] mt-0.5">{item.set_name}</p>
                    <p className="text-xs text-white mt-1 font-medium">{formatCurrency(item.price)} each</p>
                  </div>
                  <button onClick={() => onRemove(item)} className="text-xs text-[#333] hover:text-red-500 transition-colors shrink-0">
                    Remove
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="inline-flex items-center border border-[#2a2a2a] rounded-lg overflow-hidden">
                    <button onClick={() => onDecrease(item)} className="px-3 py-1.5 text-sm text-[#666] hover:text-white hover:bg-[#161616] transition-colors">−</button>
                    <span className="min-w-10 text-center text-sm text-[#e0d8c8]">{item.quantity}</span>
                    <button onClick={() => onAdd(item)} disabled={item.quantity >= stock} className="px-3 py-1.5 text-sm text-[#666] hover:text-white hover:bg-[#161616] transition-colors disabled:opacity-20 disabled:cursor-not-allowed">+</button>
                  </div>
                  <p className="font-display text-lg text-white font-medium">{formatCurrency(item.lineTotal)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="px-6 py-5 border-t border-[#1e1e1e]">
          <div className="flex justify-between text-xs text-[#444] mb-1">
            <span className="tracking-widest uppercase">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-[#333] mb-4">
            <span className="tracking-widest uppercase">Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <button
            onClick={onCheckout}
            disabled={itemCount === 0}
            className="w-full bg-[#10b981] text-[#141414] font-medium py-3 rounded-xl text-sm tracking-wider hover:bg-[#059669] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Proceed to checkout
          </button>
          {checkoutFeedback && (
            <p className={`mt-3 text-xs text-center ${checkoutFeedbackTone === 'error' ? 'text-red-500' : 'text-green-500'}`}>
              {checkoutFeedback}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Storefront({ cards }) {
  const router = useRouter()
  const [cart, setCart] = useState({})
  const [hasLoadedCart, setHasLoadedCart] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutFeedback, setCheckoutFeedback] = useState('')
  const [checkoutFeedbackTone, setCheckoutFeedbackTone] = useState('idle')
  const [search, setSearch] = useState('')
  const [languageFilter, setLanguageFilter] = useState('All')
  const [sort, setSort] = useState('default')
  const [hoveredCard, setHoveredCard] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [selectedCard, setSelectedCard] = useState(null) // State for Modal Popup

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  function updateQuantity(card, nextQuantity) {
    const cardId = String(card.id)
    setCheckoutFeedback('')
    setCart((curr) => {
      if (nextQuantity < 1) {
        const next = { ...curr }
        delete next[cardId]
        return next
      }
      // The '+' button is already disabled if they hit max stock, so we just update
      return { ...curr, [cardId]: { quantity: nextQuantity, price: card.price, name: card.name } }
    })
  }

  function addToCart(card) {
    const cardId = String(card.id)
    const stock = Number(card.stock_quantity ?? 0)
    if (stock < 1) return
    setCheckoutFeedback('')
    setCart((curr) => {
      const currentQty = curr[cardId]?.quantity ?? 0
      if (currentQty >= stock) return curr
      return { ...curr, [cardId]: { quantity: currentQty + 1, price: card.price, name: card.name } }
    })
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY)
      if (saved) setCart(sanitizeCart(JSON.parse(saved), cards))
    } catch (e) {
      console.error(e)
    } finally {
      setHasLoadedCart(true)
    }
  }, [cards])

  useEffect(() => {
    if (!hasLoadedCart) return
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch (e) {
      console.error(e)
    }
  }, [cart, hasLoadedCart])

  async function revalidateStock() {
    try {
      const ids = Object.keys(cart)
      if (ids.length === 0) return

      const response = await fetch(`/api/cards?ids=${ids.join(',')}`)
      const { cards: freshCards } = await response.json()
      if (!freshCards) return

      setCart((currentCart) => {
        const updated = { ...currentCart }
        let changed = false

        freshCards.forEach((freshCard) => {
          const id = String(freshCard.id)
          const inCart = updated[id]
          if (!inCart) return
          const liveStock = Number(freshCard.stock_quantity ?? 0)
          
          // If live stock is greater than 0, but less than what they want, cap it.
          // If live stock is 0, DO NOTHING. We assume they hold the session lock.
          // If another user tries to buy it, the Backend SQL will stop them.
          if (liveStock > 0 && inCart.quantity > liveStock) {
            updated[id] = { ...inCart, quantity: liveStock }
            changed = true
          }
        })

        return changed ? updated : currentCart
      })
    } catch (e) {
      console.error('Stock revalidation failed', e)
    }
  }

  function openCart() {
    revalidateStock()
    setIsCartOpen(true)
  }

  function handleCheckout() {
    if (itemCount === 0) return
    router.push('/checkout')
  }

  const cartItems = cards.reduce((items, card) => {
    const quantity = cart[String(card.id)]?.quantity ?? 0
    if (!quantity) return items
    items.push({ ...card, quantity, lineTotal: Number(card.price ?? 0) * quantity })
    return items
  }, [])

  const itemCount = cartItems.reduce((t, i) => t + i.quantity, 0)
  const subtotal = cartItems.reduce((t, i) => t + i.lineTotal, 0)

  let filtered = cards
    .filter((c) => {
      if (!search) return true
      const s = search.toLowerCase()
      return (
        c.name?.toLowerCase().includes(s) ||
        c.set_name?.toLowerCase().includes(s) ||
        c.pack_type?.toLowerCase().includes(s)
      )
    })
    .filter((c) => {
      if (languageFilter === 'All') return true
      return c.language === languageFilter
    })

  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
  else if (sort === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  // Push sold out items (that AREN'T in cart) to the bottom
  filtered = [...filtered].sort((a, b) => {
    const aQty = cart[String(a.id)]?.quantity ?? 0
    const bQty = cart[String(b.id)]?.quantity ?? 0
    const aOut = (Number(a.stock_quantity ?? 0) < 1 && aQty === 0) ? 1 : 0
    const bOut = (Number(b.stock_quantity ?? 0) < 1 && bQty === 0) ? 1 : 0
    return aOut - bOut
  })

  return (
    <div className="min-h-screen bg-[#141414] text-[#e0d8c8] relative select-none">
      {/* Global Tooltip */}
      {hoveredCard && (
        <div
          className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
          style={{
            left: mousePos.x + 15,
            top: mousePos.y + 15,
            opacity: hoveredCard ? 1 : 0
          }}
        >
          <div className="bg-[#111] border border-[#C9A844]/40 rounded-lg p-2.5 shadow-2xl backdrop-blur-md max-w-[250px]">
            <p className="font-display text-white text-[14px] leading-snug">{hoveredCard.name}</p>
          </div>
        </div>
      )}
      <main className="min-h-screen bg-[#141414] text-[#e0d8c8]">
        <nav className="sticky top-0 z-10 bg-[#141414] border-b border-[#1a1a1a] px-8 h-20 grid grid-cols-3 items-center">
          {/* Left Spacer */}
          <div />

          {/* Centered Menu Links */}
          <div className="hidden md:flex items-center justify-center gap-10">
            <button onClick={() => router.push('/home')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Home</button>
            <button className="text-xs text-white tracking-widest uppercase transition-colors font-medium cursor-pointer">Shop</button>
            <button onClick={() => router.push('/contact')} className="text-xs text-[#444] hover:text-white tracking-widest uppercase transition-colors cursor-pointer">Contact</button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3">
            <div className="relative group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#333] group-focus-within:text-[#10b981] transition-colors"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search packs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#111] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#888] placeholder-[#333] outline-none focus:border-[#10b981] w-64 transition-colors"
              />
            </div>
            <button
              onClick={openCart}
              className="bg-[#10b981] text-[#141414] text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-[#059669] transition-colors"
            >
              Cart ({itemCount})
            </button>
          </div>
        </nav>

        {/* Upgraded Premium Hero Section */}
        {/* 1. Reduced pt-16 (64px) to pt-8 (32px), and pb-20 (80px) to pb-12 (48px) */}
        <div className="relative px-6 pt-32 pb-16 border-b border-[#141414] text-center overflow-hidden flex flex-col items-center justify-center">
          {/* Foreground Content */}
          {/* 2. Reduced mb-6 to mb-2 to pull the subtitle closer */}
          <div className="flex flex-col items-start mb-2">
            <div className="flex items-center gap-6 mb-0">
              {/* 3. ADDED leading-none to kill the massive invisible box around the text */}
              <h1 className="relative z-10 font-display text-[12rem] text-[#e0d8c8] font-bold tracking-[0.001em] drop-shadow-2xl leading-none select-text">
                PokéVault
              </h1>
              {/* Snorlax Overlay - Now Inline */}
              <div className="relative">
                <img
                  src="/assets/images/snore.png"
                  alt=""
                  draggable="false"
                  className="w-72 h-auto z-20 pointer-events-none drop-shadow-2xl translate-y-6"
                />
              </div>
            </div>
            {/* Added a slight negative top margin just in case the font baseline is weird */}
            <p className="text-[16px] text-[#fff] tracking-[0.3em] uppercase ml-3 mt-2 select-text">
              Pokémon packs for trainers
            </p>
          </div>
        </div>
        <div className="w-full flex justify-center py-12">
          <div className="w-full max-w-[1200px] h-px bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent" />
        </div>

        <div className="px-6 md:px-16 lg:px-32 xl:px-40 pt-0 pb-6 max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between mb-12">
            <p className="font-display font-medium text-lg text-[#fff] tracking-widest uppercase">{filtered.length} listings</p>
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLanguageFilter('All')}
                  className={`text-[10px] tracking-widest uppercase transition-colors ${languageFilter === 'All' ? 'text-white font-medium' : 'text-[#444] hover:text-white'}`}
                >All Packs</button>
                <span className="text-[#1a1a1a] text-[10px]">/</span>

                <button
                  onClick={() => setLanguageFilter('EN')}
                  className={`text-[10px] tracking-widest uppercase transition-colors ${languageFilter === 'EN' ? 'text-white font-medium' : 'text-[#444] hover:text-white'}`}
                >English Packs</button>
                <span className="text-[#1a1a1a] text-[10px]">/</span>

                <button
                  onClick={() => setLanguageFilter('JPN')}
                  className={`text-[10px] tracking-widest uppercase transition-colors ${languageFilter === 'JPN' ? 'text-white font-medium' : 'text-[#444] hover:text-white'}`}
                >Japanese Packs</button>
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-[#111] border border-[#2a2a2a] text-[#555] text-xs rounded-lg px-3 py-1.5 outline-none focus:border-[#10b981] transition-colors"
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
                <option value="name">Name: A–Z</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24 xl:gap-x-16 xl:gap-y-32">
            {filtered.map((card) => {
              const stock = Number(card.stock_quantity ?? 0)
              const quantityInCart = cart[String(card.id)]?.quantity ?? 0
              // ONLY show as out of stock if shelf is 0 AND user doesn't already have it
              const isOutOfStock = stock < 1 && quantityInCart === 0
              const canAddMore = quantityInCart < stock

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)} // Opens the modal
                  // 1. ADDED: Inner shadows to create a "thick plastic/cardboard edge" feel and slightly adjusted base bg.
                  className={`store-card bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden transition-all duration-500 flex flex-col relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-4px_10px_rgba(0,0,0,0.6)] ${isOutOfStock
                      ? 'opacity-60 cursor-default'
                      : 'cursor-pointer hover:border-[#fff]/20 hover:scale-[1.02] group hover:shadow-[0_20px_60px_rgba(255,255,255,0.02),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-4px_10px_rgba(0,0,0,0.6)]'
                    }`}
                >
                  {/* 2. ADDED: The tactile noise texture layer. This is pure CSS/SVG math, so it loads instantly. */}
                  <div 
                    className="absolute inset-0 z-0 pointer-events-none opacity-[0.06] mix-blend-screen"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                  />

                  {/* Sold Out Overlay (Kept z-10 so it sits above texture) */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 z-10 bg-[#141414]/60 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#555] border border-[#333] px-4 py-2 rounded-lg bg-[#141414]/80">Sold out</span>
                    </div>
                  )}

                  {/* TAG-Style Slab Label Wrapper */}
                  {/* 3. MODIFIED: Removed bg-[#111] to bg-transparent so the noise texture shows through */}
                  <div className="p-4 pb-0 bg-transparent relative z-10">
                    <div className="store-card-details relative pt-4 pb-1 px-2 grid grid-cols-[1.5fr_1fr] border-1 border-[#2e2e2e] rounded-md bg-black/40 mt-3.5 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm">

                      {/* Top Centered VLT Tag */}
                      <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 bg-[#141414] px-2 rounded-sm">
                        <div className="border-3 border-[#2e2e2e] px-1.5 py-0.1 bg-black/50 backdrop-blur-md">
                          <span className="font-zodiak font-extrabold text-[14px] text-[#e0d8c8] tracking-widest leading-none">VLT</span>
                        </div>
                      </div>

                      {/* Left Column: Product Info */}
                      <div className="flex flex-col justify-between pr-2 mx-2 my-3 flex-1 min-w-0">
                        <div>
                          <div>
                            <p
                              className="font-display font-medium text-white text-[12px] truncate leading-tight pr-1 cursor-help drop-shadow-md select-text"
                              onMouseEnter={() => setHoveredCard(card)}
                              onMouseLeave={() => setHoveredCard(null)}
                              onMouseMove={handleMouseMove}
                            >
                              {card.name}
                            </p>
                          </div>
                          <p className="text-[9px] text-white/50 mt-1 tracking-wide uppercase line-clamp-2 pr-1 select-text">{card.set_name}</p>
                        </div>
                        <div className="text-left mt-2">
                          <p className="font-display text-[#FAFAFA] text-xs font-bold tracking-wide select-text">{formatCurrency(card.price)}</p>
                          {/* Rule 2: Reserved Badge */}
                          {stock === 0 && quantityInCart > 0 ? (
                             <p className="text-[8px] text-[#10b981] mt-1 tracking-widest uppercase font-bold border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 rounded inline-block select-text">Reserved in cart</p>
                          ) : (
                            !isOutOfStock && stock <= 10 && (
                              <p className="text-[9px] text-[#C9A844] mt-1 tracking-widest uppercase truncate font-medium select-text">Only {stock} left</p>
                            )
                          )}
                        </div>
                      </div>

                      {/* Right Column: Grade Number block */}
                      <div className="flex items-stretch justify-end">
                        <div className="flex items-stretch justify-end">
                          <div className="flex items-center justify-center">
                            <span
                              className="font-supreme text-[8px] text-[#888] uppercase font-bold tracking-widest font-display rotate-180"
                              style={{ writingMode: 'vertical-rl' }}
                            >
                              Pkvault
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center pr-0.5 pl-0.5 pb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[#F0B626] p-1 rounded-none drop-shadow-[0_0_8px_rgba(240,182,38,0.3)]">
                              <path d="M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="m12.474 5.943 1.567 5.34a1 1 0 0 0 1.75.328l2.616-3.402" /><path d="m20 9-3 9" /><path d="m5.594 8.209 2.615 3.403a1 1 0 0 0 1.75-.329l1.567-5.34" /><path d="M7 18 4 9" /><circle cx="12" cy="4" r="2" /><circle cx="20" cy="7" r="2" /><circle cx="4" cy="7" r="2" />
                            </svg>
                            <span className="font-supreme text-[#F0B626] text-[8px] font-bold -mt-1 tracking-widest">CARDS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="store-card-image aspect-[3/4] flex flex-col items-center justify-center bg-transparent relative shrink-0 cursor-help z-10"
                    onMouseEnter={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onMouseMove={handleMouseMove}
                  >
                    {card.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img draggable="false" src={card.image_url} alt={card.name} className="w-full h-full object-cover drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
                    ) : (
                      <span className="font-display text-xs text-[#555]">No Image</span>
                    )}
                  </div>

                  {/* 4. MODIFIED: bg-[#111] to bg-transparent so bottom controls blend with textured card */}
                  <div className="store-card-bottom flex flex-col px-4 pt-3 pb-4 flex-grow justify-end bg-transparent z-10">
                    <div className="store-card-controls w-full">
                      {quantityInCart > 0 ? (
                        <div className="flex items-center justify-center border border-[#333] rounded-lg overflow-hidden w-full bg-black/40 h-[44px] backdrop-blur-sm shadow-inner">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(card, quantityInCart - 1); }}
                            className="h-full text-lg text-[#888] hover:text-white transition-colors flex-1 text-center hover:bg-white/10"
                          >−</button>
                          <span className="min-w-8 text-center text-lg text-[#10b981] font-bold">{quantityInCart}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); addToCart(card); }}
                            disabled={!canAddMore}
                            className="h-full text-lg text-[#888] hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex-1 text-center hover:bg-white/10"
                          >+</button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(card); }}
                          disabled={!canAddMore}
                          className="font-display w-full bg-black/40 border border-[#333] text-[#aaa] text-xs h-[44px] rounded-lg hover:bg-[#10b981] hover:border-[#10b981] hover:text-[#0C0C0C] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider font-bold backdrop-blur-sm"
                        >
                          {isOutOfStock ? 'Sold Out' : 'Add to cart'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[#333] text-sm">No packs match your search</p>
              <button onClick={() => setSearch('')} className="text-white text-xs mt-2 hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>

        {isCartOpen && (
          <div className="fixed inset-0 z-50 bg-black/70" onClick={() => setIsCartOpen(false)}>
            <div
              className="ml-auto h-full w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CartPanel
                cartItems={cartItems}
                itemCount={itemCount}
                subtotal={subtotal}
                onAdd={addToCart}
                onCheckout={handleCheckout}
                onDecrease={(card) => updateQuantity(card, card.quantity - 1)}
                onRemove={(card) => updateQuantity(card, 0)}
                onClose={() => setIsCartOpen(false)}
                checkoutFeedback={checkoutFeedback}
                checkoutFeedbackTone={checkoutFeedbackTone}
              />
            </div>
          </div>
        )}

        {/* --- ITEM POPUP MODAL --- */}
        {selectedCard && (
          <div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedCard(null)}
          >
            <div
              className="bg-[#111] border border-[#2a2a2a] rounded-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Side: Big Image */}
              <div className="w-full md:w-1/2 bg-[#141414] p-8 flex items-center justify-center min-h-[300px]">
                {selectedCard.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    draggable="false"
                    src={selectedCard.image_url}
                    alt={selectedCard.name}
                    className="max-h-[500px] w-auto object-contain drop-shadow-2xl"
                  />
                ) : (
                  <span className="font-display text-xs text-[#333]">No Image Available</span>
                )}
              </div>

              {/* Right Side: Details & Actions */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-6 right-6 text-[#666] hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <div className="mb-2">
                  <span className="text-[10px] text-[#fff] font-bold tracking-[0.3em] uppercase border border-[#fff]/30 bg-[#11FF00]/10 px-3 py-1 rounded-full">
                    {selectedCard.language === 'JPN' ? 'Japanese Import' : 'English Edition'}
                  </span>
                </div>

                <h2 className="font-display text-4xl text-white font-bold mt-4 mb-2 select-text">{selectedCard.name}</h2>
                <p className="text-sm text-[#888] uppercase tracking-widest mb-6 select-text">Set: {selectedCard.set_name} · {selectedCard.pack_type}</p>

                <div className="flex items-end gap-4 mb-10 pb-10 border-b border-[#2a2a2a]">
                  <p className="font-display text-4xl text-[#FAFAFA]">{formatCurrency(selectedCard.price)}</p>
                  {/* Modal Rule: Reserved Badge */}
                  {Number(selectedCard.stock_quantity) === 0 && (cart[String(selectedCard.id)]?.quantity ?? 0) > 0 ? (
                     <span className="text-[10px] text-[#10b981] font-bold tracking-[0.3em] uppercase border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 rounded-full mb-1">Reserved in cart</span>
                  ) : (
                    Number(selectedCard.stock_quantity) <= 5 && Number(selectedCard.stock_quantity) > 0 && (
                      <p className="text-xs text-[#C9A844] font-bold tracking-widest uppercase mb-1.5">Only {selectedCard.stock_quantity} left</p>
                    )
                  )}
                </div>

                {/* Add to Cart Action */}
                {Number(selectedCard.stock_quantity) > 0 || (cart[String(selectedCard.id)]?.quantity ?? 0) > 0 ? (
                  <button
                    onClick={() => {
                      if (Number(selectedCard.stock_quantity) > (cart[String(selectedCard.id)]?.quantity ?? 0)) {
                         addToCart(selectedCard);
                      }
                      setSelectedCard(null);
                      openCart();
                    }}
                    disabled={Number(selectedCard.stock_quantity) <= (cart[String(selectedCard.id)]?.quantity ?? 0)}
                    className="w-full bg-[#10b981] text-[#141414] font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-[#059669] transition-all disabled:opacity-40"
                  >
                    {Number(selectedCard.stock_quantity) <= (cart[String(selectedCard.id)]?.quantity ?? 0) ? 'Max in Cart' : 'Add to Cart'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-transparent border border-[#333] text-[#555] font-bold uppercase tracking-widest py-4 rounded-xl cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* --- END POPUP MODAL --- */}

        <footer className="border-t border-[#1a1a1a] px-8 py-6 text-center mt-20">
          <p className="text-[10px] text-[#333] tracking-widest uppercase select-text">
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
      </main>
    </div>
  )
}