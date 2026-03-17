'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMesLabel, getPeriodoString } from '@/lib/utils'
import Sidebar from './Sidebar'

interface HeaderProps {
  email: string
}

export default function Header({ email }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const periodo = searchParams.get('periodo')
  let anio: number, mes: number
  if (periodo && /^\d{4}-\d{2}$/.test(periodo)) {
    ;[anio, mes] = periodo.split('-').map(Number)
  } else {
    const now = new Date()
    anio = now.getFullYear()
    mes = now.getMonth() + 1
  }

  function navigate(deltaMonths: number) {
    let newMes = mes + deltaMonths
    let newAnio = anio

    if (newMes > 12) { newMes = 1; newAnio++ }
    if (newMes < 1) { newMes = 12; newAnio-- }

    const params = new URLSearchParams(searchParams.toString())
    params.set('periodo', getPeriodoString(newAnio, newMes))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4">
      {/* Mobile sidebar trigger */}
      <div className="md:hidden">
        <Sidebar />
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Mes anterior"
          className="touch-manipulation motion-reduce:transition-none hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="text-sm font-medium min-w-[140px] text-center select-none">
          {getMesLabel(mes, anio)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(1)}
          aria-label="Mes siguiente"
          className="touch-manipulation motion-reduce:transition-none hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="ml-auto text-sm text-muted-foreground hidden sm:block truncate max-w-[200px]" title={email}>
        {email}
      </div>
    </header>
  )
}
