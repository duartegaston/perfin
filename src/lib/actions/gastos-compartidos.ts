'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { GastoCompartido, Participante, CategoriaCompartida } from '@/types'
import { revalidatePath } from 'next/cache'

async function checkMesAbierto(mesId: string): Promise<void> {
  const supabase = await getSupabaseServerClient()
  const { data: mes } = await supabase
    .from('meses')
    .select('cerrado')
    .eq('id', mesId)
    .single()
  if (mes?.cerrado) throw new Error('No se puede modificar un mes cerrado')
}

export async function getGastosCompartidos(mesId: string): Promise<GastoCompartido[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('gastos_compartidos')
    .select(`
      *,
      participantes:participantes_gasto(*)
    `)
    .eq('mes_id', mesId)
    .order('fecha', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as GastoCompartido[]
}

export async function createGastoCompartido(
  mesId: string,
  input: {
    categoria: CategoriaCompartida
    descripcion: string
    monto_total: number
    fecha: string
  },
  participantes?: Array<{ nombre: string; sueldo: number; es_usuario_actual: boolean }>
): Promise<GastoCompartido> {
  await checkMesAbierto(mesId)
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('gastos_compartidos')
    .insert({ ...input, mes_id: mesId })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (participantes && participantes.length > 0) {
    const { error: partError } = await supabase
      .from('participantes_gasto')
      .insert(participantes.map((p) => ({ ...p, gasto_compartido_id: data.id })))
    if (partError) throw new Error(partError.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/gastos-compartidos')
  return data as GastoCompartido
}

export async function updateGastoCompartido(
  id: string,
  input: Partial<{
    categoria: CategoriaCompartida
    descripcion: string
    monto_total: number
    fecha: string
  }>
): Promise<GastoCompartido> {
  const supabase = await getSupabaseServerClient()

  const { data: gasto } = await supabase
    .from('gastos_compartidos')
    .select('mes_id')
    .eq('id', id)
    .single()

  if (gasto) await checkMesAbierto(gasto.mes_id)

  const { data, error } = await supabase
    .from('gastos_compartidos')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/gastos-compartidos')
  return data as GastoCompartido
}

export async function deleteGastoCompartido(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { data: gasto } = await supabase
    .from('gastos_compartidos')
    .select('mes_id')
    .eq('id', id)
    .single()

  if (gasto) await checkMesAbierto(gasto.mes_id)

  const { error } = await supabase.from('gastos_compartidos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/gastos-compartidos')
}

export async function addParticipante(
  gastoCompartidoId: string,
  input: {
    nombre: string
    sueldo: number
    es_usuario_actual: boolean
  }
): Promise<Participante> {
  const supabase = await getSupabaseServerClient()

  const { data: gasto } = await supabase
    .from('gastos_compartidos')
    .select('mes_id')
    .eq('id', gastoCompartidoId)
    .single()

  if (gasto) await checkMesAbierto(gasto.mes_id)

  const { data, error } = await supabase
    .from('participantes_gasto')
    .insert({ ...input, gasto_compartido_id: gastoCompartidoId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/gastos-compartidos')
  return data as Participante
}

export async function updateParticipante(
  id: string,
  input: Partial<{
    nombre: string
    sueldo: number
    es_usuario_actual: boolean
  }>
): Promise<Participante> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('participantes_gasto')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/gastos-compartidos')
  return data as Participante
}

export async function deleteParticipante(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.from('participantes_gasto').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/gastos-compartidos')
}

export async function getAportePorCategoria(mesId: string): Promise<Record<string, number>> {
  const supabase = await getSupabaseServerClient()

  const { data: gastos } = await supabase
    .from('gastos_compartidos')
    .select(`
      categoria,
      participantes:participantes_gasto(monto_a_aportar, es_usuario_actual)
    `)
    .eq('mes_id', mesId)

  if (!gastos) return {}

  const result: Record<string, number> = {}
  for (const gasto of gastos) {
    const miParte = (gasto.participantes as Participante[]).find((p) => p.es_usuario_actual)
    if (miParte && Number(miParte.monto_a_aportar) > 0) {
      result[gasto.categoria] = (result[gasto.categoria] ?? 0) + Number(miParte.monto_a_aportar)
    }
  }
  return result
}

export async function copiarGastosCompartidosDelMesPrevio(
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

  // Get all shared expenses from previous month with participants
  const { data: gastosPrevios } = await supabase
    .from('gastos_compartidos')
    .select('*, participantes:participantes_gasto(*)')
    .eq('mes_id', mesPrevio.id)

  if (!gastosPrevios || gastosPrevios.length === 0) return 0

  // Copy each gasto with its participants
  for (const g of gastosPrevios) {
    const { data: nuevoGasto, error } = await supabase
      .from('gastos_compartidos')
      .insert({
        mes_id: mesId,
        categoria: g.categoria,
        descripcion: g.descripcion,
        monto_total: g.monto_total,
        fecha: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    const participantes = (g.participantes ?? []) as Participante[]
    if (participantes.length > 0) {
      const { error: partError } = await supabase
        .from('participantes_gasto')
        .insert(participantes.map((p) => ({
          gasto_compartido_id: nuevoGasto.id,
          nombre: p.nombre,
          sueldo: p.sueldo,
          es_usuario_actual: p.es_usuario_actual,
        })))
      if (partError) throw new Error(partError.message)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/gastos-compartidos')
  return gastosPrevios.length
}

export async function getAporteUsuario(mesId: string): Promise<number> {
  const supabase = await getSupabaseServerClient()

  const { data: gastos } = await supabase
    .from('gastos_compartidos')
    .select(`
      id,
      participantes:participantes_gasto(monto_a_aportar, es_usuario_actual)
    `)
    .eq('mes_id', mesId)

  if (!gastos) return 0

  let total = 0
  for (const gasto of gastos) {
    for (const p of (gasto.participantes as Participante[])) {
      if (p.es_usuario_actual) {
        total += Number(p.monto_a_aportar)
      }
    }
  }

  return total
}
