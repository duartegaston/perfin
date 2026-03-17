'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { CategoriaUsuario } from '@/types'
import { revalidatePath } from 'next/cache'

const DEFAULT_PERSONAL: { nombre: string; color: string }[] = [
  { nombre: 'Alimentación', color: '#f97316' },
  { nombre: 'Transporte', color: '#3b82f6' },
  { nombre: 'Salud', color: '#22c55e' },
  { nombre: 'Entretenimiento', color: '#a855f7' },
  { nombre: 'Ropa', color: '#ec4899' },
  { nombre: 'Tecnología', color: '#06b6d4' },
  { nombre: 'Gym', color: '#eab308' },
  { nombre: 'Suscripciones', color: '#6366f1' },
  { nombre: 'Impuestos', color: '#ef4444' },
  { nombre: 'Otros', color: '#94a3b8' },
]

const DEFAULT_COMPARTIDAS: { nombre: string; color: string }[] = [
  { nombre: 'Alquiler', color: '#f97316' },
  { nombre: 'Expensas', color: '#3b82f6' },
  { nombre: 'Servicios', color: '#22c55e' },
  { nombre: 'Supermercado', color: '#a855f7' },
  { nombre: 'Limpieza', color: '#ec4899' },
  { nombre: 'Mascotas', color: '#06b6d4' },
  { nombre: 'Salidas', color: '#eab308' },
  { nombre: 'Viajes', color: '#6366f1' },
  { nombre: 'Otros', color: '#94a3b8' },
]

export async function ensureDefaultCategorias(userId: string): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { count } = await supabase
    .from('categorias_usuario')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count && count > 0) return

  const defaults = [
    ...DEFAULT_PERSONAL.map((c, i) => ({ ...c, user_id: userId, tipo: 'personal' as const, orden: i })),
    ...DEFAULT_COMPARTIDAS.map((c, i) => ({ ...c, user_id: userId, tipo: 'compartido' as const, orden: i })),
  ]

  await supabase.from('categorias_usuario').insert(defaults)
}

export async function getCategorias(
  userId: string,
  tipo: 'personal' | 'compartido'
): Promise<CategoriaUsuario[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('categorias_usuario')
    .select('*')
    .eq('user_id', userId)
    .eq('tipo', tipo)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as CategoriaUsuario[]
}

export async function createCategoria(
  userId: string,
  tipo: 'personal' | 'compartido',
  nombre: string,
  color: string
): Promise<CategoriaUsuario> {
  const supabase = await getSupabaseServerClient()

  const { count } = await supabase
    .from('categorias_usuario')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tipo', tipo)

  const { data, error } = await supabase
    .from('categorias_usuario')
    .insert({ user_id: userId, tipo, nombre, color, orden: count ?? 99 })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe una categoría con ese nombre')
    throw new Error(error.message)
  }

  revalidatePath('/gastos-personales')
  revalidatePath('/gastos-compartidos')
  return data as CategoriaUsuario
}

export async function updateCategoria(
  id: string,
  input: { nombre?: string; color?: string }
): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('categorias_usuario')
    .update(input)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe una categoría con ese nombre')
    throw new Error(error.message)
  }

  revalidatePath('/gastos-personales')
  revalidatePath('/gastos-compartidos')
}

export async function toggleCategoria(id: string, activo: boolean): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('categorias_usuario')
    .update({ activo })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/gastos-personales')
  revalidatePath('/gastos-compartidos')
}

export async function deleteCategoria(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('categorias_usuario')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/gastos-personales')
  revalidatePath('/gastos-compartidos')
}
