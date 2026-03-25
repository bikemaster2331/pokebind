import { supabase } from './supabase'

export default async function Home() {
  const { data: cards, error } = await supabase
    .from('pokebox')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return <p>Error loading cards.</p>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">PokeVault</h1>
          <span className="bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-0.5 rounded">PH</span>
        </div>
        <button className="border border-gray-300 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">
          Cart (0)
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-6">All Cards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cards.map(card => (
            <div key={card.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center p-4">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="object-contain h-full" />
                ) : (
                  <div className="text-center">
                    <p className="text-2xl">🃏</p>
                    <p className="text-xs text-gray-400 mt-1">{card.type}</p>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate">{card.name}</p>
                <p className="text-xs text-gray-400 mb-2">{card.set_name} · {card.condition}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    ₱{Number(card.price_php || 0).toLocaleString('en-PH', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    })}
                  </span>
                  <button className="bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-1 rounded-md hover:bg-yellow-500">
                    + Add
                  </button>
                </div>
                {card.stock_quantity <= 3 && (
                  <p className="text-xs text-orange-500 mt-1">Only {card.stock_quantity} left!</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}