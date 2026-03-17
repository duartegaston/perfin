'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { GastoPersonal, CategoriaPersonal } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getGastosPersonales(mesId: string): Promise<GastoPersonal[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('gastos_personales')
    .select('*')
    .eq('mes_id', mesId)
    .order('fecha', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as GastoPersonal[]
}

export async function createGastoPersonal(
  mesId: string,
  userId: string,
  input: {
    categoria: CategoriaPersonal
    descripcion: string
    monto: number
    fecha: string
    es_fijo: boolean
  }
): Promise<GastoPersonal> {
  const supabase = await getSupabaseServerClient()

  // Check mes is not closed
  const { data: mes } = await supabase
    .from('meses')
    .select('cerrado')
    .eq('id', mesId)
    .single()

  if (mes?.cerrado) throw new Error('No se puede modificar un mes cerrado')

  const { data, error } = await supabase
    .from('gastos_personales')
    .insert({ ...input, mes_id: mesId, user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/gastos-personales')
  return data as GastoPersonal
}

export async function updateGastoPersonal(
  id: string,
  input: Partial<{
    categoria: CategoriaPersonal
    descripcion: string
    monto: number
    fecha: string
    es_fijo: boolean
  }>
): Promise<GastoPersonal> {
  const supabase = await getSupabaseServerClient()

  const { data: gasto } = await supabase
    .from('gastos_personales')
    .select('mes_id')
    .eq('id', id)
    .single()

  if (gasto) {
    const { data: mes } = await supabase
      .from('meses')
      .select('cerrado')
      .eq('id', gasto.mes_id)
      .single()
    if (mes?.cerrado) throw new Error('No se puede modificar un mes cerrado')
  }

  const { data, error } = await supabase
    .from('gastos_personales')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/gastos-personales')
  return data as GastoPersonal
}

export async function deleteGastoPersonal(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { data: gasto } = await supabase
    .from('gastos_personales')
    .select('mes_id')
    .eq('id', id)
    .single()

  if (gasto) {
    const { data: mes } = await supabase
      .from('meses')
      .select('cerrado')
      .eq('id', gasto.mes_id)
      .single()
    if (mes?.cerrado) throw new Error('No se puede modificar un mes cerrado')
  }

  const { error } = await supabase.from('gastos_personales').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/gastos-personales')
}

export async function getGastosPorCategoria(
  mesId: string
): Promise<Record<CategoriaPersonal, number>> {
  const gastos = await getGastosPersonales(mesId)
  const totales: Partial<Record<CategoriaPersonal, number>> = {}

  for (const gasto of gastos) {
    totales[gasto.categoria] = (totales[gasto.categoria] ?? 0) + Number(gasto.monto)
  }

  return totales as Record<CategoriaPersonal, number>
}
