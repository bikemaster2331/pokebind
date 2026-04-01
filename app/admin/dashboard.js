'use client'

import React, { useState } from 'react'
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
        <main className="min-h-screen bg-[#0C0C0C] text-[#e0d8c8]">
            <nav className="bg-[#0C0C0C] border-b border-[#1a1a1a] px-6 py-4">
                <div className="max-w-9xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-white tracking-tight uppercase">PokeVault Admin</h1>
                        <span className="bg-[#1a1a1a] text-[#aaa] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-[#2a2a2a]">
                            Dashboard
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#888] font-medium">{user.email}</span>
                        <button
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="text-sm text-white hover:text-red-700"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-24">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 transition-colors hover:border-[#2e2e2e]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Total packs</p>
                        <p className="text-2xl font-bold mt-1 text-white">{cards.length}</p>
                    </div>
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 transition-colors hover:border-[#2e2e2e]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Total orders</p>
                        <p className="text-2xl font-bold mt-1 text-white">{orders.length}</p>
                    </div>
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 transition-colors hover:border-[#2e2e2e]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Revenue</p>
                        <p className="text-2xl font-bold mt-1 text-[#3e9c35]">
                            + {formatCurrency(orders.filter(o => o.status === 'shipped').reduce((sum, o) => sum + (o.total ?? 0), 0))}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    {['orders', 'packs', 'add pack'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-[#C9A844] text-[#0C0C0C]'
                                    : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] hover:bg-[#222] hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'orders' && (
                    <OrdersTab orders={orders} orderItems={orderItems} cards={cards} router={router} />
                )}
                {activeTab === 'packs' && (
                    <CardsTab cards={cards} router={router} />
                )}
                {activeTab === 'add pack' && (
                    <AddCardTab router={router} />
                )}
            </div>
        </main>
    )
}

function OrdersTab({ orders, orderItems, cards, router }) {
    const [updatingId, setUpdatingId] = useState(null)
    const [statusFilter, setStatusFilter] = useState('all')
    const [expandedOrders, setExpandedOrders] = useState(new Set())
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)
    const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(true)

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

    const toggleOrder = (orderId) => {
        const newExpanded = new Set(expandedOrders)
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId)
        } else {
            newExpanded.add(orderId)
        }
        setExpandedOrders(newExpanded)
    }

    // Calendar helpers
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const prevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1))
        setSelectedDate(null)
    }
    const nextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1))
        setSelectedDate(null)
    }

    // Build order count map by day key "YYYY-MM-DD"
    const ordersByDay = {}
    orders.forEach((order) => {
        const d = new Date(order.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (!ordersByDay[key]) ordersByDay[key] = []
        ordersByDay[key].push(order)
    })

    // Filter orders
    let filteredOrders = orders
    if (selectedDate) {
        filteredOrders = ordersByDay[selectedDate] ?? []
    }
    if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter((o) => o.status === statusFilter)
    }

    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Build calendar grid cells
    const calendarCells = []
    for (let i = 0; i < firstDay; i++) calendarCells.push(null)
    for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)

    if (orders.length === 0) {
        return <p className="text-sm text-gray-400">No orders yet.</p>
    }

    return (
        <div className="space-y-4">
            {/* Calendar Header with Toggle */}
            <div className="flex items-center justify-between mb-10">
                <button 
                    onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#aaa] hover:text-white transition-colors"
                >
                    <svg className={`w-3 h-3 transition-transform ${isCalendarCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>{isCalendarCollapsed ? 'Show Calendar View' : 'Hide Calendar View'}</span>
                </button>
            </div>

            {/* Calendar */}
            {!isCalendarCollapsed && (
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-3 mb-4 max-w-sm">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <button onClick={prevMonth} className="text-[#555] hover:text-white transition-colors p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#aaa]">{monthName}</h3>
                        <button onClick={nextMonth} className="text-[#555] hover:text-white transition-colors p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="text-center text-[9px] font-bold uppercase tracking-widest text-[#333] py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-0">
                        {calendarCells.map((day, i) => {
                            if (day === null) return <div key={`empty-${i}`} />

                            const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const dayOrders = ordersByDay[dayKey] ?? []
                            const pendingCount = dayOrders.filter((o) => o.status === 'pending').length
                            const isSelected = selectedDate === dayKey
                            const hasOrders = dayOrders.length > 0

                            return (
                                <button
                                    key={dayKey}
                                    onClick={() => setSelectedDate(isSelected ? null : dayKey)}
                                    className={`relative flex items-center justify-center rounded-full text-[10px] transition-all aspect-square ${
                                        isSelected
                                            ? 'text-[#0C0C0C] font-bold'
                                            : 'text-[#444]'
                                    }`}
                                >
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                                        isSelected
                                            ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                            : hasOrders
                                                ? pendingCount > 0
                                                    ? 'bg-yellow-400/20 text-yellow-400 font-bold hover:bg-yellow-400/30'
                                                    : 'bg-green-400/20 text-green-400 font-bold hover:bg-green-400/30'
                                                : 'hover:bg-[#161616]'
                                    }`}>
                                        {day}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1a1a1a]">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#444]">Pending Orders</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#444]">Orders Completed</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters & Orders */}
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                    Showing {filteredOrders.length} {statusFilter !== 'all' ? statusFilter : ''} order{filteredOrders.length !== 1 ? 's' : ''}
                    {` · ${new Date((selectedDate || new Date().toISOString().split('T')[0]) + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </p>
                <div className="relative group">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none bg-[#111] border border-[#1a1a1a] text-[10px] font-bold uppercase tracking-widest text-[#aaa] px-4 py-2 rounded-lg outline-none focus:border-[#C9A844] transition-all cursor-pointer pr-10"
                    >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#666] group-hover:text-[#C9A844] transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-8 text-center text-[#444] font-bold uppercase tracking-widest text-[10px]">
                        No {statusFilter !== 'all' ? statusFilter : ''} orders {selectedDate ? 'on this date' : 'found'}
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const items = orderItems.filter((i) => i.order_id === order.id)
                        const isExpanded = expandedOrders.has(order.id)

                        return (
                            <div key={order.id} className="relative bg-[#111] border border-[#1a1a1a] rounded-xl p-4 transition-colors hover:border-[#222]">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-md font-bold text-white">Order #{order.id}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${order.status === 'shipped'
                                                ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                                                : 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#aaa] mt-6">{order.guest_name} · {order.guest_email}</p>
                                        {order.guest_phone && (
                                            <p className="text-[10px] text-[#444] mt-1 tracking-widest uppercase font-bold">Phone: {order.guest_phone}</p>
                                        )}
                                        <p className="text-[10px] text-[#444] mt-1 tracking-widest uppercase font-bold">Address: {order.shipping_address}</p>
                                        <p className="text-[10px] text-[#444] mt-1 tracking-widest uppercase font-bold">{formatDate(order.created_at)}</p>

                                        <div className="mt-1">
                                            <button
                                                onClick={() => toggleOrder(order.id)}
                                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#454545] hover:text-[#9C9C9C] transition-colors"
                                            >
                                                <span>{isExpanded ? 'Hide Details' : `View Cards (${items.length} ${items.length === 1 ? 'item' : 'items'})`}</span>
                                                <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-[#1a1a1a] mt-3 pt-3 grid grid-cols-[max-content_auto] gap-x-4 gap-y-2">
                                                    {items.map((item) => {
                                                        const card = cards.find((c) => String(c.id) === String(item.card_id))
                                                        return (
                                                            <React.Fragment key={item.id}>
                                                                <span className="text-xs font-medium text-[#ccc] whitespace-nowrap">
                                                                    {card?.name ?? 'Unknown pack'} x{item.quantity}
                                                                </span>
                                                                <span className="text-xs font-bold text-[#aaa]">
                                                                    ₱{(item.unit_price * item.quantity).toLocaleString()}
                                                                </span>
                                                            </React.Fragment>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {order.status === 'shipped' && (
                                        <div className="text-right whitespace-nowrap">
                                            <p className="text-sm font-bold text-[#3e9c35]">+ {formatCurrency(order.total)}</p>
                                        </div>
                                    )}
                                </div>
                                {order.status !== 'shipped' && (
                                    <button
                                        onClick={() => markAsShipped(order.id)}
                                        disabled={updatingId === order.id}
                                        className="absolute bottom-4 right-4 text-[12px] uppercase font-bold tracking-widest bg-white text-[#0C0C0C] px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30"
                                    >
                                        {updatingId === order.id ? 'Updating...' : 'Ship now'}
                                    </button>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

function CardsTab({ cards, router }) {
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)

    function startEdit(card) {
        setEditingId(card.id)
        setEditForm({
            name: card.name,
            price: card.price,
            stock_quantity: card.stock_quantity,
            set_name: card.set_name,
            pack_type: card.pack_type,
            image_url: card.image_url,
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

    async function deleteCard(cardId) {
        setDeletingId(cardId)
        await fetch('/api/admin/cards', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cardId }),
        })
        setDeletingId(null)
        setConfirmDeleteId(null)
        router.refresh()
    }

    return (
        <div className="space-y-3">
            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <p className="text-white font-bold text-lg mb-2">Delete this card?</p>
                        <p className="text-[#666] text-sm mb-8">This action is permanent and cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-[#222] hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteCard(confirmDeleteId)}
                                disabled={deletingId === confirmDeleteId}
                                className="flex-1 bg-red-600 text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                                {deletingId === confirmDeleteId ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {cards.map((card) => (
                <div key={card.id} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                    {editingId === card.id ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Pack Name', key: 'name', type: 'text' },
                                { label: 'Set', key: 'set_name', type: 'text' },
                                { label: 'Pack Type', key: 'pack_type', type: 'text' },
                                { label: 'Price (₱)', key: 'price', type: 'number' },
                                { label: 'Stock', key: 'stock_quantity', type: 'number' },
                                { label: 'Image', key: 'image_url', type: 'text' }
                            ].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="block text-[10px] text-[#666] uppercase tracking-widest font-bold mb-1">{label}</label>
                                    <input
                                        type={type}
                                        value={editForm[key] ?? ''}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                        className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#C9A844] transition-colors"
                                    />
                                </div>
                            ))}
                            <div className="col-span-2 flex items-center gap-2 mt-2">
                                <button
                                    onClick={() => saveEdit(card.id)}
                                    disabled={isSaving}
                                    className="bg-[#C9A844] text-[#0C0C0C] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg hover:bg-yellow-500 disabled:opacity-30"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg hover:bg-[#222] hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteId(card.id)}
                                    disabled={deletingId === card.id}
                                    className="ml-auto bg-transparent border border-red-900/40 text-red-500 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg hover:bg-red-900/20 hover:border-red-500 transition-all disabled:opacity-30"
                                >
                                    {deletingId === card.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-white">{card.name}</p>
                                <p className="text-xs text-[#888]">{card.set_name} · {card.pack_type}</p>
                                <div className="flex gap-4 mt-2">
                                    <p className="text-xs font-bold text-[#C9A844]">{formatCurrency(card.price)}</p>
                                    <p className={`text-xs font-bold ${card.stock_quantity <= 3 ? 'text-orange-500' : 'text-[#666]'}`}>
                                        Stock: {card.stock_quantity}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => startEdit(card)}
                                className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-[#222] hover:text-white transition-all"
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
        pack_type: '',
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
            name: '', set_name: '', pack_type: '',
            price: '', stock_quantity: '', image_url: '',
        })
        setSuccess(true)
        setIsSubmitting(false)
        router.refresh()
    }

    return (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 max-w-lg">
            <h2 className="text-base font-bold text-white uppercase tracking-widest mb-6 border-b border-[#222] pb-4">Add new pack</h2>
            {success && (
                <p className="text-sm text-green-400 font-bold mb-6 tracking-wide">✓ Pack added successfully!</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
                {[
                    { label: 'Pack name', key: 'name', type: 'text', required: true, placeholder: 'Paldea Evolved Booster Pack' },
                    { label: 'Set name', key: 'set_name', type: 'text', required: true, placeholder: 'Scarlet & Violet' },
                    { label: 'Pack type', key: 'pack_type', type: 'text', required: true, placeholder: 'Booster Pack' },
                    { label: 'Price (₱)', key: 'price', type: 'number', required: true, placeholder: '2800' },
                    { label: 'Stock quantity', key: 'stock_quantity', type: 'number', required: true, placeholder: '5' },
                    { label: 'Image URL', key: 'image_url', type: 'text', required: false, placeholder: 'https://...' },
                ].map(({ label, key, type, required, placeholder }) => (
                    <div key={key}>
                        <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-1.5">
                            {label} {required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type={type}
                            value={form[key] ?? ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                            required={required}
                            placeholder={placeholder}
                            className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#C9A844] transition-colors placeholder-[#333]"
                        />
                    </div>
                ))}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#C9A844] text-[#0C0C0C] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-yellow-500 disabled:opacity-30 text-sm mt-2 transition-all"
                >
                    {isSubmitting ? 'Adding...' : 'Add pack'}
                </button>
            </form>
        </div>
    )
}