'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatARS, getMesLabel } from '@/lib/utils'
import type { HistorialMes } from '@/types'

interface Props {
  historial: HistorialMes[]
}

export default function LineEvolucionChart({ historial }: Props) {
  const data = [...historial]
    .reverse()
    .map((h) => ({
      mes: getMesLabel(h.mes.mes, h.mes.anio).split(' ')[0], // Just month name
      sueldo: Number(h.mes.sueldo_mensual),
      gastos: h.total_gastos_personales,
      compartido: h.aporte_compartido,
      restante: h.dinero_restante,
    }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-balance">Evolución Mensual</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Sin historial disponible
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-balance">Evolución Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
            <Tooltip
              formatter={(value: number) => formatARS(value)}
              contentStyle={{ fontVariantNumeric: 'tabular-nums' }}
            />
            <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
            <Line type="monotone" dataKey="sueldo" name="Sueldo" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="gastos" name="Gastos pers." stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="compartido" name="Compartido" stroke="#a855f7" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="restante" name="Restante" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
