# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (includes NODE_TLS_REJECT_UNAUTHORIZED=0 for Supabase SSL workaround)
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

## Architecture

### Tech Stack
- **Next.js 16.1.7** (App Router, Turbopack) + TypeScript
- **Tailwind CSS v4** + **shadcn/ui** — uses `@base-ui/react` (NOT Radix UI). **`asChild` prop does NOT exist** — never add it to components like `SheetTrigger`, `DialogTrigger`, etc.
- **Supabase** — PostgreSQL + Auth (OTP 6-digit code flow, not magic links)
- **Groq SDK** (`groq-sdk`) — `llama-3.3-70b-versatile`, streaming chat + monthly AI summaries. Client in `src/lib/claude/client.ts` exports `groq`.
- **Recharts** — client-side only charts (must use `next/dynamic` with `ssr: false` inside a `'use client'` component)

### Auth & Middleware
- **`src/proxy.ts`** (NOT `middleware.ts`) — Next.js 16 renamed it. Export must be named `proxy`, not `middleware`.
- **`src/lib/supabase/middleware.ts`** — `updateSession()` handles cookie refresh and auth redirects.
- **`src/lib/supabase/server.ts`** — async `getSupabaseServerClient()` using `await cookies()`. Always `await` this.
- Auth uses **6-digit OTP code** (not magic links) — email clients pre-fetch magic links and consume tokens.

### App Structure
```
src/app/
  (protected)/      ← Server Components; layout.tsx validates session
    dashboard/      ← getDashboardData + getHistorialData via Promise.all
    gastos-personales/
    gastos-compartidos/
    historial/
    asistente/      ← streaming chat with Groq/Llama
  api/claude/
    chat/           ← POST, streams ReadableStream; errors sent as \x00ERROR\x00message
    resumen/        ← POST, generates + stores monthly AI summary
  auth/callback/    ← exchanges Supabase code for session
  login/            ← OTP flow (send email → enter 6-digit code)
```

### Data Flow
- **Server Actions** in `src/lib/actions/` handle all DB operations (meses, gastos-personales, gastos-compartidos, dashboard)
- **`src/types/index.ts`** is the single source of truth for enums, interfaces, and label/color maps (e.g., `CATEGORIA_PERSONAL_LABELS`, `CATEGORIA_PERSONAL_COLORS`)
- Charts (`PieCategoriasChart`, `LineEvolucionChart`) must be imported via `DashboardCharts.tsx` (a `'use client'` wrapper using `next/dynamic`) — direct imports in Server Components break SSR
- **Month period** flows via `?periodo=YYYY-MM` URL param. `Sidebar.tsx` preserves it on every nav link using `useSearchParams()`. Pages read it from `searchParams` prop.

### Supabase
- 5 SQL migrations in `supabase/migrations/` — run manually in Supabase SQL editor (direct DB connection doesn't resolve from dev machine)
- RLS enabled on all tables; policies filter by `auth.uid()` via joins
- **3 triggers** on `participantes_gasto` / `gastos_compartidos` / `meses` auto-compute proportional contributions: `monto_a_aportar = (sueldo / SUM(sueldos)) * monto_total`
- **`participantes_predefinidos`** table (migration 005) — stores recurring companions; auto-selected in `GastoCompartidoForm` when creating new shared expenses

### Key Shared Expense Logic
- `getAportePorCategoria(mesId)` — returns only the user's `monto_a_aportar` per category (participant where `es_usuario_actual = true`), used by pie chart
- `getAporteUsuario(mesId)` — total user's share across all shared expenses, used in ResumenCards and `dinero_restante`
- Pie chart (`PieCategoriasChart`) merges personal + user's share of compartidos — shows the user's actual cost, not the household total

### Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GROQ_API_KEY
NEXT_PUBLIC_SITE_URL
```

### Key Gotchas
- **`CATEGORIA_PERSONAL_LABELS` and color maps** live in `@/types`, not `@/lib/utils`
- **Protected layout** does NOT receive `searchParams` (Next.js App Router constraint) — month period comes via URL params read in individual pages
- **`ANTHROPIC_API_KEY`** is no longer used — replaced by `GROQ_API_KEY`
- **ReadableStream error handling** — errors thrown inside `start()` after headers are sent cannot be caught by the outer try/catch; must be caught inside the stream and sent as `\x00ERROR\x00message` text
- **Email rate limit** — Supabase free tier: 2 emails/hour. Use Resend SMTP for testing
- **Git remote** uses SSH alias `git@github-personal:duartegaston/perfin.git` (mapped in `~/.ssh/config` to the `duartegaston` GitHub account)
