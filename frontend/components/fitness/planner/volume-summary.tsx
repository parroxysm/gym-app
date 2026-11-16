'use client'

import { EXERCISE_MAP, MUSCLE_LABELS } from '@/lib/fitness/mock-data'
import { useFitness } from '@/lib/fitness/store'
import type { Muscle } from '@/lib/fitness/types'
import { cn } from '@/lib/utils'
import { Panel, PanelHeader } from '../primitives'

const RECOMMENDED: [number, number] = [10, 20]

export function VolumeSummary() {
  const { state } = useFitness()
  const totals = Object.fromEntries((Object.keys(MUSCLE_LABELS) as Muscle[]).map((m) => [m, 0])) as Record<Muscle, number>
  for (const d of state.plan.days) {
    if (!d.routineId) continue
    for (const e of state.routines[d.routineId]?.exercises ?? []) {
      const m = EXERCISE_MAP[e.exerciseId]?.muscle
      if (m) totals[m] += e.sets
    }
  }
  const scale = state.plan.cycleType === 'rolling' ? 7 / state.plan.days.length : 1
  const rows = (Object.entries(totals) as [Muscle, number][]).map(([m, v]) => [m, Math.round(v * scale)] as const)
  const max = Math.max(24, ...rows.map(([, v]) => v))
  const summary = rows
    .filter(([m]) => m === 'piept' || m === 'spate' || m === 'picioare')
    .map(([m, v]) => `${MUSCLE_LABELS[m]}: ${v} serii`)
    .join(' · ')

  return (
    <Panel aria-labelledby="volume-title">
      <PanelHeader
        id="volume-title"
        title="Volum săptămânal"
        meta={state.plan.cycleType === 'rolling' ? 'normalizat la 7 zile' : `optim ${RECOMMENDED[0]}–${RECOMMENDED[1]} serii`}
      />
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <p className="num text-xs text-foreground">{summary}</p>
        <ul className="flex flex-col gap-2.5">
          {rows.map(([m, v]) => {
            const inRange = v >= RECOMMENDED[0] && v <= RECOMMENDED[1]
            return (
              <li key={m} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3">
                <span className="text-xs text-muted-foreground">{MUSCLE_LABELS[m]}</span>
                <div className="relative h-2 rounded-[1px] bg-[#232321]">
                  <span
                    className="absolute inset-y-0 border-x border-dashed border-muted-foreground/30"
                    style={{ left: `${(RECOMMENDED[0] / max) * 100}%`, width: `${((RECOMMENDED[1] - RECOMMENDED[0]) / max) * 100}%` }}
                    aria-hidden
                  />
                  <span
                    className={cn('absolute inset-y-0 left-0 rounded-[1px] transition-all', inRange ? 'bg-foreground' : 'bg-muted-foreground/50')}
                    style={{ width: `${(v / max) * 100}%` }}
                    aria-hidden
                  />
                </div>
                <span className={cn('num text-right text-xs', inRange ? 'text-foreground' : 'text-muted-foreground')}>
                  {v}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </Panel>
  )
}
