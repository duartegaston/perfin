import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import ChatInterface from '@/components/asistente/ChatInterface'

export default async function AsistentePage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Asistente IA</h1>
        <p className="text-muted-foreground text-sm">
          Preguntá sobre tus finanzas. Tiene contexto de los últimos 6 meses.
        </p>
      </div>
      <ChatInterface userName={usuario?.nombre ?? null} />
    </div>
  )
}
