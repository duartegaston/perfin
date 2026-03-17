'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { ParticipantePredefinido } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getParticipantesPredefinidos(userId: string): Promise<ParticipantePredefinido[]> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('participantes_predefinidos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ParticipantePredefinido[]
}

export async function createParticipantePredefinido(
  userId: string,
  input: { nombre: string; sueldo: number }
): Promise<ParticipantePredefinido> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('participantes_predefinidos')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/gastos-compartidos')
  return data as ParticipantePredefinido
}

export async function updateParticipantePredefinido(
  id: string,
  input: Partial<{ nombre: string; sueldo: number }>
): Promise<ParticipantePredefinido> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('participantes_predefinidos')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/gastos-compartidos')
  return data as ParticipantePredefinido
}

export async function deleteParticipantePredefinido(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from('participantes_predefinidos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/gastos-compartidos')
}
