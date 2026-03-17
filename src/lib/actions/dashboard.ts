'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getGastosPersonales, getGastosPorCategoria } from './gastos-personales'
import { getGastosCompartidos, getAporteUsuario, getAportePorCategoria } from './gastos-compartidos'
import { getUltimos6Meses } from './meses'
import type { DashboardData, HistorialMes, Usuario, Mes } from '@/types'

export async function getDashboardData(userId: string, mesId: string): Promise<DashboardData> {
  const supabase = await getSupabaseServerClient()

  const [
    { data: mes },
    { data: usuario },
    gastos_personales,
    gastos_compartidos,
    gastos_por_categoria_personal,
    aporte_compartido,
    aporte_por_categoria_compartido,
  ] = await Promise.all([
    supabase.from('meses').select('*').eq('id', mesId).single(),
    supabase.from('usuarios').select('*').eq('id', userId).single(),
    getGastosPersonales(mesId),
    getGastosCompartidos(mesId),
    getGastosPorCategoria(mesId),
    getAporteUsuario(mesId),
    getAportePorCategoria(mesId),
  ])

  // Merge personal + shared categories
  const gastos_por_categoria = { ...gastos_por_categoria_personal }
  for (const [cat, monto] of Object.entries(aporte_por_categoria_compartido)) {
    gastos_por_categoria[cat] = (gastos_por_categoria[cat] ?? 0) + monto
  }

  const total_gastos_personales = gastos_personales.reduce(
    (sum, g) => sum + Number(g.monto),
    0
  )

  const sueldo = Number(mes?.sueldo_mensual ?? 0)
  const dinero_restante = sueldo - total_gastos_personales - aporte_compartido

  return {
    mes: mes as Mes,
    usuario: usuario as Usuario,
    gastos_personales,
    gastos_compartidos,
    total_gastos_personales,
    aporte_compartido,
    dinero_restante,
    gastos_por_categoria,
  }
}

export async function getHistorialData(userId: string): Promise<HistorialMes[]> {
  const supabase = await getSupabaseServerClient()
  const meses = await getUltimos6Meses(userId)

  const historial: HistorialMes[] = await Promise.all(
    meses.map(async (mes: Mes) => {
      const [gastos_personales, aporte_compartido, { data: resumen }] = await Promise.all([
        getGastosPersonales(mes.id),
        getAporteUsuario(mes.id),
        supabase
          .from('resumenes_mensuales')
          .select('*')
          .eq('mes_id', mes.id)
          .maybeSingle(),
      ])

      const total_gastos_personales = gastos_personales.reduce(
        (sum, g) => sum + Number(g.monto),
        0
      )

      return {
        mes,
        total_gastos_personales,
        aporte_compartido,
        dinero_restante: Number(mes.sueldo_mensual) - total_gastos_personales - aporte_compartido,
        resumen: resumen ?? null,
      }
    })
  )

  return historial
}
