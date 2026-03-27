'use client'

import { useEffect, useState } from 'react'

const CART_STORAGE_KEY = 'pokevault-cart'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

function sanitizeCart(savedCart, cards) {
  if (!savedCart || typeof savedCart !== 'object') {
    return {}
  }

  const cardLookup = new Map(cards.map((card) => [String(card.id), card]))

  return Object.entries(savedCart).reduce((nextCart, [id, item]) => {
    const card = cardLookup.get(String(id))
    const rawQuantity = Number(item?.quantity ?? item)
    const stock = Number(card?.stock_quantity ?? 0)

    if (!card || !Number.isFinite(rawQuantity) || stock < 1) {
      return nextCart
    }

    const quantity = Math.min(Math.max(rawQuantity, 0), stock)

    if (quantity > 0) {
      nextCart[id] = { quantity }
    }

    return nextCart
  }, {})
}

function CartPanel({
  cartItems,
  itemCount,
  subtotal,
  onAdd,
  onDecrease,
  onRemove,
  onClose,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-black">Your cart</h3>
          <p className="text-sm text-black">
            {itemCount === 0
              ? 'No items yet'
              : `${itemCount} item${itemCount === 1 ? '' : 's'} selected`}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-black hover:bg-gray-50"
          >
            Close
          </button>
        ) : null}
      </div>

      {cartItems.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-black">
          Add a card to start building your order.
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {cartItems.map((item) => {
              const stock = Number(item.stock_quantity ?? 0)

              return (
                <div key={item.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-black">
                        {item.name}
                      </p>
                      <p className="text-xs text-black">
                        {item.set_name} · {item.condition}
                      </p>
                      <p className="text-xs text-black">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => onDecrease(item)}
                        className="px-3 py-1.5 text-sm text-black hover:bg-gray-50"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        -
                      </button>
                      <span className="min-w-10 text-center text-sm font-medium text-black">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAdd(item)}
                        disabled={item.quantity >= stock}
                        className="px-3 py-1.5 text-sm text-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-black/40 disabled:hover:bg-transparent"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-black">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm text-black">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between font-semibold text-black">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-black">
              Shipping and payment fees can be calculated at checkout later.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default function Storefront({ cards }) {
  const [cart, setCart] = useState({})
  const [hasLoadedCart, setHasLoadedCart] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY)

      if (savedCart) {
        setCart(sanitizeCart(JSON.parse(savedCart), cards))
      }
    } catch (error) {
      console.error('Unable to read cart from storage.', error)
    } finally {
      setHasLoadedCart(true)
    }
  }, [cards])

  useEffect(() => {
    if (!hasLoadedCart) {
      return
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch (error) {
      console.error('Unable to save cart to storage.', error)
    }
  }, [cart, hasLoadedCart])

  function updateQuantity(card, nextQuantity) {
    const cardId = String(card.id)
    const stock = Number(card.stock_quantity ?? 0)

    setCart((currentCart) => {
      if (stock < 1 || nextQuantity < 1) {
        const nextCart = { ...currentCart }
        delete nextCart[cardId]
        return nextCart
      }

      return {
        ...currentCart,
        [cardId]: {
          quantity: Math.min(nextQuantity, stock),
        },
      }
    })
  }

  function addToCart(card) {
    const cardId = String(card.id)
    const stock = Number(card.stock_quantity ?? 0)

    if (stock < 1) {
      return
    }

    setCart((currentCart) => {
      const currentQuantity = currentCart[cardId]?.quantity ?? 0

      if (currentQuantity >= stock) {
        return currentCart
      }

      return {
        ...currentCart,
        [cardId]: {
          quantity: currentQuantity + 1,
        },
      }
    })
  }

  const cartItems = cards.reduce((items, card) => {
    const quantity = cart[String(card.id)]?.quantity ?? 0

    if (!quantity) {
      return items
    }

    items.push({
      ...card,
      quantity,
      lineTotal: Number(card.price ?? 0) * quantity,
    })

    return items
  }, [])

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cartItems.reduce((total, item) => total + item.lineTotal, 0)

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      <nav className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-black">PokeVault</h1>
            <span className="rounded bg-yellow-400 px-2 py-0.5 text-xs font-medium text-black">
              PH
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="rounded-lg bg-yellow-400 px-4 py-1.5 text-sm font-medium text-black hover:bg-yellow-500"
          >
            Cart ({itemCount})
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-black">All Cards</h2>
            <p className="text-sm text-black">{cards.length} listings available</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {cards.map((card) => {
              const stock = Number(card.stock_quantity ?? 0)
              const quantityInCart = cart[String(card.id)]?.quantity ?? 0
              const isOutOfStock = stock < 1
              const canAddMore = quantityInCart < stock

              return (
                <div
                  key={card.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300"
                >
                  <div className="flex aspect-[3/4] items-center justify-center bg-gray-100 p-4">
                    {card.image_url ? (
                      // The image host is data-driven, so a plain img keeps this working without extra host config.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-2xl">🃏</p>
                        <p className="mt-1 text-xs text-black">{card.type}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-black">{card.name}</p>
                    <p className="mb-2 text-xs text-black">
                      {card.set_name} · {card.condition}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-black">
                        {formatCurrency(card.price)}
                      </span>
                    </div>

                    {quantityInCart > 0 ? (
                      <div className="mt-3 inline-flex items-center rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(card, quantityInCart - 1)}
                          className="px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-50"
                          aria-label={`Decrease quantity for ${card.name}`}
                        >
                          -
                        </button>
                        <span className="min-w-10 text-center text-sm font-medium text-black">
                          {quantityInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(card)}
                          disabled={!canAddMore}
                          className="px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-black/40 disabled:hover:bg-transparent"
                          aria-label={`Increase quantity for ${card.name}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(card)}
                        disabled={!canAddMore}
                        className="mt-3 rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-medium text-black hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-black/50"
                      >
                        {isOutOfStock ? 'Out of stock' : '+ Add'}
                      </button>
                    )}

                    {!isOutOfStock && stock <= 3 ? (
                      <p className="mt-2 text-xs font-medium text-black">Only {stock} left!</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {isCartOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setIsCartOpen(false)}>
          <div
            className="ml-auto h-full w-full max-w-md bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <CartPanel
              cartItems={cartItems}
              itemCount={itemCount}
              subtotal={subtotal}
              onAdd={addToCart}
              onDecrease={(card) => updateQuantity(card, card.quantity - 1)}
              onRemove={(card) => updateQuantity(card, 0)}
              onClose={() => setIsCartOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </main>
  )
}
