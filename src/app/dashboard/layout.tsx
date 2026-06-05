import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResponsiveDashboardLayout from '@/components/ResponsiveDashboardLayout'

export default async function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, full_name, phone, role, status, referral_code, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <ResponsiveDashboardLayout initialProfile={profile}>
      {children}
    </ResponsiveDashboardLayout>
  )
}
