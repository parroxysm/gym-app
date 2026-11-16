'use client'

import { ArrowDown, ArrowUp, Moon, Plus, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { EXERCISE_MAP, EXERCISES, MUSCLE_LABELS } from '@/lib/fitness/mock-data'
import { useFitness } from '@/lib/fitness/store'
import type { Muscle, RoutineExercise } from '@/lib/fitness/types'
import { GhostButton, inputClass, Panel, PanelHeader, Stepper } from '../primitives'

export function RoutineBuilder({ dayIndex, dayName }: { dayIndex: number; dayName: string }) {
  const { state, dispatch } = useFitness()
  const day = state.plan.days[dayIndex]
  const routine = day?.routineId ? state.routines[day.routineId] : null
  const [adding, setAdding] = useState('')
  const addId = useId()

  if (!routine) {
    return (
      <Panel className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <Moon className="size-5 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">{dayName} — Zi Liberă</h2>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          Recuperarea face parte din program. Dezactivează „Zi Liberă” pentru a atribui o rutină.
        </p>
      </Panel>
    )
  }

  const usedBy = state.plan.days.filter((d) => d.routineId === routine.id).length
  const update = (uid: string, patch: Partial<RoutineExercise>) =>
    dispatch({ type: 'updateExercise', routineId: routine.id, uid, patch })

  const grouped = (Object.keys(MUSCLE_LABELS) as Muscle[]).map((m) => ({
    muscle: m,
    items: EXERCISES.filter((e) => e.muscle === m),
  }))

  return (
    <Panel aria-labelledby="builder-title">
      <PanelHeader
        id="builder-title"
        title={`${routine.name}`}
        meta={usedBy > 1 ? `folosită în ${usedBy} zile` : dayName}
      />
      <ol className="flex flex-col divide-y divide-border">
        {routine.exercises.map((e, i) => {
          const def = EXERCISE_MAP[e.exerciseId]
          return (
            <li key={e.uid} className="flex flex-col gap-3 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="num pt-0.5 text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{def?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{MUSCLE_LABELS[def?.muscle ?? 'piept']}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Mută ${def?.name} mai sus`}
                    disabled={i === 0}
                    onClick={() => dispatch({ type: 'moveExercise', routineId: routine.id, uid: e.uid, dir: -1 })}
                    className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Mută ${def?.name} mai jos`}
                    disabled={i === routine.exercises.length - 1}
                    onClick={() => dispatch({ type: 'moveExercise', routineId: routine.id, uid: e.uid, dir: 1 })}
                    className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Șterge ${def?.name}`}
                    onClick={() => dispatch({ type: 'removeExercise', routineId: routine.id, uid: e.uid })}
                    className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-7 sm:grid-cols-[9rem_1fr_1.4fr]">
                <div>
                  <p className="mb-1.5 text-[11px] text-muted-foreground">Serii țintă</p>
                  <Stepper
                    label="serii"
                    value={e.sets}
                    min={1}
                    max={8}
                    onChange={(n) => update(e.uid, { sets: n })}
                  />
                </div>
                <fieldset>
                  <legend className="mb-1.5 text-[11px] text-muted-foreground">Interval repetări</legend>
                  <div className="flex items-center gap-1.5">
                    <input
                      aria-label="Repetări minim"
                      inputMode="numeric"
                      value={e.repMin}
                      onChange={(ev) => {
                        const n = Number(ev.target.value.replace(/\D/g, '')) || 1
                        update(e.uid, { repMin: n, repMax: Math.max(n, e.repMax) })
                      }}
                      className={`${inputClass} text-center`}
                    />
                    <span className="text-muted-foreground" aria-hidden>
                      –
                    </span>
                    <input
                      aria-label="Repetări maxim"
                      inputMode="numeric"
                      value={e.repMax}
                      onChange={(ev) => update(e.uid, { repMax: Number(ev.target.value.replace(/\D/g, '')) || e.repMin })}
                      className={`${inputClass} text-center`}
                    />
                  </div>
                </fieldset>
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor={`note-${e.uid}`} className="mb-1.5 block text-[11px] text-muted-foreground">
                    Notă tehnică
                  </label>
                  <input
                    id={`note-${e.uid}`}
                    value={e.notes}
                    placeholder="ex. tempo 3-0-1"
                    onChange={(ev) => update(e.uid, { notes: ev.target.value })}
                    className={`${inputClass} font-sans`}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      <form
        className="flex gap-2 border-t border-border p-4 sm:px-5"
        onSubmit={(ev) => {
          ev.preventDefault()
          if (!adding) return
          dispatch({ type: 'addExercise', routineId: routine.id, exerciseId: adding })
          setAdding('')
        }}
      >
        <label htmlFor={addId} className="sr-only">
          Alege exercițiul de adăugat
        </label>
        <select
          id={addId}
          value={adding}
          onChange={(ev) => setAdding(ev.target.value)}
          className="h-10 min-w-0 flex-1 appearance-none rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Alege un exercițiu…</option>
          {grouped.map((g) => (
            <optgroup key={g.muscle} label={MUSCLE_LABELS[g.muscle]}>
              {g.items.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <GhostButton type="submit" disabled={!adding}>
          <Plus className="size-4" aria-hidden />
          Adaugă
        </GhostButton>
      </form>
    </Panel>
  )
}
