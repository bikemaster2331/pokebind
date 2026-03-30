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
    const stock = Number(card?.stock_quantity ?? 0)
    if (!card || !Number.isFinite(rawQuantity) || stock < 1) return nextCart
    const quantity = Math.min(Math.max(rawQuantity, 0), stock)
    if (quantity > 0) nextCart[id] = { quantity, price: card.price, name: card.name }
    return nextCart
  }, {})
}

// Removed typeEmoji since the "type" column was deleted from Supabase.

function CartPanel({ cartItems, itemCount, subtotal, onAdd, onCheckout, onDecrease, onRemove, onClose, checkoutFeedback, checkoutFeedbackTone }) {
  return (
    <div className="flex flex-col h-full bg-[#0C0C0C]">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e1e]">
        <div>
          <h3 className="font-display text-xl text-[#e0d8c8]">Your cart</h3>
          <p className="text-xs text-[#444] mt-0.5 tracking-widest uppercase">
            {itemCount === 0 ? 'Empty' : `${itemCount} item${itemCount === 1 ? '' : 's'}`}
          </p>
        </div>
        <button onClick={onClose} className="text-[#444] hover:text-[#C9A844] text-xs tracking-widest uppercase transition-colors">
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
              <div key={item.id} className="border border-[#1e1e1e] rounded-xl p-4 bg-[#111]">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[#e0d8c8] text-base truncate">{item.name}</p>
                    <p className="text-xs text-[#444] mt-0.5">{item.set_name}</p>
                    <p className="text-xs text-[#C9A844] mt-1">{formatCurrency(item.price)} each</p>
                  </div>
                  <button onClick={() => onRemove(item)} className="text-xs text-[#333] hover:text-red-500 transition-colors shrink-0">
                    Remove
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="inline-flex items-center border border-[#2a2a2a] rounded-lg overflow-hidden">
                    <button onClick={() => onDecrease(item)} className="px-3 py-1.5 text-sm text-[#666] hover:text-[#C9A844] hover:bg-[#161616] transition-colors">−</button>
                    <span className="min-w-10 text-center text-sm text-[#e0d8c8]">{item.quantity}</span>
                    <button onClick={() => onAdd(item)} disabled={item.quantity >= stock} className="px-3 py-1.5 text-sm text-[#666] hover:text-[#C9A844] hover:bg-[#161616] transition-colors disabled:opacity-20 disabled:cursor-not-allowed">+</button>
                  </div>
                  <p className="font-display text-[#C9A844] text-base">{formatCurrency(item.lineTotal)}</p>
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
            className="w-full bg-[#C9A844] text-[#0C0C0C] font-medium py-3 rounded-xl text-sm tracking-wider hover:bg-[#b8973a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

// Removed RARITIES and CONDITIONS since these columns were deleted from Supabase.

export default function Storefront({ cards }) {
  const router = useRouter()
  const [cart, setCart] = useState({})
  const [hasLoadedCart, setHasLoadedCart] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutFeedback, setCheckoutFeedback] = useState('')
  const [checkoutFeedbackTone, setCheckoutFeedbackTone] = useState('idle')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')

  function updateQuantity(card, nextQuantity) {
    const cardId = String(card.id)
    const stock = Number(card.stock_quantity ?? 0)
    setCheckoutFeedback('')
    setCart((curr) => {
      if (stock < 1 || nextQuantity < 1) {
        const next = { ...curr }
        delete next[cardId]
        return next
      }
      return { ...curr, [cardId]: { quantity: Math.min(nextQuantity, stock), price: card.price, name: card.name } }
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
    setIsCartOpen(true)
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

  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
  else if (sort === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="min-h-screen bg-[#0C0C0C] text-[#e0d8c8]">
      <nav className="sticky top-0 z-10 bg-[#0C0C0C] border-b border-[#1a1a1a] px-6 h-14 grid grid-cols-3 items-center">
        {/* Left Spacer */}
        <div />

        {/* Centered Menu Links */}
        <div className="hidden md:flex items-center justify-center gap-8">
          <button className="text-[10px] text-[#444] hover:text-[#C9A844] tracking-widest uppercase transition-colors">Home</button>
          <button className="text-[10px] text-[#C9A844] tracking-widest uppercase transition-colors font-medium">Shop</button>
          <button className="text-[10px] text-[#444] hover:text-[#C9A844] tracking-widest uppercase transition-colors">Contact</button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-3">
          <input
            type="text"
            placeholder="Search packs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-[#888] placeholder-[#333] outline-none focus:border-[#C9A844] w-48 transition-colors"
          />
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-[#C9A844] text-[#0C0C0C] text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-[#b8973a] transition-colors"
          >
            Cart ({itemCount})
          </button>
        </div>
      </nav>

      <div className="px-6 py-12 border-b border-[#141414] text-center">
        <h1 className="font-display text-8xl text-[#e0d8c8] font-bold tracking-[0.001em] mb-2">
          PokéVault
        </h1>
        <p className="text-[12px] text-[#C9A844] tracking-[0.3em] uppercase">
          pokemon packs for trainers
        </p>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-[#fff] tracking-widest uppercase">{filtered.length} listings</p>
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <button className="text-[10px] text-[#444] hover:text-[#C9A844] tracking-widest uppercase transition-colors">English Packs</button>
              <span className="text-[#1a1a1a] text-[10px]">/</span>
              <button className="text-[10px] text-[#444] hover:text-[#C9A844] tracking-widest uppercase transition-colors">Japanese Packs</button>
              <span className="text-[#1a1a1a] text-[10px]">/</span>
              <button className="text-[10px] text-[#444] hover:text-[#C9A844] tracking-widest uppercase transition-colors">Individual Packs</button>
              <span className="text-[#1a1a1a] text-[10px]">/</span>
              <button className="text-[10px] text-[#444] hover:text-[#C9A844] tracking-widest uppercase transition-colors">Bundles</button>
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-[#111] border border-[#2a2a2a] text-[#555] text-xs rounded-lg px-3 py-1.5 outline-none focus:border-[#C9A844] transition-colors"
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((card) => {
            const stock = Number(card.stock_quantity ?? 0)
            const quantityInCart = cart[String(card.id)]?.quantity ?? 0
            const isOutOfStock = stock < 1
            const canAddMore = quantityInCart < stock

            return (
              <div
                key={card.id}
                className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden hover:border-[#C9A844] transition-colors group"
              >
                <div className="aspect-square flex flex-col items-center justify-center bg-[#161616] relative">
                  {card.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-xs text-[#333]">No Image</span>
                  )}
                </div>

                <div className="p-3">
                  <p className="font-display text-[#e0d8c8] text-base truncate leading-tight">{card.name}</p>
                  <p className="text-[10px] text-[#333] mt-0.5 tracking-wide">{card.set_name}</p>

                  <div className="flex items-center justify-between mt-3">
                    <span className="font-display text-[#C9A844] text-base">{formatCurrency(card.price)}</span>

                    {quantityInCart > 0 ? (
                      <div className="inline-flex items-center border border-[#2a2a2a] rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(card, quantityInCart - 1)}
                          className="px-2 py-1 text-xs text-[#666] hover:text-[#C9A844] transition-colors"
                        >−</button>
                        <span className="min-w-6 text-center text-xs text-[#e0d8c8]">{quantityInCart}</span>
                        <button
                          onClick={() => addToCart(card)}
                          disabled={!canAddMore}
                          className="px-2 py-1 text-xs text-[#666] hover:text-[#C9A844] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        >+</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(card)}
                        disabled={!canAddMore}
                        className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] text-xs px-3 py-1.5 rounded-lg hover:bg-[#C9A844] hover:border-[#C9A844] hover:text-[#0C0C0C] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {isOutOfStock ? 'Sold out' : '+ Add'}
                      </button>
                    )}
                  </div>

                  {!isOutOfStock && stock <= 10 && (
                    <p className="text-[9px] text-[#8B6914] mt-2 tracking-widest uppercase">⬥ Only {stock} left</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#333] text-sm">No packs match your search</p>
            <button onClick={() => setSearch('')} className="text-[#C9A844] text-xs mt-2 hover:underline">
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
    </main>
  )
}