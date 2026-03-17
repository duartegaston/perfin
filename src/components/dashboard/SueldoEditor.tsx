'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { actualizarSueldo } from '@/lib/actions/meses'
import { formatARS } from '@/lib/utils'

interface Props {
  mesId: string
  sueldo: number
}

export default function SueldoEditor({ mesId, sueldo }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(sueldo))
  const [isPending, startTransition] = useTransition()

  function handleStart() {
    setValue(String(sueldo))
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
  }

  function handleSave() {
    const num = parseFloat(value.replace(',', '.'))
    if (isNaN(num) || num < 0) return
    startTransition(async () => {
      await actualizarSueldo(mesId, num)
      setEditing(false)
      router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-36 text-lg font-bold tabular-nums"
          autoFocus
          min="0"
          step="0.01"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
        />
        <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleSave} disabled={isPending}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="text-2xl font-bold tabular-nums tracking-tight">{formatARS(sueldo)}</span>
      <button
        onClick={handleStart}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent touch-manipulation"
        aria-label="Editar sueldo neto"
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </button>
    </div>
  )
}
