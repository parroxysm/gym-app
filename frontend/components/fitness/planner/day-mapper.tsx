'use client'

import { ChevronDown, Moon } from 'lucide-react'
import { useId } from 'react'
import { WEEKDAYS } from '@/lib/fitness/mock-data'
import { useFitness } from '@/lib/fitness/store'
import { cn } from '@/lib/utils'
import { FieldLabel, Panel, PanelHeader } from '../primitives'

export function dayLabel(cycleType: 'fixed' | 'rolling', i: number) {
  return cycleType === 'fixed' ? WEEKDAYS[i] : `Ziua ${i + 1}`
}

export function DayMapper({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  const { state, dispatch } = useFitness()
  const { plan, routines } = state
  const day = plan.days[selected]
  const restCount = plan.days.filter((d) => !d.routineId).length
  const selectId = useId()
  const switchId = useId()

  return (
    <Panel aria-labelledby="mapper-title">
      <PanelHeader
        id="mapper-title"
        title={plan.cycleType === 'fixed' ? 'Săptămâna' : 'Ciclul'}
        meta={`${plan.days.length - restCount} antrenamente · ${restCount} zile libere`}
      />
      <div className="p-4 sm:p-5">
        <div
          role="tablist"
          aria-label="Selectează ziua"
          className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]"
        >
          {plan.days.map((d, i) => {
            const active = i === selected
            const r = d.routineId ? routines[d.routineId] : null
            return (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(i)}
                className={cn(
                  'flex min-w-[5.75rem] shrink-0 snap-start flex-col items-start gap-2 rounded-md border px-3 py-2.5 text-left transition-colors',
                  active ? 'border-foreground bg-background' : 'border-border bg-background/40 hover:border-muted-foreground/50',
                )}
              >
                <span className={cn('text-[11px]', active ? 'text-foreground' : 'text-muted-foreground')}>
                  {plan.cycleType === 'fixed' ? WEEKDAYS[i].slice(0, 3) : `Ziua ${i + 1}`}
                </span>
                {r ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                    {r.short}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Moon className="size-3" aria-hidden />
                    Liber
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {day ? (
          <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <FieldLabel htmlFor={selectId}>Rutină pentru {dayLabel(plan.cycleType, selected)}</FieldLabel>
              <div className="relative">
                <select
                  id={selectId}
                  value={day.routineId ?? day.lastRoutineId}
                  disabled={!day.routineId}
                  onChange={(e) => dispatch({ type: 'setDayRoutine', index: selected, routineId: e.target.value })}
                  className="h-10 w-full appearance-none rounded-md border border-border bg-background pl-3 pr-9 text-sm focus:border-primary focus:outline-none disabled:opacity-40"
                >
                  {Object.values(routines).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.exercises.length} exerciții
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
              </div>
            </div>
            <div className="flex h-10 items-center justify-between gap-3 rounded-md border border-border bg-background px-3 sm:min-w-44">
              <label htmlFor={switchId} className="text-sm">
                Zi Liberă
              </label>
              <button
                id={switchId}
                type="button"
                role="switch"
                aria-checked={!day.routineId}
                onClick={() => dispatch({ type: 'toggleRest', index: selected })}
                className={cn(
                  'relative h-5 w-9 rounded-full border transition-colors',
                  !day.routineId ? 'border-primary bg-primary' : 'border-border bg-secondary',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-3.5 rounded-full transition-transform',
                    !day.routineId ? 'translate-x-[1.125rem] bg-background' : 'translate-x-0.5 bg-muted-foreground',
                  )}
                  aria-hidden
                />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  )
}
