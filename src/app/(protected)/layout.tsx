import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getMesActual } from '@/lib/actions/meses'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MesProvider from '@/components/providers/MesProvider'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const mesData = await getMesActual(user.id)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Suspense>
          <Header email={user.email ?? ''} />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Suspense>
            <MesProvider
              initialMesId={mesData.id}
              initialAnio={mesData.anio}
              initialMes={mesData.mes}
              initialCerrado={mesData.cerrado}
            >
              {children}
            </MesProvider>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
