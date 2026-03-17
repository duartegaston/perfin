import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getHistorialData } from '@/lib/actions/dashboard'
import HistorialClient from '@/components/historial/HistorialClient'

export default async function HistorialPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const historial = await getHistorialData(user.id)

  return <HistorialClient historial={historial} />
}
