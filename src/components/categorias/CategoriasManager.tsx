'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Settings2, Plus, Pencil, Check, X, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createCategoria, updateCategoria, toggleCategoria, deleteCategoria } from '@/lib/actions/categorias'
import type { CategoriaUsuario } from '@/types'

const PRESET_COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#a855f7',
  '#ec4899', '#06b6d4', '#eab308', '#6366f1',
  '#ef4444', '#10b981', '#f59e0b', '#94a3b8',
]

interface Props {
  categorias: CategoriaUsuario[]
  userId: string
  tipo: 'personal' | 'compartido'
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={cn(
            'w-5 h-5 rounded-full transition-transform hover:scale-110',
            value === c && 'ring-2 ring-offset-1 ring-primary scale-110'
          )}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
          aria-label={c}
        />
      ))}
    </div>
  )
}

export default function CategoriasManager({ categorias, userId, tipo }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newNombre, setNewNombre] = useState('')
  const [newColor, setNewColor] = useState('#94a3b8')
  const [error, setError] = useState<string | null>(null)

  function startEdit(cat: CategoriaUsuario) {
    setEditingId(cat.id)
    setEditNombre(cat.nombre)
    setEditColor(cat.color)
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setError(null)
  }

  function handleSaveEdit(id: string) {
    if (!editNombre.trim()) return
    startTransition(async () => {
      try {
        await updateCategoria(id, { nombre: editNombre.trim(), color: editColor })
        setEditingId(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handleToggle(id: string, activo: boolean) {
    startTransition(async () => {
      await toggleCategoria(id, !activo)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteCategoria(id)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newNombre.trim()) return
    startTransition(async () => {
      try {
        await createCategoria(userId, tipo, newNombre.trim(), newColor)
        setNewNombre('')
        setNewColor('#94a3b8')
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
        aria-label="Gestionar categorías"
      >
        <Settings2 className="h-4 w-4" aria-hidden="true" />
        Categorías
      </SheetTrigger>

      <SheetContent side="right" className="w-80 flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle>Gestionar Categorías</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {categorias.map((cat) => (
            <div
              key={cat.id}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-2',
                !cat.activo && 'opacity-45'
              )}
            >
              {editingId === cat.id ? (
                <div className="flex-1 space-y-2">
                  <ColorPicker value={editColor} onChange={setEditColor} />
                  <div className="flex gap-1">
                    <Input
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="h-7 text-sm"
                      maxLength={30}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(cat.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                    />
                    <Button size="icon" className="h-7 w-7 shrink-0" onClick={() => handleSaveEdit(cat.id)} disabled={isPending}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelEdit}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                  <span className="flex-1 text-sm truncate">{cat.nombre}</span>
                  <div className="flex gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6 touch-manipulation" onClick={() => startEdit(cat)} aria-label={`Editar ${cat.nombre}`}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 touch-manipulation" onClick={() => handleToggle(cat.id, cat.activo)} aria-label={cat.activo ? `Ocultar ${cat.nombre}` : `Mostrar ${cat.nombre}`}>
                      {cat.activo ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive touch-manipulation hover:bg-destructive/10" onClick={() => handleDelete(cat.id)} aria-label={`Eliminar ${cat.nombre}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="px-4 text-sm text-destructive" role="alert">{error}</p>
        )}

        <div className="border-t px-4 py-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Nueva categoría</p>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Nombre…"
              className="text-sm"
              maxLength={30}
            />
            <Button type="submit" size="icon" className="shrink-0" disabled={isPending || !newNombre.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
