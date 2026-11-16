'use client'

import { Lock } from 'lucide-react'
import { useState } from 'react'
import { PRESET_LABELS } from '@/lib/fitness/mock-data'
import { useFitness } from '@/lib/fitness/store'
import type { SplitPreset } from '@/lib/fitness/types'
import { Eyebrow, Panel, PanelHeader, Segmented, Stepper } from '../primitives'
import { DayMapper, dayLabel } from './day-mapper'
import { RoutineBuilder } from './routine-builder'
import { VolumeSummary } from './volume-summary'

const PRESETS: SplitPreset[] = ['ppl', 'ul', 'ppl-ul', 'custom']

export function PlannerView() {
  const { state, dispatch } = useFitness()
  const { plan } = state
  const [selected, setSelected] = useState(0)
  const safeSelected = Math.min(selected, plan.days.length - 1)
  const sessionLive = state.session.startedAt !== null

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <header>
        <Eyebrow>Planificare</Eyebrow>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Split și program</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground text-pretty">
          Editorul e separat de sesiunea activă. Modificările se aplică de la următorul antrenament.
        </p>
        {sessionLive ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-sm border border-border px-2 py-1 text-[11px] text-muted-foreground">
            <Lock className="size-3" aria-hidden />
            Sesiune în desfășurare — rutina curentă rămâne neschimbată până la final.
          </p>
        ) : null}
      </header>

      <Panel aria-labelledby="config-title">
        <PanelHeader id="config-title" title="Configurare split" meta={PRESET_LABELS[plan.preset]} />
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Șablon</p>
            <div role="radiogroup" aria-label="Șablon split" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map((p) => {
                const active = plan.preset === p
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => dispatch({ type: 'setPreset', preset: p })}
                    className={`min-h-12 rounded-md border px-3 py-2 text-left text-xs leading-snug transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {PRESET_LABELS[p]}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Structura ciclului</p>
              <Segmented
                label="Structura ciclului"
                value={plan.cycleType}
                onChange={(v) => dispatch({ type: 'setCycleType', cycleType: v })}
                options={[
                  { value: 'fixed', label: 'Săptămână fixă' },
                  { value: 'rolling', label: 'Ciclu de N zile' },
                ]}
              />
            </div>
            {plan.cycleType === 'rolling' ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Lungime ciclu</span>
                <div className="w-40">
                  <Stepper
                    label="lungime ciclu"
                    value={plan.days.length}
                    min={2}
                    max={10}
                    suffix="zile"
                    onChange={(n) => dispatch({ type: 'setCycleLength', length: n })}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Panel>

      <DayMapper selected={safeSelected} onSelect={setSelected} />

      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <RoutineBuilder dayIndex={safeSelected} dayName={dayLabel(plan.cycleType, safeSelected)} />
        <div className="lg:sticky lg:top-8">
          <VolumeSummary />
        </div>
      </div>
    </div>
  )
}
