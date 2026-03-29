'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '../browser'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
})

function formatCurrency(value) {
    return currencyFormatter.format(Number(value || 0))
}

function formatDate(value) {
    return new Date(value).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export default function AdminDashboard({ cards, orders, orderItems, user }) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('orders')
    const [isSigningOut, setIsSigningOut] = useState(false)

    async function handleSignOut() {
        setIsSigningOut(true)
        const supabase = createSupabaseBrowser()
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold">PokeVault</h1>
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded">
                            Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{user.email}</span>
                        <button
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="text-sm text-red-600 hover:text-red-700"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-sm text-gray-500">Total cards</p>
                        <p className="text-2xl font-semibold mt-1">{cards.length}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-sm text-gray-500">Total orders</p>
                        <p className="text-2xl font-semibold mt-1">{orders.length}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-sm text-gray-500">Revenue</p>
                        <p className="text-2xl font-semibold mt-1">
                            {formatCurrency(orders.reduce((sum, o) => sum + (o.total ?? 0), 0))}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    {['orders', 'cards', 'add card'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${activeTab === tab
                                    ? 'bg-yellow-400 text-black'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'orders' && (
                    <OrdersTab orders={orders} orderItems={orderItems} cards={cards} router={router} />
                )}
                {activeTab === 'cards' && (
                    <CardsTab cards={cards} router={router} />
                )}
                {activeTab === 'add card' && (
                    <AddCardTab router={router} />
                )}
            </div>
        </main>
    )
}

function OrdersTab({ orders, orderItems, cards, router }) {
    const [updatingId, setUpdatingId] = useState(null)

    async function markAsShipped(orderId) {
        setUpdatingId(orderId)
        await fetch('/api/admin/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: orderId, status: 'shipped' }),
        })
        router.refresh()
        setUpdatingId(null)
    }

    if (orders.length === 0) {
        return <p className="text-sm text-gray-400">No orders yet.</p>
    }

    return (
        <div className="space-y-3">
            {orders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium">Order #{order.id}</p>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.status === 'shipped'
                                        ? 'bg-green-100 text-green-700'
                                        : order.status === 'paid'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{order.guest_name} · {order.guest_email}</p>
                            <p className="text-xs text-gray-400 mt-1">{order.shipping_address}</p>
                            <p className="text-xs text-gray-400 mb-2">{formatDate(order.created_at)}</p>

                            <div className="border-t border-gray-100 pt-2 space-y-1">
                                {orderItems
                                    .filter((item) => item.order_id === order.id)
                                    .map((item) => {
                                        const card = cards.find((c) => String(c.id) === String(item.card_id))
                                        return (
                                            <div key={item.id} className="flex justify-between text-xs text-gray-500">
                                                <span>{card?.name ?? 'Unknown card'} x{item.quantity}</span>
                                                <span>₱{(item.unit_price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                            {order.status !== 'shipped' && (
                                <button
                                    onClick={() => markAsShipped(order.id)}
                                    disabled={updatingId === order.id}
                                    className="mt-2 text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:bg-gray-300"
                                >
                                    {updatingId === order.id ? 'Updating...' : 'Mark as shipped'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function CardsTab({ cards, router }) {
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [isSaving, setIsSaving] = useState(false)

    function startEdit(card) {
        setEditingId(card.id)
        setEditForm({
            name: card.name,
            price: card.price,
            stock_quantity: card.stock_quantity,
            set_name: card.set_name,
            rarity: card.rarity,
            condition: card.condition,
        })
    }

    async function saveEdit(cardId) {
        setIsSaving(true)
        await fetch('/api/admin/cards', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cardId, ...editForm }),
        })
        setEditingId(null)
        setIsSaving(false)
        router.refresh()
    }

    return (
        <div className="space-y-3">
            {cards.map((card) => (
                <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    {editingId === card.id ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Name', key: 'name', type: 'text' },
                                { label: 'Set', key: 'set_name', type: 'text' },
                                { label: 'Rarity', key: 'rarity', type: 'text' },
                                { label: 'Condition', key: 'condition', type: 'text' },
                                { label: 'Price (₱)', key: 'price', type: 'number' },
                                { label: 'Stock', key: 'stock_quantity', type: 'number' },
                            ].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                                    <input
                                        type={type}
                                        value={editForm[key] ?? ''}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                        className="w-full border border-gray-300 text-black rounded-lg px-3 py-1.5 text-sm outline-none focus:border-black"
                                    />
                                </div>
                            ))}
                            <div className="col-span-2 flex gap-2 mt-1">
                                <button
                                    onClick={() => saveEdit(card.id)}
                                    disabled={isSaving}
                                    className="bg-yellow-400 text-black text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-yellow-500 disabled:bg-gray-200"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="border border-gray-200 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium">{card.name}</p>
                                <p className="text-xs text-gray-500">{card.set_name} · {card.rarity} · {card.condition}</p>
                                <div className="flex gap-3 mt-1">
                                    <p className="text-xs text-gray-600">{formatCurrency(card.price)}</p>
                                    <p className={`text-xs font-medium ${card.stock_quantity <= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                                        Stock: {card.stock_quantity}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => startEdit(card)}
                                className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

function AddCardTab({ router }) {
    const [form, setForm] = useState({
        name: '',
        set_name: '',
        type: '',
        rarity: '',
        condition: '',
        price: '',
        stock_quantity: '',
        image_url: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setIsSubmitting(true)
        setSuccess(false)

        await fetch('/api/admin/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })

        setForm({
            name: '', set_name: '', type: '', rarity: '',
            condition: '', price: '', stock_quantity: '', image_url: '',
        })
        setSuccess(true)
        setIsSubmitting(false)
        router.refresh()
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
            <h2 className="text-base font-semibold mb-4">Add new card</h2>
            {success && (
                <p className="text-sm text-green-600 mb-4">Card added successfully!</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                {[
                    { label: 'Card name', key: 'name', type: 'text', required: true, placeholder: 'Charizard ex' },
                    { label: 'Set name', key: 'set_name', type: 'text', required: true, placeholder: 'Scarlet & Violet' },
                    { label: 'Type', key: 'type', type: 'text', required: false, placeholder: 'Fire' },
                    { label: 'Rarity', key: 'rarity', type: 'text', required: true, placeholder: 'Holo Rare' },
                    { label: 'Condition', key: 'condition', type: 'text', required: true, placeholder: 'NM' },
                    { label: 'Price (₱)', key: 'price', type: 'number', required: true, placeholder: '2800' },
                    { label: 'Stock quantity', key: 'stock_quantity', type: 'number', required: true, placeholder: '5' },
                    { label: 'Image URL', key: 'image_url', type: 'text', required: false, placeholder: 'https://...' },
                ].map(({ label, key, type, required, placeholder }) => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {label} {required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type={type}
                            value={form[key] ?? ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                            required={required}
                            placeholder={placeholder}
                            className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                        />
                    </div>
                ))}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-yellow-400 text-black font-semibold py-2.5 rounded-xl hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-500 text-sm"
                >
                    {isSubmitting ? 'Adding...' : 'Add card'}
                </button>
            </form>
        </div>
    )
}