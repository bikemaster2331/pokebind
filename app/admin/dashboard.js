/*
  POKEVAULT - ADMIN DASHBOARD COMPONENT
  ------------------------------------
  Comprehensive admin interface for site management.
  Features include:
  - Inventory management (Add, Edit, Delete card packs).
  - Order tracking and fulfillment (Mark as shipped).
  - Real-time revenue and order stats.
  - Interactive calendar view for daily order summaries.
  - Secure sign-out functionality.
*/

'use client'


import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '../browser'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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

    // Lifted Calendar State
    const [selectedDate, setSelectedDate] = useState(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(true)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Build order count map by day key "YYYY-MM-DD"
    const ordersByDay = useMemo(() => {
        const map = {}
        orders.forEach((order) => {
            const d = new Date(order.created_at)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            if (!map[key]) map[key] = []
            map[key].push(order)
        })
        return map
    }, [orders])

    // Derived Stats
    const displayOrders = useMemo(() => {
        if (!selectedDate) return orders
        return ordersByDay[selectedDate] ?? []
    }, [selectedDate, orders, ordersByDay])

    const displayRevenue = useMemo(() => {
        return displayOrders
            .filter(o => o.status === 'shipped')
            .reduce((sum, o) => sum + (o.total ?? 0), 0)
    }, [displayOrders])

    async function handleSignOut() {
        setIsSigningOut(true)
        const supabase = createSupabaseBrowser()
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    return (
        <main className="min-h-screen bg-[#0C0C0C] text-[#e0d8c8] relative pb-24 md:pb-0">
            <nav className="bg-[#0C0C0C] border-b border-[#1a1a1a] px-4 md:px-6 py-4">
                <div className="max-w-9xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-md md:text-lg font-bold text-white tracking-tight uppercase">PokeVault Admin</h1>
                        <span className="hidden md:inline-block bg-[#1a1a1a] text-[#aaa] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-[#2a2a2a]">
                            Dashboard
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Desktop: Email and Sign Out */}
                        <span className="hidden md:inline-block text-sm text-[#888] font-medium">{user.email}</span>
                        <button
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="hidden md:inline-block text-sm text-white hover:text-red-700 transition-colors"
                        >
                            Sign out
                        </button>

                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden w-8 h-8 rounded-full bg-white text-[#0C0C0C] flex items-center justify-center font-bold text-xs border border-white/10"
                        >
                            {user.email[0].toUpperCase()}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    <div className="fixed top-0 right-0 bottom-0 w-64 bg-[#111] border-l border-[#1a1a1a] z-[70] md:hidden animate-in slide-in-from-right duration-300">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#666]">Admin Menu</h3>
                                <button onClick={() => setIsSidebarOpen(false)} className="text-[#888] hover:text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="mb-8">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-[#444] mb-1">Welcome Admin</p>
                                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                            </div>

                            <button
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                className="w-full bg-red-900/40 border border-red-800/50 text-red-200 text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-red-900/60 hover:text-white transition-all disabled:opacity-50"
                            >
                                {isSigningOut ? 'Signing out...' : 'Sign out'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Calendar Trigger (Top Right of Screen) */}
            {(activeTab === 'analytics' || activeTab === 'orders') && (
                <div className="absolute top-[75px] right-4 md:top-[85px] md:right-6 z-40 flex flex-col items-end">
                    <button
                        onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-[#111] border border-[#1a1a1a] px-3 py-2 md:px-4 md:py-2 rounded-lg text-[#aaa] hover:text-white hover:border-[#2e2e2e] transition-all"
                    >
                        <svg className={`w-3 h-3 transition-transform ${isCalendarCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="hidden md:inline">{isCalendarCollapsed ? 'Show Calendar' : 'Hide Calendar'}</span>
                        <span className="md:hidden">Calendar</span>
                    </button>

                    {!isCalendarCollapsed && (
                        <>
                            {/* Mobile Backdrop */}
                            <div
                                className="fixed inset-0 bg-black/80 z-40 md:hidden"
                                onClick={() => setIsCalendarCollapsed(true)}
                            />
                            {/* Calendar Modal/Dropdown */}
                            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-50 md:absolute md:top-full md:left-auto md:right-0 md:translate-x-0 md:translate-y-0 md:mt-2 md:w-72 bg-[#111] border border-[#1a1a1a] rounded-xl p-3 shadow-2xl animate-in fade-in duration-200">
                                <Calendar
                                    currentMonth={currentMonth}
                                    setCurrentMonth={setCurrentMonth}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    ordersByDay={ordersByDay}
                                />
                                <button
                                    onClick={() => setIsCalendarCollapsed(true)}
                                    className="w-full mt-4 bg-[#1a1a1a] text-[#aaa] text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg md:hidden hover:text-white border border-[#2a2a2a]"
                                >
                                    Close Calendar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-24 relative">

                {/* Only show Header and Top Stats on Analytics and Orders tabs */}
                {(activeTab === 'analytics' || activeTab === 'orders') && (
                    <>
                        {/* Date Header */}
                        <div className="mb-4 md:mb-6 mt-4 md:mt-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-1">Showing Orders for</p>
                            <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight">
                                {selectedDate ? formatDate(selectedDate + 'T00:00:00') : 'All-time Overview'}
                            </h2>
                        </div>

                        {/* KPI Stats Grid (Forced Horizontal on Mobile) */}
                        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
                            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-3 md:p-4 transition-colors hover:border-[#2e2e2e]">
                                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#666] truncate">
                                    Total packs
                                </p>
                                <p className="text-sm md:text-2xl font-bold mt-1 text-white truncate">{cards.length}</p>
                            </div>
                            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-3 md:p-4 transition-colors hover:border-[#2e2e2e]">
                                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#666] truncate">
                                    Total orders
                                </p>
                                <p className="text-sm md:text-2xl font-bold mt-1 text-white truncate">{displayOrders.length}</p>
                            </div>
                            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-3 md:p-4 transition-colors hover:border-[#2e2e2e]">
                                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#666] truncate">
                                    Revenue
                                </p>
                                <p className="text-sm md:text-2xl font-bold mt-1 text-[#3e9c35] truncate">
                                    {formatCurrency(displayRevenue)}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Desktop Tabs */}
                <div className="hidden md:flex gap-2 mb-6">
                    {['analytics', 'orders', 'packs', 'add pack'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-white text-[#0C0C0C]'
                                : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] hover:bg-[#222] hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Mobile Floating Glass Pill Nav with Slide Animation */}
                <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="relative flex items-center justify-between w-full h-full">

                        {/* THE SLIDING HIGHLIGHTER */}
                        <div
                            className="absolute top-0 bottom-0 left-0 w-1/4 bg-[#fff]/20 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-transform duration-300 ease-out pointer-events-none"
                            style={{
                                transform: `translateX(${['analytics', 'orders', 'packs', 'add pack'].indexOf(activeTab) * 100}%)`
                            }}
                        />

                        {/* THE BUTTON TEXT */}
                        {['analytics', 'orders', 'packs', 'add pack'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative z-10 flex-1 py-3 px-2 text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 text-center rounded-full ${activeTab === tab
                                    ? 'text-[#fff]'
                                    : 'text-[#888] hover:text-white'
                                    }`}
                            >
                                {tab === 'add pack' ? 'Add' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'analytics' && (
                    <AnalyticsTab orders={orders} orderItems={orderItems} cards={cards} />
                )}
                {activeTab === 'orders' && (
                    <OrdersTab
                        orders={orders}
                        orderItems={orderItems}
                        cards={cards}
                        router={router}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        ordersByDay={ordersByDay}
                    />
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

function OrdersTab({ orders, orderItems, cards, router, selectedDate, setSelectedDate, ordersByDay }) {
    const [updatingId, setUpdatingId] = useState(null)
    const [statusFilter, setStatusFilter] = useState('all')
    const [expandedOrders, setExpandedOrders] = useState(new Set())

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

    // Filter orders
    let filteredOrders = orders
    if (selectedDate) {
        filteredOrders = ordersByDay[selectedDate] ?? []
    }
    if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter((o) => o.status === statusFilter)
    }

    if (orders.length === 0) {
        return <p className="text-sm text-gray-400">No orders yet.</p>
    }

    return (
        <div className="space-y-4">
            {/* Filters & Orders */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                    Showing {filteredOrders.length} {statusFilter !== 'all' ? statusFilter : ''} order{filteredOrders.length !== 1 ? 's' : ''}
                </p>
                <div className="relative group w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-auto appearance-none bg-[#111] border border-[#1a1a1a] text-[10px] font-bold uppercase tracking-widest text-[#aaa] px-4 py-3 md:py-2 rounded-lg outline-none focus:border-white/20 transition-all cursor-pointer pr-10"
                    >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#666] group-hover:text-white transition-colors">
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
                                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex-1 w-full">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <p className="text-md font-bold text-white">Order #{order.id}</p>
                                            {order.status === 'cancelled' && order.payment_status === 'cancelled' ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-900/20 text-red-400 border border-red-500/30">
                                                    Cancelled
                                                </span>
                                            ) : (
                                                <>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${order.status === 'shipped'
                                                        ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                                                        : order.status === 'cancelled'
                                                            ? 'bg-red-900/20 text-red-400 border border-red-500/30'
                                                            : 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30'
                                                        }`}>
                                                        Status: {order.status}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${order.payment_status === 'paid'
                                                        ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                                                        : order.payment_status === 'cancelled'
                                                            ? 'bg-red-900/20 text-red-400 border border-red-500/30'
                                                            : 'bg-gray-900/20 text-gray-400 border border-gray-500/30'
                                                        }`}>
                                                        Payment: {order.payment_status ?? 'unpaid'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-sm text-[#aaa] mt-4 md:mt-6">{order.guest_name} · {order.guest_email}</p>
                                        {order.guest_phone && (
                                            <p className="text-[10px] text-[#444] mt-1 tracking-widest uppercase font-bold">Phone: {order.guest_phone}</p>
                                        )}
                                        <p className="text-[10px] text-[#444] mt-1 tracking-widest uppercase font-bold">Address: {order.shipping_address}</p>
                                        <p className="text-[10px] text-[#444] mt-1 tracking-widest uppercase font-bold">{formatDate(order.created_at)}</p>

                                        <div className="mt-2 md:mt-1">
                                            <button
                                                onClick={() => toggleOrder(order.id)}
                                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#454545] hover:text-[#9C9C9C] transition-colors py-2 md:py-0"
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
                                                                <span className="text-xs font-medium text-[#ccc] whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] md:max-w-none">
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
                                        <div className="text-left md:text-right mt-2 md:mt-0 pb-10 md:pb-0">
                                            <p className="text-sm font-bold text-[#3e9c35]">+ {formatCurrency(order.total)}</p>
                                        </div>
                                    )}
                                </div>
                                {order.status !== 'shipped' && (
                                    order.status === 'cancelled' || order.payment_status === 'cancelled' ? (
                                        <span className="absolute bottom-4 right-4 text-[10px] uppercase font-bold tracking-widest text-[#444] border border-[#1e1e1e] px-3 py-1.5 rounded-lg">
                                            Order Cancelled
                                        </span>
                                    ) : order.payment_status === 'paid' ? (
                                        <button
                                            onClick={() => markAsShipped(order.id)}
                                            disabled={updatingId === order.id}
                                            className="absolute bottom-4 right-4 text-[12px] uppercase font-bold tracking-widest bg-white text-[#0C0C0C] px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30"
                                        >
                                            {updatingId === order.id ? 'Updating...' : 'Ship now'}
                                        </button>
                                    ) : (
                                        <span className="absolute bottom-4 right-4 text-[10px] uppercase font-bold tracking-widest text-[#333] border border-[#1e1e1e] px-3 py-1.5 rounded-lg">
                                            Awaiting payment
                                        </span>
                                    )
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
            language: card.language,
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
                                className="flex-1 bg-red-900/40 border border-red-800/50 text-red-200 text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-red-900/60 hover:text-white transition-all disabled:opacity-50"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { label: 'Pack Name', key: 'name', type: 'text' },
                                { label: 'Set', key: 'set_name', type: 'text' },
                                { label: 'Pack Type', key: 'pack_type', type: 'text' },
                                { label: 'Language', key: 'language', type: 'select' },
                                { label: 'Price (₱)', key: 'price', type: 'number' },
                                { label: 'Stock', key: 'stock_quantity', type: 'number' },
                                { label: 'Image', key: 'image_url', type: 'text' }
                            ].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="block text-[10px] text-[#666] uppercase tracking-widest font-bold mb-1">{label}</label>
                                    {type === 'select' ? (
                                        <select
                                            value={editForm[key] || 'EN'}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                            className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
                                        >
                                            <option value="EN">EN</option>
                                            <option value="JPN">JPN</option>
                                        </select>
                                    ) : (
                                        <input
                                            type={type}
                                            value={editForm[key] ?? ''}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                            className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-white/20 transition-colors"
                                        />
                                    )}
                                </div>
                            ))}
                            <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row items-center gap-2 mt-2 w-full">
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => saveEdit(card.id)}
                                        disabled={isSaving}
                                        className="flex-1 md:flex-none bg-white text-[#0C0C0C] text-xs font-bold uppercase tracking-widest px-4 py-2.5 md:py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="flex-1 md:flex-none bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-xs font-bold uppercase tracking-widest px-4 py-2.5 md:py-1.5 rounded-lg hover:bg-[#222] hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <button
                                    onClick={() => setConfirmDeleteId(card.id)}
                                    disabled={deletingId === card.id}
                                    className="w-full md:w-auto md:ml-auto bg-red-900/40 border border-red-800/50 text-red-200 text-xs font-bold uppercase tracking-widest px-4 py-2.5 md:py-1.5 rounded-lg hover:bg-red-900/60 hover:text-white transition-all disabled:opacity-30 mt-2 md:mt-0"
                                >
                                    {deletingId === card.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-row items-center justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">{card.name}</p>
                                <p className="text-xs text-[#888]">{card.set_name} · {card.pack_type}</p>
                                <div className="flex gap-4 mt-2">
                                    <p className="text-xs font-bold text-white">{formatCurrency(card.price)}</p>
                                    <p className={`text-xs font-bold ${card.stock_quantity <= 3 ? 'text-orange-500' : 'text-[#666]'}`}>
                                        Stock: {card.stock_quantity}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => startEdit(card)}
                                className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-[#222] hover:text-white transition-all whitespace-nowrap"
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
        language: 'EN',
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
            name: '', set_name: '', pack_type: '', language: 'EN',
            price: '', stock_quantity: '', image_url: '',
        })
        setSuccess(true)
        setIsSubmitting(false)
        router.refresh()
    }

    return (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 md:p-6 w-full max-w-lg mx-auto md:mx-0">
            <h2 className="text-base font-bold text-white uppercase tracking-widest mb-6 border-b border-[#222] pb-4">Add new pack</h2>
            {success && (
                <p className="text-sm text-green-400 font-bold mb-6 tracking-wide">✓ Pack added successfully!</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
                {[
                    { label: 'Pack name', key: 'name', type: 'text', required: true, placeholder: 'Paldea Evolved Booster Pack' },
                    { label: 'Set name', key: 'set_name', type: 'text', required: true, placeholder: 'Scarlet & Violet' },
                    { label: 'Pack type', key: 'pack_type', type: 'text', required: true, placeholder: 'Loose Booster Pack' },
                    { label: 'Language', key: 'language', type: 'select', required: true },
                    { label: 'Price (₱)', key: 'price', type: 'number', required: true, placeholder: '2800' },
                    { label: 'Stock quantity', key: 'stock_quantity', type: 'number', required: true, placeholder: '5' },
                    { label: 'Image URL', key: 'image_url', type: 'text', required: false, placeholder: 'https://...' },
                ].map(({ label, key, type, required, placeholder }) => (
                    <div key={key}>
                        <label className="block text-[10px] font-bold text-[#666] uppercase tracking-widest mb-1.5">
                            {label} {required && <span className="text-red-500">*</span>}
                        </label>
                        {type === 'select' ? (
                            <select
                                value={form[key] || 'EN'}
                                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                required={required}
                                className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="EN">EN</option>
                                <option value="JPN">JPN</option>
                            </select>
                        ) : (
                            <input
                                type={type}
                                value={form[key] ?? ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                required={required}
                                placeholder={placeholder}
                                className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-white/20 transition-colors placeholder-[#333]"
                            />
                        )}
                    </div>
                ))}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-[#0C0C0C] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-gray-200 disabled:opacity-30 text-sm mt-2 transition-all"
                >
                    {isSubmitting ? 'Adding...' : 'Add pack'}
                </button>
            </form>
        </div>
    )
}

function AnalyticsTab({ orders, orderItems, cards }) {
    // 1. Process Revenue Over Time (Line Chart)
    const revenueData = useMemo(() => {
        // Only count paid or shipped orders for revenue
        const validOrders = orders.filter(o => o.status === 'shipped' || o.payment_status === 'paid')

        const groupedByDate = validOrders.reduce((acc, order) => {
            const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (!acc[date]) acc[date] = 0
            acc[date] += Number(order.total || 0)
            return acc
        }, {})

        return Object.entries(groupedByDate)
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort chronologically
    }, [orders])

    // 2. Process Best Selling Packs (Pie Chart)
    const pieData = useMemo(() => {
        // Count quantities of each card sold
        const cardCounts = orderItems.reduce((acc, item) => {
            if (!acc[item.card_id]) acc[item.card_id] = 0
            acc[item.card_id] += item.quantity
            return acc
        }, {})

        // Match with card names and sort top 5
        const sortedPacks = Object.entries(cardCounts)
            .map(([cardId, count]) => {
                const cardInfo = cards.find(c => String(c.id) === String(cardId))
                return {
                    name: cardInfo ? cardInfo.name : 'Unknown',
                    value: count
                }
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 5) // Only show top 5 so the pie chart stays clean

        return sortedPacks
    }, [orderItems, cards])

    const PIE_COLORS = ['#ffffff', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

    // 3. Process Customer Metrics
    const customerMetrics = useMemo(() => {
        const uniqueEmails = new Set(orders.map(o => o.guest_email))
        const totalRevenue = orders.filter(o => o.status === 'shipped' || o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total || 0), 0)
        const avgSpend = uniqueEmails.size > 0 ? totalRevenue / uniqueEmails.size : 0

        return {
            totalCustomers: uniqueEmails.size,
            avgSpend: avgSpend
        }
    }, [orders])

    return (
        <div className="space-y-6">
            {/* KPI Row - Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Unique Customers</p>
                    <p className="text-3xl font-display text-white mt-2">{customerMetrics.totalCustomers}</p>
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Avg Spend Per User (LTV)</p>
                    <p className="text-3xl font-display text-[#10b981] mt-2">{formatCurrency(customerMetrics.avgSpend)}</p>
                </div>
            </div>

            {/* Charts - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart: Revenue */}
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-6">Revenue Over Time</p>
                    <div className="h-[250px] md:h-[300px] w-full">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                    <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#666"
                                        tick={{ fill: '#666', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₱${value.toLocaleString()}`}
                                        width={65}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#2a2a2a', borderRadius: '8px' }}
                                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                        formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#111', stroke: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs tracking-widest uppercase text-[#444]">No revenue data yet</div>
                        )}
                    </div>
                </div>

                {/* Pie Chart: Top Packs */}
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-6">Top Selling Packs</p>
                    <div className="h-[250px] md:h-[300px] w-full flex flex-col items-center justify-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#2a2a2a', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs tracking-widest uppercase text-[#444]">No sales data yet</div>
                        )}
                        {/* Custom Legend */}
                        {pieData.length > 0 && (
                            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 w-full">
                                {pieData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                        <span className="text-[10px] text-[#888] uppercase tracking-wider truncate max-w-[100px]">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Calendar({ currentMonth, setCurrentMonth, selectedDate, setSelectedDate, ordersByDay }) {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

    const calendarCells = []
    for (let i = 0; i < firstDay; i++) calendarCells.push(null)
    for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)

    return (
        <div className="bg-[#111]">
            <div className="flex items-center justify-between mb-2 px-1">
                <button onClick={prevMonth} className="text-[#555] hover:text-white transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#aaa]">{monthName}</h3>
                <button onClick={nextMonth} className="text-[#555] hover:text-white transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-[8px] font-bold uppercase tracking-widest text-[#333] py-1">
                        {day}
                    </div>
                ))}
            </div>

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
                            className={`relative flex items-center justify-center rounded-full text-[10px] transition-all aspect-square ${isSelected ? 'text-[#0C0C0C] font-bold' : 'text-[#444]'
                                }`}
                        >
                            <span className={`w-6 md:w-5 h-6 md:h-5 flex items-center justify-center rounded-full transition-all ${isSelected
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

            <div className="flex items-center justify-center md:justify-start gap-3 mt-3 pt-3 border-t border-[#1a1a1a]">
                <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-yellow-400" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#444]">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-green-400" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#444]">Done</span>
                </div>
            </div>
        </div>
    )
}