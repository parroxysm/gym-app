'use client'

import { useEffect } from 'react'
import { formatClock, useNow } from './use-now'

export function RestTimer({
  endsAt,
  total,
  onAdd,
  onSkip,
}: {
  endsAt: number
  total: number
  onAdd: () => void
  onSkip: () => void
}) {
  const now = useNow(true, 250)
  const remaining = Math.ceil((endsAt - now) / 1000)
  const done = remaining <= 0
  const pct = Math.min(1, Math.max(0, 1 - (endsAt - now) / (total * 1000)))

  useEffect(() => {
    if (!done) return
    const id = setTimeout(onSkip, 4000)
    return () => clearTimeout(id)
  }, [done, onSkip])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6 md:pl-56">
      <div
        role="timer"
        aria-live="off"
        aria-label="Cronometru pauză"
        className="pointer-events-auto relative flex items-center gap-1 overflow-hidden rounded-full border border-border bg-[#1E1E1C] py-1.5 pl-4 pr-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2"
      >
        <span
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
          style={{ transform: `scaleX(${pct})` }}
          aria-hidden
        />
        <span className="mr-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          {done ? 'Gata' : 'Pauză'}
        </span>
        <span className={`num mr-3 min-w-12 text-lg font-medium ${done ? 'text-success' : ''}`}>
          {formatClock(Math.max(0, remaining))}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="num h-9 rounded-full border border-border px-3 text-xs text-foreground transition-colors hover:bg-secondary"
        >
          +15s
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="h-9 rounded-full bg-foreground px-3.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
