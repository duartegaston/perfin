import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatARS(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function parseARSInput(s: string): number {
  // Strip currency symbols, dots (thousand separators), and spaces
  const cleaned = s.replace(/[$ .]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

export function getMesLabel(mes: number, anio: number): string {
  const date = new Date(anio, mes - 1, 1)
  return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function calcularPorcentaje(parte: number, total: number): number {
  if (total === 0) return 0
  return Math.round((parte / total) * 100)
}

export function getPeriodoString(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}`
}

export function parsePeriodoString(periodo: string): { anio: number; mes: number } | null {
  const match = periodo.match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  return { anio: parseInt(match[1]), mes: parseInt(match[2]) }
}

