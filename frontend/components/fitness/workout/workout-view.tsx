'use client'

import { ChevronDown, Flag, Play } from 'lucide-react'
import { useCallback, useId, useState } from 'react'
import { fmtInt, previousSets, workoutSequence } from '@/lib/fitness/calc'
import { PRESET_LABELS } from '@/lib/fitness/mock-data'
import { useFitness } from '@/lib/fitness/store'
import { cn } from '@/lib/utils'
import type { Tab } from '../navigation'
import { Eyebrow, GhostButton, PrimaryButton } from '../primitives'
import { ExerciseCard } from './exercise-card'
import { RestTimer } from './rest-timer'
import { formatClock, useNow } from './use-now'

const REST_SECONDS = 90

export function WorkoutView({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { state, dispatch } = useFitness()
  const { session } = state
  const routine = state.routines[session.routineId]
  const seq = workoutSequence(state)
  const queuePos = seq.length ? state.queueIndex % seq.length : 0
  const now = useNow(session.startedAt !== null)
  const elapsed = session.startedAt ? (now - session.startedAt) / 1000 : 0
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null)
  const selectId = useId()

  const prevRecord = state.history[session.routineId]
  let volume = 0
  let setsDone = 0
  for (const list of Object.values(session.logs)) {
    for (const s of list) {
      if (!s.done) continue
      setsDone++
      volume += (Number(s.kg) || 0) * (Number(s.reps) || 0)
    }
  }
  const prevVolume = prevRecord?.volume ?? 0
  const delta = volume - prevVolume
  const totalSets = Object.values(session.logs).reduce((a, l) => a + l.length, 0)

  const handleToggle = (uid: string, i: number) => {
    const wasDone = session.logs[uid]?.[i]?.done
    dispatch({ type: 'toggleSet', uid, index: i })
    if (!wasDone) setRest({ endsAt: Date.now() + REST_SECONDS * 1000, total: REST_SECONDS })
  }

  const skipRest = useCallback(() => setRest(null), [])

  const switchRoutine = (routineId: string) => {
    if (setsDone > 0 && !window.confirm('Ai serii înregistrate. Schimbi sesiunea și pierzi progresul curent?')) return
    dispatch({ type: 'switchRoutine', routineId })
    setRest(null)
  }

  const finish = () => {
    dispatch({ type: 'finishSession' })
    setRest(null)
    onNavigate('dashboard')
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <Eyebrow>Coadă inteligentă · {PRESET_LABELS[state.plan.preset]}</Eyebrow>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{routine?.name}</h1>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground text-pretty">
              Sesiunea e aleasă automat ca următoarea din secvență, nu după ziua din calendar. Dacă ratezi o zi,
              coada se mută — nicio grupă musculară nu e sărită.
            </p>
          </div>
          <div className="flex items-center gap-3 md:flex-col md:items-end">
            <div className="flex flex-col md:items-end">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Durată</span>
              <span
                className={cn('num text-2xl font-medium', session.startedAt ? 'text-foreground' : 'text-muted-foreground')}
                aria-label={`Durată sesiune ${formatClock(elapsed)}`}
              >
                {formatClock(elapsed)}
              </span>
            </div>
            <div className="ml-auto flex gap-2 md:ml-0">
              {session.startedAt === null ? (
                <GhostButton onClick={() => dispatch({ type: 'startSession' })}>
                  <Play className="size-3.5" aria-hidden />
                  Pornește
                </GhostButton>
              ) : null}
              <PrimaryButton onClick={finish} disabled={setsDone === 0} className="min-h-10">
                <Flag className="size-4" aria-hidden />
                Finalizează Antrenamentul
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <ol aria-label="Secvența antrenamentelor" className="flex flex-wrap items-center gap-1.5">
            {seq.map((id, i) => {
              const isCurrent = i === queuePos
              return (
                <li key={`${id}-${i}`} className="flex items-center gap-1.5">
                  <span
                    aria-current={isCurrent ? 'step' : undefined}
                    className={cn(
                      'num rounded-sm border px-1.5 py-0.5 text-[11px]',
                      isCurrent
                        ? 'border-primary bg-primary/10 text-primary'
                        : i < queuePos
                          ? 'border-border text-muted-foreground/60 line-through'
                          : 'border-border text-muted-foreground',
                    )}
                  >
                    {state.routines[id]?.short}
                  </span>
                  {i < seq.length - 1 ? <span className="text-[10px] text-muted-foreground/50" aria-hidden>→</span> : null}
                </li>
              )
            })}
          </ol>
          <div className="relative">
            <label htmlFor={selectId} className="sr-only">
              Schimbă sesiunea manual
            </label>
            <select
              id={selectId}
              value={session.routineId}
              onChange={(e) => switchRoutine(e.target.value)}
              className="h-9 appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-xs text-muted-foreground hover:text-foreground focus:border-primary focus:outline-none"
            >
              {Object.values(state.routines).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id === session.routineId ? 'Schimbă sesiunea…' : r.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>
      </header>

      <div
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-border bg-card px-4 py-3 sm:px-5"
        aria-live="polite"
      >
        <p className="text-sm">
          <span className="text-muted-foreground">Volum total: </span>
          <span className="num font-medium">{fmtInt(volume)} kg</span>
          {prevVolume > 0 ? (
            <span className={cn('num ml-2 text-xs', delta >= 0 ? 'text-success' : 'text-muted-foreground')}>
              · {delta >= 0 ? '+' : '−'}
              {fmtInt(Math.abs(delta))} kg <span className="font-sans">față de ultima sesiune</span>
            </span>
          ) : null}
        </p>
        <p className="num text-xs text-muted-foreground">
          {setsDone}/{totalSets} <span className="font-sans">serii</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {session.exercises.map((e, i) => (
          <ExerciseCard
            key={e.uid}
            index={i}
            exercise={e}
            logs={session.logs[e.uid] ?? []}
            prev={previousSets(state.history, session.routineId, e.exerciseId)}
            onUpdate={(idx, patch) => dispatch({ type: 'updateSet', uid: e.uid, index: idx, patch })}
            onToggle={(idx) => handleToggle(e.uid, idx)}
            onAddSet={() => dispatch({ type: 'addSet', uid: e.uid })}
          />
        ))}
      </div>

      {rest ? (
        <RestTimer
          endsAt={rest.endsAt}
          total={rest.total}
          onAdd={() => setRest((r) => (r ? { endsAt: r.endsAt + 15_000, total: r.total + 15 } : r))}
          onSkip={skipRest}
        />
      ) : null}
    </div>
  )
}
