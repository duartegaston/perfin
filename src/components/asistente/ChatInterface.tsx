'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types'

interface Props {
  userName: string | null
}

export default function ChatInterface({ userName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hola${userName ? ` ${userName}` : ''}! Soy tu asistente financiero. Tengo acceso a tu historial de los últimos meses. ¿En qué te puedo ayudar?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || isStreaming) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage, assistantMessage]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)

    try {
      const apiMessages = newMessages
        .filter((m) => m.id !== assistantMessage.id)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok || !res.body) {
        throw new Error('Error al conectar con el asistente')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk

        // Check for server-side stream error marker
        const errorIdx = fullText.indexOf('\x00ERROR\x00')
        if (errorIdx !== -1) {
          const errorMsg = fullText.slice(errorIdx + 7)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: errorMsg } : m
            )
          )
          setIsStreaming(false)
          return
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: fullText } : m
          )
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: 'Lo siento, ocurrió un error. Intentá de nuevo.' }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" role="log" aria-live="polite" aria-label="Conversación con el asistente">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
              aria-hidden="true"
            >
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              {msg.content || (
                <span className="inline-flex gap-1" aria-label="Escribiendo…">
                  <span className="animate-bounce motion-reduce:animate-none">·</span>
                  <span className="animate-bounce motion-reduce:animate-none delay-100">·</span>
                  <span className="animate-bounce motion-reduce:animate-none delay-200">·</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </Card>

      <div className="flex gap-2 mt-4">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu pregunta… (Enter para enviar)"
          className="resize-none min-h-[44px] max-h-32"
          rows={1}
          disabled={isStreaming}
          aria-label="Mensaje para el asistente"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          size="icon"
          className="flex-shrink-0 h-11 w-11 touch-manipulation motion-reduce:transition-none"
          aria-label="Enviar mensaje"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
