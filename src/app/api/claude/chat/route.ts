import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getHistorialData, getDashboardData } from '@/lib/actions/dashboard'
import { buildChatContext } from '@/lib/claude/prompt-builders'
import { groq } from '@/lib/claude/client'

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 })
  }

  const body = await request.json()
  const { messages } = body

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages requerido' }), { status: 400 })
  }

  try {
    const [historial, { data: usuario }] = await Promise.all([
      getHistorialData(user.id),
      supabase.from('usuarios').select('nombre').eq('id', user.id).single(),
    ])

    // Fetch full detail for the most recent month
    const currentMesId = historial[0]?.mes?.id ?? null
    const currentData = currentMesId ? await getDashboardData(user.id, currentMesId) : null

    const systemContext = buildChatContext(currentData, historial, usuario?.nombre ?? null)

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: systemContext },
        ...messages,
      ],
    })

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(enc.encode(text))
          }
        } catch (streamErr) {
          const raw = streamErr instanceof Error ? streamErr.message : String(streamErr)
          const friendly = raw.includes('rate_limit') || raw.includes('quota')
            ? 'Límite de uso alcanzado. Intentá de nuevo en unos minutos.'
            : `Error del asistente: ${raw}`
          controller.enqueue(enc.encode(`\x00ERROR\x00${friendly}`))
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
