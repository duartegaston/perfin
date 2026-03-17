'use client'

import { useState, useEffect, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createGastoPersonal, updateGastoPersonal } from '@/lib/actions/gastos-personales'
import type { GastoPersonal, CategoriaUsuario } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  mesId: string
  userId: string
  gasto: GastoPersonal | null
  categorias: CategoriaUsuario[]
  onSuccess: () => void
}

export default function GastoPersonalForm({ open, onOpenChange, mesId, userId, gasto, categorias, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const activeCats = categorias.filter((c) => c.activo)
  const defaultCat = activeCats[0]?.nombre ?? ''

  const [categoria, setCategoria] = useState(defaultCat)
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [esFijo, setEsFijo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gasto) {
      setCategoria(gasto.categoria)
      setDescripcion(gasto.descripcion)
      setMonto(String(gasto.monto))
      setFecha(gasto.fecha)
      setEsFijo(gasto.es_fijo)
    } else {
      setCategoria(defaultCat)
      setDescripcion('')
      setMonto('')
      setFecha(new Date().toISOString().split('T')[0])
      setEsFijo(false)
    }
    setError(null)
  }, [gasto, open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const montoNum = parseFloat(monto.replace(',', '.'))
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('Ingresá un monto mayor a cero.')
      return
    }
    startTransition(async () => {
      try {
        if (gasto) {
          await updateGastoPersonal(gasto.id, { categoria, descripcion, monto: montoNum, fecha, es_fijo: esFijo })
        } else {
          await createGastoPersonal(mesId, userId, { categoria, descripcion, monto: montoNum, fecha, es_fijo: esFijo })
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
          <DialogTitle className="text-balance">{gasto ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="gasto-categoria">Categoría</Label>
            <Select value={categoria} onValueChange={(v) => v && setCategoria(v)}>
              <SelectTrigger id="gasto-categoria">
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
            <Label htmlFor="gasto-descripcion">Descripción</Label>
            <Input id="gasto-descripcion" name="descripcion" autoComplete="off" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Almuerzo, Netflix…" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gasto-monto">Monto ($)</Label>
            <Input id="gasto-monto" name="monto" type="number" autoComplete="off" step="0.01" min="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" required className="tabular-nums" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gasto-fecha">Fecha</Label>
            <Input id="gasto-fecha" name="fecha" type="date" autoComplete="off" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="es_fijo" name="es_fijo" checked={esFijo} onChange={(e) => setEsFijo(e.target.checked)} className="h-4 w-4" />
            <Label htmlFor="es_fijo" className="font-normal cursor-pointer">Es un gasto fijo (se repite mensualmente)</Label>
          </div>
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
