'use client'

import { CalendarRange, Dumbbell, LayoutGrid, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tab = 'dashboard' | 'antrenament' | 'planificare' | 'profil'

export const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'antrenament', label: 'Antrenament', icon: Dumbbell },
  { id: 'planificare', label: 'Planificare', icon: CalendarRange },
  { id: 'profil', label: 'Profil', icon: UserRound },
]

type Props = { tab: Tab; onChange: (t: Tab) => void; sessionActive: boolean }

export function Sidebar({ tab, onChange, sessionActive }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-background md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <span className="grid size-6 place-items-center rounded-sm bg-primary" aria-hidden>
          <span className="size-2 rounded-full bg-background" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Forța</span>
        <span className="num ml-auto text-[10px] text-muted-foreground">v1.0</span>
      </div>
      <nav aria-label="Navigare principală" className="flex flex-col gap-0.5 p-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === tab
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors',
                active ? 'bg-card text-foreground' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
              )}
            >
              {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden /> : null}
              <Icon className={cn('size-4', active && 'text-primary')} aria-hidden />
              {label}
              {id === 'antrenament' && sessionActive ? (
                <span className="ml-auto size-1.5 rounded-full bg-primary" aria-label="Sesiune activă" />
              ) : null}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-border p-5">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Date demonstrative stocate în sesiunea curentă.
        </p>
      </div>
    </aside>
  )
}

export function BottomNav({ tab, onChange, sessionActive }: Props) {
  return (
    <nav
      aria-label="Navigare principală"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-saturate-150 md:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === tab
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {active ? <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden /> : null}
                <span className="relative">
                  <Icon className={cn('size-5', active && 'text-primary')} aria-hidden />
                  {id === 'antrenament' && sessionActive ? (
                    <span className="absolute -right-1 -top-0.5 size-1.5 rounded-full bg-primary" aria-hidden />
                  ) : null}
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
