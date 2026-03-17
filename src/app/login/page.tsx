import LoginForm from '@/components/auth/LoginForm'
import { TrendingUp } from 'lucide-react'

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 60% -10%, oklch(0.85 0.06 162 / 0.35) 0%, oklch(0.982 0.004 90) 65%)',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary shadow-lg mb-4">
            <TrendingUp className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FinanzasApp</h1>
          <p className="text-muted-foreground mt-2 text-sm">Gestioná tus finanzas personales</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
