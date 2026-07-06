import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Admin site never creates profiles — accounts are provisioned elsewhere.
      // No profile (or non-admin) sessions get cleaned up here / by middleware.
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/auth/login?error=Admin access required`)
      }

      return NextResponse.redirect(`${origin}/dashboard/admin/sellers`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Something went wrong`)
}
