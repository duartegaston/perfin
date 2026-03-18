'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Receipt, Users, History, Bot, Menu, LogOut, TrendingUp } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gastos-personales', label: 'Mis Gastos', icon: Receipt },
  { href: '/gastos-compartidos', label: 'Gastos Compartidos', icon: Users },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/asistente', label: 'Asistente IA', icon: Bot },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const periodo = searchParams.get('periodo')

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Navegación principal">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        const hrefWithPeriodo = periodo ? `${href}?periodo=${periodo}` : href
        return (
          <Link
            key={href}
            href={hrefWithPeriodo}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none',
              isActive
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-3 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent touch-manipulation motion-reduce:transition-none"
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" />
      Cerrar Sesión
    </Button>
  )
}

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-accent transition-colors touch-manipulation motion-reduce:transition-none"
        aria-label="Abrir menú de navegación"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
            <TrendingUp className="h-4 w-4 text-sidebar-primary-foreground" aria-hidden="true" />
          </div>
          <span className="font-semibold text-base text-sidebar-foreground tracking-tight">PerFin</span>
        </div>
        <div className="flex-1 px-3 py-4">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
        <div className="px-3 py-4 border-t border-sidebar-border">
          <SignOutButton />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
          <TrendingUp className="h-4 w-4 text-sidebar-primary-foreground" aria-hidden="true" />
        </div>
        <span className="font-semibold text-base text-sidebar-foreground tracking-tight">PerFin</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks />
      </div>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <SignOutButton />
      </div>
    </aside>
  )
}
