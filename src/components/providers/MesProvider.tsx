'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { parsePeriodoString } from '@/lib/utils'

interface MesContextValue {
  mesId: string | null
  anio: number
  mes: number
  cerrado: boolean
  setMesId: (id: string) => void
  setCerrado: (v: boolean) => void
}

const MesContext = createContext<MesContextValue | null>(null)

export function useMes() {
  const ctx = useContext(MesContext)
  if (!ctx) throw new Error('useMes must be used inside MesProvider')
  return ctx
}

export default function MesProvider({
  children,
  initialMesId,
  initialAnio,
  initialMes,
  initialCerrado,
}: {
  children: React.ReactNode
  initialMesId: string
  initialAnio: number
  initialMes: number
  initialCerrado: boolean
}) {
  const [mesId, setMesId] = useState(initialMesId)
  const [anio, setAnio] = useState(initialAnio)
  const [mes, setMes] = useState(initialMes)
  const [cerrado, setCerrado] = useState(initialCerrado)

  const searchParams = useSearchParams()

  useEffect(() => {
    const periodo = searchParams.get('periodo')
    if (periodo) {
      const parsed = parsePeriodoString(periodo)
      if (parsed) {
        setAnio(parsed.anio)
        setMes(parsed.mes)
      }
    }
  }, [searchParams])

  return (
    <MesContext.Provider value={{ mesId, anio, mes, cerrado, setMesId, setCerrado }}>
      {children}
    </MesContext.Provider>
  )
}
