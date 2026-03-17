'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Step = 'email' | 'code'

export default function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    console.log('[OTP send]', error ? `ERROR: ${error.message} (${error.status})` : 'OK')

    if (error) {
      setError(error.message)
    } else {
      setStep('code')
    }
    setLoading(false)
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })

    if (error) {
      setError('Código inválido o expirado. Revisá el email e intentá de nuevo.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  if (step === 'code') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Ingresá el Código</CardTitle>
          <CardDescription>
            Te enviamos un código de 6 dígitos a <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de verificación</Label>
              <Input
                id="code"
                name="one-time-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="12345678"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={8}
                required
                autoFocus
                disabled={loading}
                className="text-center text-2xl tracking-widest tabular-nums"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full touch-manipulation motion-reduce:transition-none"
              disabled={loading || code.trim().length < 6}
            >
              {loading ? 'Verificando…' : 'Ingresar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm touch-manipulation motion-reduce:transition-none"
              onClick={() => { setStep('email'); setCode(''); setError(null) }}
            >
              Usar otro email
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance">Ingresar</CardTitle>
        <CardDescription>Te enviamos un código de 6 dígitos a tu email</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vos@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full touch-manipulation motion-reduce:transition-none"
            disabled={loading || !email}
          >
            {loading ? 'Enviando…' : 'Enviar Código'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
