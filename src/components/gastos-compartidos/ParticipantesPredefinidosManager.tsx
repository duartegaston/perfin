'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createParticipantePredefinido,
  updateParticipantePredefinido,
  deleteParticipantePredefinido,
} from '@/lib/actions/participantes-predefinidos'
import { formatARS } from '@/lib/utils'
import type { ParticipantePredefinido } from '@/types'

interface Props {
  predefinidos: ParticipantePredefinido[]
  userId: string
}

export default function ParticipantesPredefinidosManager({ predefinidos, userId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editSueldo, setEditSueldo] = useState('')
  const [newNombre, setNewNombre] = useState('')
  const [newSueldo, setNewSueldo] = useState('')
  const [error, setError] = useState<string | null>(null)

  function startEdit(p: ParticipantePredefinido) {
    setEditingId(p.id)
    setEditNombre(p.nombre)
    setEditSueldo(String(p.sueldo))
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setError(null)
  }

  function handleSaveEdit(id: string) {
    const sueldo = parseFloat(editSueldo.replace(',', '.'))
    if (!editNombre.trim() || isNaN(sueldo) || sueldo < 0) return
    startTransition(async () => {
      try {
        await updateParticipantePredefinido(id, { nombre: editNombre.trim(), sueldo })
        setEditingId(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteParticipantePredefinido(id)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const sueldo = parseFloat(newSueldo.replace(',', '.'))
    if (!newNombre.trim() || isNaN(sueldo) || sueldo < 0) return
    startTransition(async () => {
      try {
        await createParticipantePredefinido(userId, { nombre: newNombre.trim(), sueldo })
        setNewNombre('')
        setNewSueldo('')
        setError(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear')
      }
    })
  }

  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
        aria-label="Gestionar participantes predefinidos"
      >
        <Users className="h-4 w-4" aria-hidden="true" />
        Participantes
      </SheetTrigger>

      <SheetContent side="right" className="w-80 flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle>Participantes habituales</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {predefinidos.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-4 text-center">
              Agregá las personas que participan habitualmente en los gastos compartidos.
            </p>
          ) : (
            predefinidos.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-2">
                {editingId === p.id ? (
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="h-7 text-sm"
                      maxLength={50}
                      placeholder="Nombre"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Input
                        value={editSueldo}
                        onChange={(e) => setEditSueldo(e.target.value)}
                        className="h-7 text-sm tabular-nums"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Sueldo"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(p.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                      <Button size="icon" className="h-7 w-7 shrink-0" onClick={() => handleSaveEdit(p.id)} disabled={isPending}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelEdit}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.nombre}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">{formatARS(Number(p.sueldo))}</div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6 touch-manipulation" onClick={() => startEdit(p)} aria-label={`Editar ${p.nombre}`}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive touch-manipulation hover:bg-destructive/10" onClick={() => handleDelete(p.id)} aria-label={`Eliminar ${p.nombre}`}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {error && (
          <p className="px-4 text-sm text-destructive" role="alert">{error}</p>
        )}

        <div className="border-t px-4 py-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Agregar participante</p>
          <form onSubmit={handleAdd} className="space-y-2">
            <Input
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Nombre…"
              className="text-sm"
              maxLength={50}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="new-sueldo" className="sr-only">Sueldo</Label>
                <Input
                  id="new-sueldo"
                  value={newSueldo}
                  onChange={(e) => setNewSueldo(e.target.value)}
                  placeholder="Sueldo ($)"
                  className="text-sm tabular-nums"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
              <Button type="submit" size="icon" className="shrink-0" disabled={isPending || !newNombre.trim() || !newSueldo.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
