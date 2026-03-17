'use client'

import { useState, useEffect, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createGastoCompartido, updateGastoCompartido } from '@/lib/actions/gastos-compartidos'
import { formatARS } from '@/lib/utils'
import type { GastoCompartido, CategoriaUsuario, ParticipantePredefinido } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  mesId: string
  gasto: GastoCompartido | null
  categorias: CategoriaUsuario[]
  predefinidos: ParticipantePredefinido[]
  miSueldo: number
  onSuccess: () => void
}

export default function GastoCompartidoForm({ open, onOpenChange, mesId, gasto, categorias, predefinidos, miSueldo, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const activeCats = categorias.filter((c) => c.activo)
  const defaultCat = activeCats[0]?.nombre ?? ''

  const [categoria, setCategoria] = useState(defaultCat)
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState<string | null>(null)

  // Participant selection (only used when creating, not editing)
  const [incluirYo, setIncluirYo] = useState(true)
  const [selectedPredefinidos, setSelectedPredefinidos] = useState<Set<string>>(
    () => new Set(predefinidos.map((p) => p.id))
  )

  useEffect(() => {
    if (gasto) {
      setCategoria(gasto.categoria)
      setDescripcion(gasto.descripcion)
      setMonto(String(gasto.monto_total))
      setFecha(gasto.fecha)
    } else {
      setCategoria(defaultCat)
      setDescripcion('')
      setMonto('')
      setFecha(new Date().toISOString().split('T')[0])
      setIncluirYo(true)
      setSelectedPredefinidos(new Set(predefinidos.map((p) => p.id)))
    }
    setError(null)
  }, [gasto, open]) // eslint-disable-line react-hooks/exhaustive-deps

  function togglePredefinido(id: string) {
    setSelectedPredefinidos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Live contribution preview
  const montoNum = parseFloat(monto.replace(',', '.')) || 0
  const selectedList = predefinidos.filter((p) => selectedPredefinidos.has(p.id))
  const sueldoTotal = (incluirYo ? miSueldo : 0) + selectedList.reduce((s, p) => s + Number(p.sueldo), 0)
  const miAporte = sueldoTotal > 0 && incluirYo ? (miSueldo / sueldoTotal) * montoNum : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('Ingresá un monto mayor a cero.')
      return
    }
    startTransition(async () => {
      try {
        if (gasto) {
          await updateGastoCompartido(gasto.id, { categoria, descripcion, monto_total: montoNum, fecha })
        } else {
          const participantes = [
            ...(incluirYo ? [{ nombre: 'Yo', sueldo: miSueldo, es_usuario_actual: true }] : []),
            ...selectedList.map((p) => ({ nombre: p.nombre, sueldo: Number(p.sueldo), es_usuario_actual: false })),
          ]
          await createGastoCompartido(mesId, { categoria, descripcion, monto_total: montoNum, fecha }, participantes)
        }
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
          <DialogTitle className="text-balance">{gasto ? 'Editar Gasto Compartido' : 'Nuevo Gasto Compartido'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="gc-categoria">Categoría</Label>
            <Select value={categoria} onValueChange={(v) => v && setCategoria(v)}>
              <SelectTrigger id="gc-categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeCats.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nombre}>
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ backgroundColor: cat.color }} />
                      {cat.nombre}
                    </span>
                  </SelectItem>
                ))}
                {gasto && !activeCats.find((c) => c.nombre === gasto.categoria) && (
                  <SelectItem value={gasto.categoria}>{gasto.categoria}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gc-descripcion">Descripción</Label>
            <Input id="gc-descripcion" name="descripcion" autoComplete="off" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Alquiler, Super…" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gc-monto">Monto total ($)</Label>
            <Input id="gc-monto" name="monto_total" type="number" autoComplete="off" step="0.01" min="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" required className="tabular-nums" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gc-fecha">Fecha</Label>
            <Input id="gc-fecha" name="fecha" type="date" autoComplete="off" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>

          {!gasto && (predefinidos.length > 0 || miSueldo > 0) && (
            <div className="space-y-2">
              <Label className="text-sm">Participantes</Label>
              <div className="border rounded-md divide-y">
                <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={incluirYo}
                    onChange={(e) => setIncluirYo(e.target.checked)}
                    className="h-4 w-4 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">Yo</span>
                    <span className="text-xs text-muted-foreground ml-2 tabular-nums">{formatARS(miSueldo)}</span>
                  </div>
                  {incluirYo && montoNum > 0 && sueldoTotal > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatARS(miAporte)}</span>
                  )}
                </label>
                {predefinidos.map((p) => {
                  const checked = selectedPredefinidos.has(p.id)
                  const sueldoP = Number(p.sueldo)
                  const aporte = sueldoTotal > 0 && checked ? (sueldoP / sueldoTotal) * montoNum : 0
                  return (
                    <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePredefinido(p.id)}
                        className="h-4 w-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{p.nombre}</span>
                        <span className="text-xs text-muted-foreground ml-2 tabular-nums">{formatARS(sueldoP)}</span>
                      </div>
                      {checked && montoNum > 0 && sueldoTotal > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatARS(aporte)}</span>
                      )}
                    </label>
                  )
                })}
              </div>
              {montoNum > 0 && sueldoTotal === 0 && (
                <p className="text-xs text-muted-foreground">Configurá sueldos en "Participantes" para ver el cálculo proporcional.</p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 touch-manipulation motion-reduce:transition-none" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 touch-manipulation motion-reduce:transition-none" disabled={isPending}>{isPending ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
