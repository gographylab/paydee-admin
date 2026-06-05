import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: countries, error } = await supabase
      .from('countries')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ countries })

  } catch (error: any) {
    console.error('Countries GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
