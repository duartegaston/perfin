import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getOrCreateMes } from '@/lib/actions/meses'
import { getGastosPersonales } from '@/lib/actions/gastos-personales'
import { getCategorias } from '@/lib/actions/categorias'
import GastosPersonalesClient from '@/components/gastos-personales/GastosPersonalesClient'

export default async function GastosPersonalesPage({
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

  const [gastos, categorias] = await Promise.all([
    getGastosPersonales(mesData.id),
    getCategorias(user.id, 'personal'),
  ])

  return (
    <GastosPersonalesClient
      gastos={gastos}
      mesId={mesData.id}
      userId={user.id}
      cerrado={mesData.cerrado}
      sueldo={Number(mesData.sueldo_mensual)}
      categorias={categorias}
    />
  )
}
