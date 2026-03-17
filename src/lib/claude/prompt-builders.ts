import type { DashboardData, HistorialMes } from '@/types'
import { getMesLabel, formatARS } from '@/lib/utils'

export function buildResumenPrompt(data: DashboardData): string {
  const { mes, gastos_compartidos, total_gastos_personales, aporte_compartido, dinero_restante, gastos_por_categoria } = data

  const mesLabel = getMesLabel(mes.mes, mes.anio)
  const sueldo = Number(mes.sueldo_mensual)

  const categoriasDetalle = Object.entries(gastos_por_categoria)
    .filter(([, monto]) => monto > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, monto]) => {
      const pct = sueldo > 0 ? ((monto / sueldo) * 100).toFixed(1) : '0'
      return `  - ${cat}: ${formatARS(monto)} (${pct}% del sueldo)`
    })
    .join('\n')

  const gastosCompartidosDetalle = gastos_compartidos
    .map((g) => `  - ${g.descripcion} (${g.categoria}): ${formatARS(Number(g.monto_total))}`)
    .join('\n')

  return `Sos un asistente financiero personal. Analizá el siguiente resumen financiero del mes de ${mesLabel} y generá:
1. Un resumen claro y conciso del mes (2-3 párrafos)
2. Entre 3 y 5 recomendaciones concretas y accionables para mejorar las finanzas

DATOS DEL MES:
- Período: ${mesLabel}
- Sueldo neto: ${formatARS(sueldo)}
- Total gastos personales: ${formatARS(total_gastos_personales)} (${sueldo > 0 ? ((total_gastos_personales / sueldo) * 100).toFixed(1) : 0}% del sueldo)
- Aporte a gastos compartidos: ${formatARS(aporte_compartido)}
- Dinero restante: ${formatARS(dinero_restante)}

GASTOS PERSONALES POR CATEGORÍA:
${categoriasDetalle || '  (sin gastos registrados)'}

GASTOS COMPARTIDOS (total del hogar):
${gastosCompartidosDetalle || '  (sin gastos compartidos)'}
- Total gastos compartidos: ${formatARS(gastos_compartidos.reduce((s, g) => s + Number(g.monto_total), 0))}

Respondé en español argentino, de manera amigable pero profesional. Sé específico con los números.

Formato de respuesta (JSON):
{
  "resumen": "texto del resumen aquí",
  "recomendaciones": "lista de recomendaciones aquí"
}`
}

export function buildChatContext(
  currentData: DashboardData | null,
  historial: HistorialMes[],
  userName: string | null
): string {
  const nombre = userName ?? 'Usuario'

  const sections: string[] = [
    `Sos un asistente financiero personal para ${nombre}. Tenés acceso completo a sus datos financieros: gastos individuales, categorías, gastos compartidos con participantes, e historial de los últimos meses.`,
    `Respondé en español argentino, de manera amigable y concisa. Usá los datos reales para dar respuestas específicas y útiles.`,
  ]

  // Full detail for the most recent month
  if (currentData) {
    const { mes, gastos_personales, gastos_compartidos, gastos_por_categoria, total_gastos_personales, aporte_compartido, dinero_restante } = currentData
    const mesLabel = getMesLabel(mes.mes, mes.anio)
    const sueldo = Number(mes.sueldo_mensual)

    // Personal expenses grouped by category
    const gastosByCategory: Record<string, typeof gastos_personales> = {}
    for (const g of gastos_personales) {
      if (!gastosByCategory[g.categoria]) gastosByCategory[g.categoria] = []
      gastosByCategory[g.categoria].push(g)
    }

    const personalDetalle = Object.entries(gastosByCategory)
      .sort(([, a], [, b]) => b.reduce((s, g) => s + Number(g.monto), 0) - a.reduce((s, g) => s + Number(g.monto), 0))
      .map(([cat, items]) => {
        const subtotal = items.reduce((s, g) => s + Number(g.monto), 0)
        const pct = sueldo > 0 ? ((subtotal / sueldo) * 100).toFixed(1) : '0'
        const itemLines = items
          .sort((a, b) => Number(b.monto) - Number(a.monto))
          .map((g) => `    · ${g.descripcion}: ${formatARS(Number(g.monto))}${g.es_fijo ? ' (fijo)' : ''}`)
          .join('\n')
        return `  ${cat} — ${formatARS(subtotal)} (${pct}% sueldo)\n${itemLines}`
      })
      .join('\n')

    // Shared expenses with participants
    const compartidosDetalle = gastos_compartidos
      .map((g) => {
        const participantes = (g.participantes ?? [])
          .map((p) => `    · ${p.nombre}: aporta ${formatARS(Number(p.monto_a_aportar))} (sueldo ${formatARS(Number(p.sueldo))})`)
          .join('\n')
        return `  ${g.descripcion} (${g.categoria}) — total ${formatARS(Number(g.monto_total))}\n${participantes || '    · Sin participantes cargados'}`
      })
      .join('\n')

    // Category summary
    const categoriaSummary = Object.entries(gastos_por_categoria)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, monto]) => `  - ${cat}: ${formatARS(monto)}`)
      .join('\n')

    sections.push(`
== MES ACTUAL: ${mesLabel} ==
Sueldo neto: ${formatARS(sueldo)}
Total gastos personales: ${formatARS(total_gastos_personales)} (${sueldo > 0 ? ((total_gastos_personales / sueldo) * 100).toFixed(1) : 0}% del sueldo)
Aporte a gastos compartidos: ${formatARS(aporte_compartido)}
Dinero restante: ${formatARS(dinero_restante)}

GASTOS PERSONALES DETALLADOS:
${personalDetalle || '  (sin gastos personales)'}

GASTOS COMPARTIDOS DETALLADOS:
${compartidosDetalle || '  (sin gastos compartidos)'}

RESUMEN POR CATEGORÍA (personal + compartido):
${categoriaSummary || '  (sin gastos)'}`)
  }

  // Historical summary (previous months)
  const prevHistorial = historial.slice(currentData ? 1 : 0)
  if (prevHistorial.length > 0) {
    const historialTexto = prevHistorial
      .map((h) => {
        const mesLabel = getMesLabel(h.mes.mes, h.mes.anio)
        const sueldo = Number(h.mes.sueldo_mensual)
        return `  ${mesLabel}: sueldo ${formatARS(sueldo)}, gastos personales ${formatARS(h.total_gastos_personales)}, aporte compartido ${formatARS(h.aporte_compartido)}, restante ${formatARS(h.dinero_restante)} (${sueldo > 0 ? ((h.dinero_restante / sueldo) * 100).toFixed(1) : 0}%)`
      })
      .join('\n')

    sections.push(`
== HISTORIAL MESES ANTERIORES ==
${historialTexto}`)
  }

  if (!currentData && historial.length === 0) {
    sections.push('Todavía no hay datos financieros cargados.')
  }

  return sections.join('\n')
}
