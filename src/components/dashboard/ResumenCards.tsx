import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatARS } from '@/lib/utils'
import type { DashboardData } from '@/types'
import { Wallet, ShoppingCart, Users, TrendingUp } from 'lucide-react'
import SueldoEditor from './SueldoEditor'

const CARD_CONFIG = {
  gastos:      { iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
  compartido:  { iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  restantePos: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  restanteNeg: { iconBg: 'bg-red-50', iconColor: 'text-red-600' },
}

interface Props {
  data: DashboardData
  mesId: string
}

export default function ResumenCards({ data, mesId }: Props) {
  const { mes, total_gastos_personales, aporte_compartido, dinero_restante } = data
  const sueldo = Number(mes.sueldo_mensual)

  const otherCards = [
    {
      title: 'Gastos Personales',
      value: formatARS(total_gastos_personales),
      sub: sueldo > 0 ? `${((total_gastos_personales / sueldo) * 100).toFixed(1)}% del sueldo` : '',
      icon: ShoppingCart,
      config: CARD_CONFIG.gastos,
    },
    {
      title: 'Aporte Compartido',
      value: formatARS(aporte_compartido),
      sub: sueldo > 0 ? `${((aporte_compartido / sueldo) * 100).toFixed(1)}% del sueldo` : '',
      icon: Users,
      config: CARD_CONFIG.compartido,
    },
    {
      title: 'Dinero Restante',
      value: formatARS(dinero_restante),
      sub: sueldo > 0 ? `${((dinero_restante / sueldo) * 100).toFixed(1)}% del sueldo` : '',
      icon: TrendingUp,
      config: dinero_restante >= 0 ? CARD_CONFIG.restantePos : CARD_CONFIG.restanteNeg,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Sueldo card with inline editor */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-medium text-muted-foreground text-balance">Sueldo Neto</CardTitle>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50">
            <Wallet className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <SueldoEditor mesId={mesId} sueldo={sueldo} />
          {sueldo === 0 && (
            <p className="text-xs text-muted-foreground mt-1">Hacé hover para editar</p>
          )}
        </CardContent>
      </Card>

      {otherCards.map(({ title, value, sub, icon: Icon, config }) => (
        <Card key={title} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-medium text-muted-foreground text-balance">{title}</CardTitle>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
              <Icon className={`h-4 w-4 ${config.iconColor}`} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
            {sub && <p className="text-xs text-muted-foreground mt-1 tabular-nums">{sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
