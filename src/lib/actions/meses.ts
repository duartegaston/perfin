'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ensureDefaultCategorias } from './categorias'
import type { Mes } from '@/types'

export async function getOrCreateMes(userId: string, anio: number, mes: number): Promise<Mes> {
  const supabase = await getSupabaseServerClient()

  // Try to fetch existing
  const { data: existing } = await supabase
    .from('meses')
    .select('*')
    .eq('user_id', userId)
    .eq('anio', anio)
    .eq('mes', mes)
    .single()

  if (existing) return existing as Mes

  // Ensure usuario row exists — trigger may not have fired for users created
  // before migration 003 was applied (e.g. during magic link testing)
  const { data: existingUser } = await supabase
    .from('usuarios')
    .select('id, sueldo_neto')
    .eq('id', userId)
    .maybeSingle()

  if (!existingUser) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('usuarios')
      .insert({ id: userId, email: user?.email ?? '' })
  }

  // Seed default categories if this user has none
  await ensureDefaultCategorias(userId)

  const sueldo = existingUser?.sueldo_neto ?? 0

  const { data: newMes, error } = await supabase
    .from('meses')
    .insert({ user_id: userId, anio, mes, sueldo_mensual: sueldo })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return newMes as Mes
}

export async function getMesActual(userId: string): Promise<Mes> {
  const now = new Date()
  return getOrCreateMes(userId, now.getFullYear(), now.getMonth() + 1)
}

export async function getMesByPeriod(
  userId: string,
  anio: number,
  mes: number
): Promise<Mes | null> {
  const supabase = await getSupabaseServerClient()

  const { data } = await supabase
    .from('meses')
    .select('*')
    .eq('user_id', userId)
    .eq('anio', anio)
    .eq('mes', mes)
    .single()

  return data as Mes | null
}

export async function getUltimos6Meses(userId: string): Promise<Mes[]> {
  const supabase = await getSupabaseServerClient()

  const { data } = await supabase
    .from('meses')
    .select('*')
    .eq('user_id', userId)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .limit(6)

  return (data ?? []) as Mes[]
}

export async function cerrarMes(mesId: string): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('meses')
    .update({ cerrado: true })
    .eq('id', mesId)

  if (error) throw new Error(error.message)
}

export async function reabrirMes(mesId: string): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('meses')
    .update({ cerrado: false })
    .eq('id', mesId)

  if (error) throw new Error(error.message)
}

export async function actualizarSueldo(mesId: string, sueldo: number): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { data: mes, error } = await supabase
    .from('meses')
    .update({ sueldo_mensual: sueldo })
    .eq('id', mesId)
    .select('user_id')
    .single()

  if (error) throw new Error(error.message)

  // Also update the default salary so new months inherit it
  if (mes) {
    await supabase
      .from('usuarios')
      .update({ sueldo_neto: sueldo })
      .eq('id', mes.user_id)
  }
}

export async function copiarGastosFijosDelMesPrevio(
  mesId: string,
  userId: string
): Promise<number> {
  const supabase = await getSupabaseServerClient()

  // Get current month info
  const { data: mesActual } = await supabase
    .from('meses')
    .select('anio, mes')
    .eq('id', mesId)
    .single()

  if (!mesActual) throw new Error('Mes no encontrado')

  // Find previous month
  let prevAnio = mesActual.anio
  let prevMes = mesActual.mes - 1
  if (prevMes === 0) { prevMes = 12; prevAnio-- }

  const { data: mesPrevio } = await supabase
    .from('meses')
    .select('id')
    .eq('user_id', userId)
    .eq('anio', prevAnio)
    .eq('mes', prevMes)
    .single()

  if (!mesPrevio) throw new Error('No hay mes previo')

  // Get fixed expenses from previous month
  const { data: gastosFijos } = await supabase
    .from('gastos_personales')
    .select('*')
    .eq('mes_id', mesPrevio.id)
    .eq('es_fijo', true)

  if (!gastosFijos || gastosFijos.length === 0) return 0

  // Copy them to current month
  const nuevosGastos = gastosFijos.map((g) => ({
    mes_id: mesId,
    user_id: userId,
    categoria: g.categoria,
    descripcion: g.descripcion,
    monto: g.monto,
    fecha: new Date().toISOString().split('T')[0],
    es_fijo: true,
  }))

  const { error } = await supabase.from('gastos_personales').insert(nuevosGastos)
  if (error) throw new Error(error.message)

  return nuevosGastos.length
}
