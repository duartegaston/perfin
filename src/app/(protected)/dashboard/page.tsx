import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getOrCreateMes } from '@/lib/actions/meses'
import { getDashboardData, getHistorialData } from '@/lib/actions/dashboard'
import { getCategorias } from '@/lib/actions/categorias'
import ResumenCards from '@/components/dashboard/ResumenCards'
import DashboardCharts from '@/components/dashboard/DashboardCharts'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const periodo = sp?.periodo
  let anio: number
  let mes: number

  if (periodo && /^\d{4}-\d{2}$/.test(periodo)) {
    ;[anio, mes] = periodo.split('-').map(Number)
  } else {
    const now = new Date()
    anio = now.getFullYear()
    mes = now.getMonth() + 1
  }

  const mesData = await getOrCreateMes(user.id, anio, mes)

  const [dashboardData, historialData, categoriasPersonal, categoriasCompartido] = await Promise.all([
    getDashboardData(user.id, mesData.id),
    getHistorialData(user.id),
    getCategorias(user.id, 'personal'),
    getCategorias(user.id, 'compartido'),
  ])
  const categorias = [...categoriasPersonal, ...categoriasCompartido]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Resumen financiero del mes</p>
      </div>

      <ResumenCards data={dashboardData} mesId={mesData.id} />

      <DashboardCharts
        gastosPorCategoria={dashboardData.gastos_por_categoria}
        historial={historialData}
        categorias={categorias}
        sueldo={Number(mesData.sueldo_mensual)}
      />
    </div>
  )
}
