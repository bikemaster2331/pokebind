import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids')?.split(',')

  if (!ids || ids.length === 0) {
    return Response.json({ cards: [] })
  }

  const { data, error } = await supabase
    .from('pokebox')
    .select('id, stock_quantity')
    .in('id', ids)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ cards: data })
}
