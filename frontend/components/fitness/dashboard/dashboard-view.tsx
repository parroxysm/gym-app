'use client'

import { Check, Plus, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { currentWeight, fmt1, fmtInt, formatLongDate } from '@/lib/fitness/calc'
import { PRESET_LABELS } from '@/lib/fitness/mock-data'
import { useFitness } from '@/lib/fitness/store'
import type { Tab } from '../navigation'
import { GhostButton, inputClass, PrimaryButton } from '../primitives'
import { CoachInsights } from './coach-insights'
import { ConsistencyGrid } from './consistency-grid'
import { GoalCard } from './goal-card'
import { NextWorkoutCard } from './next-workout-card'

function greeting(h: number) {
  if (h < 11) return 'Bună dimineața'
  if (h < 18) return 'Bună ziua'
  return 'Bună seara'
}

export function DashboardView({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { state, dispatch } = useFitness()
  const now = new Date()
  const [logging, setLogging] = useState(false)
  const [value, setValue] = useState(() => fmt1(currentWeight(state.weights)))
  const [saved, setSaved] = useState(false)
  const [username, setUsername] = useState('')
  const inputId = useId()

  useEffect(() => {
    try {
      const raw = localStorage.getItem('fitness_user')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.username) setUsername(parsed.username)
      }
    } catch {}
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const kg = Number(value.replace(',', '.'))
    if (!Number.isFinite(kg) || kg < 30 || kg > 300) return
    dispatch({ type: 'logWeight', kg: Math.round(kg * 10) / 10 })
    setLogging(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2400)
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <header className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="num text-xs text-muted-foreground">{formatLongDate(now)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            {greeting(now.getHours())}
            {username ? `, ${username}` : ''}
          </h1>
          <p className="mt-2 inline-flex items-center gap-2 rounded-sm border border-border px-2 py-1 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Split activ: <span className="text-foreground">{PRESET_LABELS[state.plan.preset]}</span>
          </p>
        </div>
        {logging ? (
          <form onSubmit={submit} className="flex items-end gap-2" aria-label="Înregistrează greutatea de azi">
            <div className="w-32">
              <label htmlFor={inputId} className="mb-1.5 block text-xs text-muted-foreground">
                Greutate azi (kg)
              </label>
              <input
                id={inputId}
                autoFocus
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={inputClass}
              />
            </div>
            <PrimaryButton type="submit" aria-label="Salvează greutatea" className="min-h-10 w-10 px-0">
              <Check className="size-4" aria-hidden />
            </PrimaryButton>
            <GhostButton aria-label="Anulează" onClick={() => setLogging(false)} className="w-10 px-0">
              <X className="size-4" aria-hidden />
            </GhostButton>
          </form>
        ) : (
          <GhostButton onClick={() => setLogging(true)} className="self-start sm:self-auto">
            {saved ? <Check className="size-4 text-success" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            {saved ? 'Greutate salvată' : 'Înregistrează greutatea'}
          </GhostButton>
        )}
      </header>

      {state.lastFinished ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3"
        >
          <p className="text-sm">
            <span className="font-medium text-success">{state.lastFinished.routineName} finalizat.</span>{' '}
            <span className="num text-muted-foreground">
              {state.lastFinished.setsDone} serii · {fmtInt(state.lastFinished.volume)} kg ·{' '}
              {state.lastFinished.durationMin} min
            </span>
          </p>
          <button
            type="button"
            aria-label="Închide"
            onClick={() => dispatch({ type: 'dismissSummary' })}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GoalCard />
        </div>
        <NextWorkoutCard onStart={() => onNavigate('antrenament')} />
        <div className="lg:col-span-2">
          <ConsistencyGrid />
        </div>
        <div className="lg:pt-1">
          <CoachInsights />
        </div>
      </div>
    </div>
  )
}