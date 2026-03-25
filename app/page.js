import { supabase } from './supabase'

export default async function Home() {
  const { data: cards, error } = await supabase
    .from('pokebox')
    .select('*')

  if (error) {
    console.error(error)
    return <p>Error loading cards.</p>
  }

  return (
    <main>
      <h1>PokeVault</h1>
      {cards.map(card => (
        <div key={card.id}>
          <h2>{card.name}</h2>
          <p>{card.set_name} — {card.rarity}</p>
          <p>₱{card.price_php}</p>
          <p>Stock: {card.stock_quantity}</p>
        </div>
      ))}
    </main>
  )
}
