// Categories are now user-defined strings stored in categorias_usuario table.
// These type aliases keep backwards compatibility with existing code.
export type CategoriaPersonal = string
export type CategoriaCompartida = string

export interface CategoriaUsuario {
  id: string
  user_id: string
  tipo: 'personal' | 'compartido'
  nombre: string
  color: string
  activo: boolean
  orden: number
  created_at: string
}

export interface Usuario {
  id: string
  email: string
  nombre: string | null
  sueldo_neto: number
  created_at: string
}

export interface Mes {
  id: string
  user_id: string
  anio: number
  mes: number
  cerrado: boolean
  sueldo_mensual: number
  created_at: string
}

export interface GastoPersonal {
  id: string
  mes_id: string
  user_id: string
  categoria: string
  descripcion: string
  monto: number
  fecha: string
  es_fijo: boolean
  created_at: string
}

export interface GastoCompartido {
  id: string
  mes_id: string
  categoria: string
  descripcion: string
  monto_total: number
  fecha: string
  created_at: string
  participantes?: Participante[]
}

export interface Participante {
  id: string
  gasto_compartido_id: string
  nombre: string
  sueldo: number
  es_usuario_actual: boolean
  monto_a_aportar: number
  created_at: string
}

export interface ParticipantePredefinido {
  id: string
  user_id: string
  nombre: string
  sueldo: number
  created_at: string
}

export interface ResumenMensual {
  id: string
  mes_id: string
  resumen_texto: string
  recomendaciones_texto: string
  generado_en: string
}

// UI derived types
export interface DashboardData {
  mes: Mes
  usuario: Usuario
  gastos_personales: GastoPersonal[]
  gastos_compartidos: GastoCompartido[]
  total_gastos_personales: number
  aporte_compartido: number
  dinero_restante: number
  gastos_por_categoria: Record<string, number>
}

export interface HistorialMes {
  mes: Mes
  total_gastos_personales: number
  aporte_compartido: number
  dinero_restante: number
  resumen: ResumenMensual | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Fallback labels for backwards compatibility (old enum slug → display name)
export const CATEGORIA_PERSONAL_LABELS: Record<string, string> = {
  alimentacion: 'Alimentación',
  transporte: 'Transporte',
  salud: 'Salud',
  entretenimiento: 'Entretenimiento',
  ropa: 'Ropa',
  tecnologia: 'Tecnología',
  gym: 'Gym',
  suscripciones: 'Suscripciones',
  impuestos: 'Impuestos',
  otros: 'Otros',
}

export const CATEGORIA_COMPARTIDA_LABELS: Record<string, string> = {
  alquiler: 'Alquiler',
  expensas: 'Expensas',
  servicios: 'Servicios',
  supermercado: 'Supermercado',
  limpieza: 'Limpieza',
  mascotas: 'Mascotas',
  salidas: 'Salidas',
  viajes: 'Viajes',
  otros: 'Otros',
}

export const CATEGORIA_PERSONAL_COLORS: Record<string, string> = {
  alimentacion: '#f97316',
  transporte: '#3b82f6',
  salud: '#22c55e',
  entretenimiento: '#a855f7',
  ropa: '#ec4899',
  tecnologia: '#06b6d4',
  gym: '#eab308',
  suscripciones: '#6366f1',
  impuestos: '#ef4444',
  otros: '#94a3b8',
}
