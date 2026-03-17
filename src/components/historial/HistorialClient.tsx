'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Sparkles, Lock, Unlock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatARS, getMesLabel } from '@/lib/utils'
import { cerrarMes, reabrirMes } from '@/lib/actions/meses'
import type { HistorialMes } from '@/types'

interface Props {
  historial: HistorialMes[]
}

export default function HistorialClient({ historial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loadingResumen, setLoadingResumen] = useState<string | null>(null)

  async function handleGenerarResumen(mesId: string) {
    setLoadingResumen(mesId)
    try {
      const res = await fetch('/api/claude/resumen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesId }),
      })
      if (!res.ok) throw new Error('Error al generar resumen')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoadingResumen(null)
    }
  }

  async function handleCerrar(mesId: string) {
    startTransition(async () => {
      await cerrarMes(mesId)
      router.refresh()
    })
  }

  async function handleReabrir(mesId: string) {
    startTransition(async () => {
      await reabrirMes(mesId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">Historial</h1>
        <p className="text-muted-foreground text-sm">Últimos 6 meses</p>
      </div>

      {historial.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Sin historial disponible
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {historial.map((h) => {
            const label = getMesLabel(h.mes.mes, h.mes.anio)
            const isExpanded = expanded === h.mes.id
            const sueldo = Number(h.mes.sueldo_mensual)

            return (
              <Card key={h.mes.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2 text-balance">
                      {label}
                      {h.mes.cerrado ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Lock className="h-2.5 w-2.5" aria-hidden="true" /> Cerrado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Abierto</Badge>
                      )}
                    </CardTitle>
                    <div className="flex gap-1 shrink-0">
                      {h.mes.cerrado ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReabrir(h.mes.id)}
                          disabled={isPending}
                          className="touch-manipulation motion-reduce:transition-none hover:bg-accent"
                        >
                          <Unlock className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Reabrir
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCerrar(h.mes.id)}
                          disabled={isPending}
                          className="touch-manipulation motion-reduce:transition-none"
                        >
                          <Lock className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Cerrar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpanded(isExpanded ? null : h.mes.id)}
                        aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
                        aria-expanded={isExpanded}
                        className="touch-manipulation motion-reduce:transition-none hover:bg-accent"
                      >
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4" aria-hidden="true" />
                          : <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        }
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {[
                      { label: 'Sueldo', value: formatARS(sueldo) },
                      { label: 'Gastos pers.', value: formatARS(h.total_gastos_personales) },
                      { label: 'Compartido', value: formatARS(h.aporte_compartido) },
                      {
                        label: 'Restante',
                        value: formatARS(h.dinero_restante),
                        className: h.dinero_restante >= 0 ? 'text-green-600' : 'text-red-600',
                      },
                    ].map(({ label: l, value, className }) => (
                      <div key={l}>
                        <div className="text-xs text-muted-foreground">{l}</div>
                        <div className={`text-sm font-semibold tabular-nums ${className ?? ''}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    {h.resumen ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Resumen del mes
                          </h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{h.resumen.resumen_texto}</p>
                        </div>
                        {h.resumen.recomendaciones_texto && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Recomendaciones</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{h.resumen.recomendaciones_texto}</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerarResumen(h.mes.id)}
                          disabled={loadingResumen === h.mes.id}
                          className="touch-manipulation motion-reduce:transition-none"
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          {loadingResumen === h.mes.id ? 'Generando…' : 'Regenerar Resumen'}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-3">Sin resumen generado</p>
                        <Button
                          size="sm"
                          onClick={() => handleGenerarResumen(h.mes.id)}
                          disabled={loadingResumen === h.mes.id}
                          className="touch-manipulation motion-reduce:transition-none"
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          {loadingResumen === h.mes.id ? 'Generando con IA…' : 'Generar Resumen con IA'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
