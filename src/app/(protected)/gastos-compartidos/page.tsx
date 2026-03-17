import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getOrCreateMes } from '@/lib/actions/meses'
import { getGastosCompartidos } from '@/lib/actions/gastos-compartidos'
import { getCategorias } from '@/lib/actions/categorias'
import { getParticipantesPredefinidos } from '@/lib/actions/participantes-predefinidos'
import GastosCompartidosClient from '@/components/gastos-compartidos/GastosCompartidosClient'

export default async function GastosCompartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const periodo = sp?.periodo
  let anio: number, mes: number

  if (periodo && /^\d{4}-\d{2}$/.test(periodo)) {
    ;[anio, mes] = periodo.split('-').map(Number)
  } else {
    const now = new Date()
    anio = now.getFullYear()
    mes = now.getMonth() + 1
  }

  const mesData = await getOrCreateMes(user.id, anio, mes)

  const [gastos, categorias, predefinidos] = await Promise.all([
    getGastosCompartidos(mesData.id),
    getCategorias(user.id, 'compartido'),
    getParticipantesPredefinidos(user.id),
  ])

  return (
    <GastosCompartidosClient
      gastos={gastos}
      mesId={mesData.id}
      userId={user.id}
      cerrado={mesData.cerrado}
      categorias={categorias}
      predefinidos={predefinidos}
      miSueldo={Number(mesData.sueldo_mensual)}
    />
  )
}
