'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { addParticipante } from '@/lib/actions/gastos-compartidos'
import { formatARS } from '@/lib/utils'
import type { Participante } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  gastoCompartidoId: string
  gastoMonto: number
  participantesActuales: Participante[]
  onSuccess: () => void
}

export default function ParticipanteForm({
  open, onOpenChange, gastoCompartidoId, gastoMonto, participantesActuales, onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [nombre, setNombre] = useState('')
  const [sueldo, setSueldo] = useState('')
  const [esUsuarioActual, setEsUsuarioActual] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sueldoNum = parseFloat(sueldo.replace(',', '.')) || 0
  const sumaSueldos = participantesActuales.reduce((s, p) => s + Number(p.sueldo), 0) + sueldoNum
  const aportePreview = sumaSueldos > 0
    ? (sueldoNum / sumaSueldos) * Number(gastoMonto)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nombre.trim()) {
      setError('Ingresá el nombre del participante.')
      return
    }
    if (sueldoNum <= 0) {
      setError('Ingresá un sueldo mayor a cero.')
      return
    }

    startTransition(async () => {
      try {
        await addParticipante(gastoCompartidoId, {
          nombre: nombre.trim(),
          sueldo: sueldoNum,
          es_usuario_actual: esUsuarioActual,
        })
        setNombre('')
        setSueldo('')
        setEsUsuarioActual(false)
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar. Intentá de nuevo.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-balance">Agregar Participante</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="part-nombre">Nombre</Label>
            <Input
              id="part-nombre"
              name="nombre"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Gastón, Lu…"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="part-sueldo">Sueldo neto ($)</Label>
            <Input
              id="part-sueldo"
              name="sueldo"
              type="number"
              autoComplete="off"
              step="0.01"
              min="0.01"
              value={sueldo}
              onChange={(e) => setSueldo(e.target.value)}
              placeholder="0"
              required
              className="tabular-nums"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="es_usuario_actual"
              name="es_usuario_actual"
              checked={esUsuarioActual}
              onChange={(e) => setEsUsuarioActual(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="es_usuario_actual" className="font-normal cursor-pointer">
              Soy yo (el usuario actual)
            </Label>
          </div>

          {sueldoNum > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Aporte estimado:</span>
                <Badge variant="secondary" className="tabular-nums">{formatARS(aportePreview)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                Basado en proporción de sueldo ({sumaSueldos > 0 ? ((sueldoNum / sumaSueldos) * 100).toFixed(1) : 0}%)
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 touch-manipulation motion-reduce:transition-none"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 touch-manipulation motion-reduce:transition-none"
              disabled={isPending}
            >
              {isPending ? 'Agregando…' : 'Agregar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
