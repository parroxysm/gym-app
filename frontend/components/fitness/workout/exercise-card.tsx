'use client'

import { ArrowUp, Check, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fmt, overloadTarget } from '@/lib/fitness/calc'
import { EXERCISE_MAP, MUSCLE_LABELS } from '@/lib/fitness/mock-data'
import type { LiveSet, RoutineExercise, SetEntry } from '@/lib/fitness/types'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Props = {
  index: number
  exercise: RoutineExercise
  logs: LiveSet[]
  prev: SetEntry[] | undefined
  onUpdate: (i: number, patch: Partial<LiveSet>) => void
  onToggle: (i: number) => void
  onAddSet: () => void
}

type ApiOverload = {
  recommendation?: {
    action: 'INCREASE_WEIGHT' | 'INCREASE_REPS'
    suggestedWeight: number
    suggestedReps: number
    reason: string
  }
}

const cellInput =
  'num h-10 w-full rounded-md border border-border bg-background text-center text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none disabled:opacity-100'

export function ExerciseCard({ index, exercise, logs, prev, onUpdate, onToggle, onAddSet }: Props) {
  const def = EXERCISE_MAP[exercise.exerciseId]
  const target = overloadTarget(prev, exercise.repMin, exercise.repMax)
  const doneCount = logs.filter((l) => l.done).length
  const complete = doneCount >= logs.length && logs.length > 0
  const headingId = `ex-${exercise.uid}`
  const [apiRec, setApiRec] = useState<ApiOverload['recommendation'] | null>(null)

  useEffect(() => {
    if (!def?.name) return
    const token = localStorage.getItem('fitness_token')
    if (!token) return
    let cancelled = false

    fetch(`${API_URL}/api/overload/${encodeURIComponent(def.name)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ApiOverload | null) => {
        if (!cancelled && data?.recommendation) {
          setApiRec(data.recommendation)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [def?.name])

  return (
    <article aria-labelledby={headingId} className="rounded-lg border border-border bg-card">
      <header className="flex items-start gap-3 px-4 pb-3 pt-4">
        <span className="num pt-0.5 text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 id={headingId} className="text-base font-semibold leading-snug tracking-tight">
              {def?.name}
            </h3>
            <span className={cn('num shrink-0 text-xs', complete ? 'text-success' : 'text-muted-foreground')}>
              {doneCount}/{logs.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {MUSCLE_LABELS[def?.muscle ?? 'piept']} ·{' '}
            <span className="num">
              {exercise.sets} serii × {exercise.repMin}-{exercise.repMax} rep
            </span>
          </p>
          {exercise.notes ? <p className="mt-1 text-xs italic text-muted-foreground">{exercise.notes}</p> : null}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="num text-xs text-muted-foreground">
              <span className="font-sans">Anterior: </span>
              {prev?.length ? prev.map((s) => `${fmt(s.kg)} kg × ${s.reps}`).join(', ') : '—'}
            </p>
            {apiRec ? (
              <span
                title={apiRec.reason}
                className="num inline-flex items-center gap-1.5 self-start rounded-sm border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] text-primary"
              >
                <ArrowUp className="size-3" aria-hidden />
                <span className="font-sans">Țintă azi:</span>
                {`${fmt(apiRec.suggestedWeight)} kg × ${apiRec.suggestedReps}`}
              </span>
            ) : target.kind !== 'baseline' ? (
              <span className="num inline-flex items-center gap-1.5 self-start rounded-sm border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] text-primary">
                <ArrowUp className="size-3" aria-hidden />
                <span className="font-sans">Țintă azi:</span>
                {target.kind === 'weight'
                  ? `${fmt(target.kg)} kg × ${target.reps}`
                  : `+1 rep sau ${fmt(target.altKg)} kg`}
              </span>
            ) : (
              <span className="self-start rounded-sm border border-border px-2 py-1 text-[11px] text-muted-foreground">
                Prima sesiune — stabilește baza
              </span>
            )}
          </div>
        </div>
      </header>

      <div role="table" aria-label={`Serii pentru ${def?.name}`} className="border-t border-border">
        <div
          role="row"
          className="grid grid-cols-[2.25rem_1fr_4.5rem_4.5rem_2.75rem] items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground sm:grid-cols-[3rem_1fr_6rem_6rem_3rem]"
        >
          <span role="columnheader">Serie</span>
          <span role="columnheader">Anterior</span>
          <span role="columnheader" className="text-center">
            Kg
          </span>
          <span role="columnheader" className="text-center">
            Repetări
          </span>
          <span role="columnheader" className="sr-only">
            Finalizat
          </span>
        </div>
        {logs.map((set, i) => {
          const ref = prev?.[i]
          const kg = Number(set.kg)
          const reps = Number(set.reps)
          const improved =
            set.done && ref && (kg > ref.kg || (kg === ref.kg && reps > ref.reps))
          return (
            <div
              role="row"
              key={i}
              className={cn(
                'grid grid-cols-[2.25rem_1fr_4.5rem_4.5rem_2.75rem] items-center gap-2 border-t border-border/60 px-4 py-1.5 transition-colors sm:grid-cols-[3rem_1fr_6rem_6rem_3rem]',
                set.done && 'bg-success/[0.07]',
              )}
            >
              <span role="cell" className="num text-sm text-muted-foreground">
                {i + 1}
              </span>
              <span role="cell" className="num flex items-center gap-1 truncate text-xs text-muted-foreground">
                {ref ? `${fmt(ref.kg)} × ${ref.reps}` : '—'}
                {improved ? <ArrowUp className="size-3 text-success" aria-label="Progres față de data trecută" /> : null}
              </span>
              <span role="cell">
                <input
                  aria-label={`Kg seria ${i + 1}`}
                  inputMode="decimal"
                  value={set.kg}
                  placeholder={ref ? fmt(ref.kg) : '0'}
                  onChange={(e) => onUpdate(i, { kg: e.target.value.replace(',', '.') })}
                  className={cellInput}
                />
              </span>
              <span role="cell">
                <input
                  aria-label={`Repetări seria ${i + 1}`}
                  inputMode="numeric"
                  value={set.reps}
                  placeholder={String(ref?.reps ?? exercise.repMin)}
                  onChange={(e) => onUpdate(i, { reps: e.target.value.replace(/\D/g, '') })}
                  className={cellInput}
                />
              </span>
              <span role="cell" className="flex justify-end">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={set.done}
                  aria-label={`Marchează seria ${i + 1} ca finalizată`}
                  onClick={() => onToggle(i)}
                  className={cn(
                    'grid size-10 place-items-center rounded-md border transition-all active:scale-95',
                    set.done
                      ? 'border-success bg-success text-background'
                      : 'border-border bg-background text-transparent hover:border-muted-foreground',
                  )}
                >
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                </button>
              </span>
            </div>
          )
        })}
      </div>
      <div className="border-t border-border px-4 py-2">
        <button
          type="button"
          onClick={onAddSet}
          className="inline-flex h-9 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-3.5" aria-hidden />
          Adaugă serie
        </button>
      </div>
    </article>
  )
}