import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/actions/dashboard'
import { buildResumenPrompt } from '@/lib/claude/prompt-builders'
import { groq } from '@/lib/claude/client'

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { mesId } = body

  if (!mesId) {
    return NextResponse.json({ error: 'mesId requerido' }, { status: 400 })
  }

  try {
    const data = await getDashboardData(user.id, mesId)
    const prompt = buildResumenPrompt(data)

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = completion.choices[0]?.message?.content ?? ''

    let resumen_texto = responseText
    let recomendaciones_texto = ''

    try {
      const parsed = JSON.parse(responseText)
      resumen_texto = parsed.resumen ?? responseText
      recomendaciones_texto = parsed.recomendaciones ?? ''
    } catch {
      // Not JSON, use raw text
    }

    const { error } = await supabase
      .from('resumenes_mensuales')
      .upsert(
        { mes_id: mesId, resumen_texto, recomendaciones_texto },
        { onConflict: 'mes_id' }
      )

    if (error) throw error

    return NextResponse.json({ resumen_texto, recomendaciones_texto })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
