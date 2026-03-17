'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatARS } from '@/lib/utils'
import type { CategoriaUsuario } from '@/types'

interface Props {
  gastosPorCategoria: Record<string, number>
  categorias: CategoriaUsuario[]
  sueldo: number
}

const FALLBACK_COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#a855f7',
  '#ec4899', '#06b6d4', '#eab308', '#6366f1',
  '#ef4444', '#10b981',
]

export default function PieCategoriasChart({ gastosPorCategoria, categorias, sueldo }: Props) {
  const colorMap = Object.fromEntries(categorias.map((c) => [c.nombre, c.color]))

  const data = Object.entries(gastosPorCategoria)
    .filter(([, v]) => v && v > 0)
    .map(([cat, value], i) => ({
      name: cat,
      value: value!,
      color: colorMap[cat] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)

  const totalGastos = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-balance">Gastos por Categoría</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Sin gastos registrados
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-balance">Gastos por Categoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatARS(value), '']}
              contentStyle={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}
              itemStyle={{ color: 'inherit' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Custom legend with monto + % de sueldo */}
        <div className="space-y-1.5">
          {data.map((entry) => {
            const pctSueldo = sueldo > 0 ? (entry.value / sueldo) * 100 : null
            const pctTotal = totalGastos > 0 ? (entry.value / totalGastos) * 100 : null
            return (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} aria-hidden="true" />
                <span className="flex-1 truncate text-foreground">{entry.name}</span>
                <span className="tabular-nums text-muted-foreground text-xs">{formatARS(entry.value)}</span>
                {pctSueldo !== null && (
                  <span className="tabular-nums text-xs font-medium w-14 text-right" style={{ color: entry.color }}>
                    {pctSueldo.toFixed(1)}% sueldo
                  </span>
                )}
                {pctSueldo === null && pctTotal !== null && (
                  <span className="tabular-nums text-xs font-medium w-10 text-right text-muted-foreground">
                    {pctTotal.toFixed(1)}%
                  </span>
                )}
              </div>
            )
          })}
          {sueldo > 0 && (
            <div className="flex items-center gap-2 text-sm border-t pt-1.5 mt-1">
              <span className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-muted-foreground">Total gastos</span>
              <span className="tabular-nums text-muted-foreground text-xs">{formatARS(totalGastos)}</span>
              <span className="tabular-nums text-xs font-medium w-14 text-right text-foreground">
                {((totalGastos / sueldo) * 100).toFixed(1)}% sueldo
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
