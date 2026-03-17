'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Lock, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import GastoCompartidoForm from './GastoCompartidoForm'
import ParticipanteForm from './ParticipanteForm'
import ParticipantesPredefinidosManager from './ParticipantesPredefinidosManager'
import CategoriasManager from '@/components/categorias/CategoriasManager'
import { deleteGastoCompartido, deleteParticipante } from '@/lib/actions/gastos-compartidos'
import { formatARS } from '@/lib/utils'
import type { GastoCompartido, Participante, CategoriaUsuario, ParticipantePredefinido } from '@/types'

interface Props {
  gastos: GastoCompartido[]
  mesId: string
  userId: string
  cerrado: boolean
  categorias: CategoriaUsuario[]
  predefinidos: ParticipantePredefinido[]
  miSueldo: number
}

export default function GastosCompartidosClient({ gastos, mesId, userId, cerrado, categorias, predefinidos, miSueldo }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoCompartido | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [addingParticipanteGasto, setAddingParticipanteGasto] = useState<string | null>(null)
  const [deletePartId, setDeletePartId] = useState<string | null>(null)

  const colorMap = Object.fromEntries(categorias.map((c) => [c.nombre, c.color]))

  const totalGeneral = gastos.reduce((s, g) => s + Number(g.monto_total), 0)
  const totalMiAporte = gastos.reduce((s, g) => {
    const miParte = (g.participantes ?? []).find((p) => p.es_usuario_actual)
    return s + Number(miParte?.monto_a_aportar ?? 0)
  }, 0)

  async function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      await deleteGastoCompartido(deleteId)
      setDeleteId(null)
      router.refresh()
    })
  }

  async function handleDeletePart() {
    if (!deletePartId) return
    startTransition(async () => {
      await deleteParticipante(deletePartId)
      setDeletePartId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Gastos Compartidos</h1>
          <p className="text-muted-foreground text-sm tabular-nums">
            Total gastos compartidos: {formatARS(totalGeneral)} · Mi aporte: {formatARS(totalMiAporte)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ParticipantesPredefinidosManager predefinidos={predefinidos} userId={userId} />
          <CategoriasManager categorias={categorias} userId={userId} tipo="compartido" />
          {cerrado ? (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" aria-hidden="true" /> Mes cerrado
            </Badge>
          ) : (
            <Button size="sm" onClick={() => { setEditingGasto(null); setFormOpen(true) }} className="touch-manipulation motion-reduce:transition-none">
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Nuevo Gasto
            </Button>
          )}
        </div>
      </div>

      {gastos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Sin gastos compartidos este mes
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {gastos.map((gasto) => {
            const participantes = (gasto.participantes ?? []) as Participante[]
            const color = colorMap[gasto.categoria] ?? '#94a3b8'
            return (
              <Card key={gasto.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                      <span className="truncate">{gasto.descripcion}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{gasto.categoria}</Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-bold tabular-nums">{formatARS(Number(gasto.monto_total))}</span>
                      {!cerrado && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 touch-manipulation motion-reduce:transition-none hover:bg-accent" onClick={() => { setEditingGasto(gasto); setFormOpen(true) }} aria-label={`Editar ${gasto.descripcion}`}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive touch-manipulation motion-reduce:transition-none hover:bg-destructive/10" onClick={() => setDeleteId(gasto.id)} aria-label={`Eliminar ${gasto.descripcion}`}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground mb-2 font-medium">Participantes</div>
                  <div className="divide-y border rounded-md">
                    {participantes.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">Sin participantes</div>
                    ) : (
                      participantes.map((p) => (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">{p.nombre}</span>
                            {p.es_usuario_actual && <Badge className="text-xs">yo</Badge>}
                            <span className="text-xs text-muted-foreground tabular-nums">sueldo: {formatARS(Number(p.sueldo))}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-sm font-medium tabular-nums">{formatARS(Number(p.monto_a_aportar))}</span>
                            {!cerrado && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive touch-manipulation motion-reduce:transition-none hover:bg-destructive/10" onClick={() => setDeletePartId(p.id)} aria-label={`Eliminar participante ${p.nombre}`}>
                                <Trash2 className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {!cerrado && (
                    <Button variant="ghost" size="sm" className="mt-2 text-xs touch-manipulation motion-reduce:transition-none hover:bg-accent" onClick={() => setAddingParticipanteGasto(gasto.id)}>
                      <UserPlus className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Agregar Participante
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <GastoCompartidoForm open={formOpen} onOpenChange={setFormOpen} mesId={mesId} gasto={editingGasto} categorias={categorias} predefinidos={predefinidos} miSueldo={miSueldo} onSuccess={() => { setFormOpen(false); router.refresh() }} />

      <ParticipanteForm
        open={!!addingParticipanteGasto}
        onOpenChange={(o) => !o && setAddingParticipanteGasto(null)}
        gastoCompartidoId={addingParticipanteGasto ?? ''}
        gastoMonto={gastos.find((g) => g.id === addingParticipanteGasto)?.monto_total ?? 0}
        participantesActuales={(gastos.find((g) => g.id === addingParticipanteGasto)?.participantes ?? []) as Participante[]}
        onSuccess={() => { setAddingParticipanteGasto(null); router.refresh() }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-balance">Eliminar gasto compartido</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro? Esto eliminará también todos los participantes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-manipulation">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-manipulation">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletePartId} onOpenChange={(o) => !o && setDeletePartId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-balance">Eliminar participante</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-manipulation">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-manipulation">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
