'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Lock, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import GastoPersonalForm from './GastoPersonalForm'
import CategoriasManager from '@/components/categorias/CategoriasManager'
import { deleteGastoPersonal } from '@/lib/actions/gastos-personales'
import { copiarGastosFijosDelMesPrevio } from '@/lib/actions/meses'
import { formatARS, calcularPorcentaje } from '@/lib/utils'
import type { GastoPersonal, CategoriaUsuario } from '@/types'

interface Props {
  gastos: GastoPersonal[]
  mesId: string
  userId: string
  cerrado: boolean
  sueldo: number
  categorias: CategoriaUsuario[]
}

export default function GastosPersonalesClient({ gastos, mesId, userId, cerrado, sueldo, categorias }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoPersonal | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Build color lookup from user's categories
  const colorMap = Object.fromEntries(categorias.map((c) => [c.nombre, c.color]))

  // Group by category
  const grouped = gastos.reduce((acc, g) => {
    if (!acc[g.categoria]) acc[g.categoria] = []
    acc[g.categoria].push(g)
    return acc
  }, {} as Record<string, GastoPersonal[]>)

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0)

  async function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      await deleteGastoPersonal(deleteId)
      setDeleteId(null)
      router.refresh()
    })
  }

  async function handleCopiarFijos() {
    startTransition(async () => {
      const count = await copiarGastosFijosDelMesPrevio(mesId, userId)
      router.refresh()
      if (count === 0) alert('No hay gastos fijos en el mes anterior')
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Mis Gastos</h1>
          <p className="text-muted-foreground text-sm tabular-nums">
            Total: {formatARS(total)}
            {sueldo > 0 && ` (${calcularPorcentaje(total, sueldo)}% del sueldo)`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CategoriasManager categorias={categorias} userId={userId} tipo="personal" />
          {cerrado ? (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" aria-hidden="true" /> Mes cerrado
            </Badge>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCopiarFijos} disabled={isPending} className="touch-manipulation motion-reduce:transition-none hover:bg-accent">
                <Copy className="h-4 w-4 mr-1" aria-hidden="true" /> Copiar Fijos
              </Button>
              <Button size="sm" onClick={() => { setEditingGasto(null); setFormOpen(true) }} className="touch-manipulation motion-reduce:transition-none">
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Nuevo Gasto
              </Button>
            </>
          )}
        </div>
      </div>

      {gastos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Sin gastos este mes
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => {
            const subtotal = items.reduce((s, g) => s + Number(g.monto), 0)
            const color = colorMap[cat] ?? '#94a3b8'
            return (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                      {cat}
                    </span>
                    <span className="text-muted-foreground font-normal tabular-nums">
                      {formatARS(subtotal)}
                      {total > 0 && ` · ${calcularPorcentaje(subtotal, total)}%`}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {items.map((g) => (
                      <div key={g.id} className="flex items-center justify-between py-2 gap-2">
                        <div className="min-w-0">
                          <span className="text-sm">{g.descripcion}</span>
                          {g.es_fijo && <Badge variant="outline" className="ml-2 text-xs">fijo</Badge>}
                          <span className="text-xs text-muted-foreground ml-2 tabular-nums">{g.fecha}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-sm font-medium tabular-nums">{formatARS(Number(g.monto))}</span>
                          {!cerrado && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 touch-manipulation motion-reduce:transition-none hover:bg-accent" onClick={() => { setEditingGasto(g); setFormOpen(true) }} aria-label={`Editar ${g.descripcion}`}>
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive touch-manipulation motion-reduce:transition-none hover:bg-destructive/10" onClick={() => setDeleteId(g.id)} aria-label={`Eliminar ${g.descripcion}`}>
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <GastoPersonalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mesId={mesId}
        userId={userId}
        gasto={editingGasto}
        categorias={categorias}
        onSuccess={() => { setFormOpen(false); router.refresh() }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-balance">Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-manipulation">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-manipulation">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
