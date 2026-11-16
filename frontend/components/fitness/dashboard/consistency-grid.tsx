'use client'

import { addDays, computeStreak, startOfDay, toISODate, workoutsInLastDays } from '@/lib/fitness/calc'
import { useFitness } from '@/lib/fitness/store'
import { cn } from '@/lib/utils'
import { Panel, PanelHeader } from '../primitives'

const ROW_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const WEEKS = 12

export function ConsistencyGrid() {
  const { state } = useFitness()
  const today = startOfDay(new Date())
  const todayIso = toISODate(today)
  const active = new Set(state.activity)
  const mondayOffset = (today.getDay() + 6) % 7
  const gridStart = addDays(today, -mondayOffset - (WEEKS - 1) * 7)

  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(gridStart, w * 7 + d)
      const iso = toISODate(date)
      return { iso, future: date.getTime() > today.getTime(), done: active.has(iso), today: iso === todayIso }
    }),
  )

  const total = weeks.flat().filter((c) => c.done).length
  const streak = computeStreak(state.activity, today)
  const last7 = workoutsInLastDays(state.activity, today)
  const goal = state.profile.workoutsPerWeek

  return (
    <Panel aria-labelledby="consistency-title">
      <PanelHeader id="consistency-title" title="Consecvență" meta={`12 săptămâni · ${total} sesiuni`} />
      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
          <div className="bg-card p-3">
            <dt className="text-[11px] text-muted-foreground">Serie curentă</dt>
            <dd className="num mt-1 text-2xl font-medium">
              {streak}
              <span className="ml-1 text-sm text-muted-foreground">zile</span>
            </dd>
          </div>
          <div className="bg-card p-3">
            <dt className="text-[11px] text-muted-foreground">Ultimele 7 zile</dt>
            <dd className="mt-1 flex items-baseline gap-2">
              <span className={cn('num text-2xl font-medium', last7 >= goal && 'text-success')}>
                {last7}/{goal}
              </span>
              <span className="text-xs text-muted-foreground">antrenamente</span>
            </dd>
          </div>
        </dl>

        <div className="flex gap-2">
          <div className="grid grid-rows-7 gap-[3px] pt-0" aria-hidden>
            {ROW_LABELS.map((l, i) => (
              <span key={i} className="num flex h-full items-center text-[9px] leading-none text-muted-foreground">
                {i % 2 === 0 ? l : ''}
              </span>
            ))}
          </div>
          <div
            role="img"
            aria-label={`Grilă de activitate: ${total} antrenamente în ultimele 12 săptămâni`}
            className="grid flex-1 grid-flow-col grid-cols-12 grid-rows-7 gap-[3px]"
          >
            {weeks.flat().map((c) => (
              <span
                key={c.iso}
                title={c.iso}
                className={cn(
                  'aspect-square rounded-[2px]',
                  c.future ? 'bg-transparent' : c.done ? 'bg-primary' : 'bg-[#232321]',
                  c.today && 'ring-1 ring-foreground ring-offset-1 ring-offset-card',
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-[#232321]" aria-hidden /> Fără sesiune
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-primary" aria-hidden /> Antrenament
          </span>
        </div>
      </div>
    </Panel>
  )
}
