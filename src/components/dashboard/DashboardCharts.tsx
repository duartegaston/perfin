'use client'

import dynamic from 'next/dynamic'
import type { HistorialMes, CategoriaUsuario } from '@/types'

const PieCategoriasChart = dynamic(() => import('./PieCategoriasChart'), { ssr: false })
const LineEvolucionChart = dynamic(() => import('./LineEvolucionChart'), { ssr: false })

interface Props {
  gastosPorCategoria: Record<string, number>
  historial: HistorialMes[]
  categorias: CategoriaUsuario[]
  sueldo: number
}

export default function DashboardCharts({ gastosPorCategoria, historial, categorias, sueldo }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PieCategoriasChart gastosPorCategoria={gastosPorCategoria} categorias={categorias} sueldo={sueldo} />
      <LineEvolucionChart historial={historial} />
    </div>
  )
}
