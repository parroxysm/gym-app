'use client'

import {
  computeEta,
  currentWeight,
  fmt1,
  fmtSigned,
  formatDayMonth,
  fromISODate,
  sortedWeights,
  startOfDay,
  weeklyChange,
} from '@/lib/fitness/calc'
import { useFitness } from '@/lib/fitness/store'
import { Panel, PanelHeader, SegmentBar } from '../primitives'
import { WeightSparkline } from './weight-sparkline'

const OBJECTIVE_LABEL = { cut: 'Slăbire', bulk: 'Masă musculară', recomp: 'Recompoziție' } as const

export function GoalCard() {
  const { state } = useFitness()
  const { profile } = state
  const sorted = sortedWeights(state.weights)
  const current = currentWeight(state.weights)
  const start = sorted[0]?.kg ?? current
  const now = startOfDay(new Date())
  const eta = computeEta(current, profile, now)
  const weekly = weeklyChange(state.weights)
  const totalSpan = Math.abs(start - profile.targetWeight)
  const progress = totalSpan === 0 ? 1 : Math.abs(start - current) / totalSpan
  const remaining = profile.targetWeight - current
  const cutoff = now.getTime() - 30 * 86_400_000
  const recent = sorted.filter((e) => fromISODate(e.date).getTime() >= cutoff)
  const signedPace = profile.objective === 'bulk' ? profile.pace : -profile.pace

  return (
    <Panel aria-labelledby="goal-title" className="flex flex-col">
      <PanelHeader id="goal-title" title="Obiectiv greutate" meta={OBJECTIVE_LABEL[profile.objective]} />
      <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[1fr_1.1fr] lg:gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Curentă</p>
              <p className="num mt-1 text-4xl font-medium leading-none tracking-tight sm:text-5xl">
                {fmt1(current)}
                <span className="ml-1 text-base text-muted-foreground">kg</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Țintă</p>
              <p className="num mt-1 text-2xl leading-none text-muted-foreground">
                {fmt1(profile.targetWeight)}
                <span className="ml-1 text-sm">kg</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SegmentBar value={progress} label="Progres către greutatea țintă" />
            <div className="num flex justify-between text-[11px] text-muted-foreground">
              <span>Start {fmt1(start)}</span>
              <span>{Math.round(Math.min(1, progress) * 100)}%</span>
              <span>{fmtSigned(remaining, 1)} kg</span>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            {eta.status === 'ok' ? (
              <p className="text-lg font-medium leading-snug text-balance">
                <span className="num text-primary">~{Math.round(eta.weeks)} săptămâni rămase</span>
                <span className="text-muted-foreground"> · </span>
                <span className="num">Est. {formatDayMonth(eta.date)}</span>
              </p>
            ) : eta.status === 'reached' ? (
              <p className="text-lg font-medium text-success">Ai atins greutatea țintă.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ținta nu corespunde obiectivului ales. Ajustează-o în Profil.
              </p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[11px] text-muted-foreground">Ritm actual (28 zile)</dt>
                <dd className="num mt-0.5 text-sm">{fmtSigned(weekly)} kg/săpt</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Ritm planificat</dt>
                <dd className="num mt-0.5 text-sm">{fmtSigned(signedPace)} kg/săpt</dd>
              </div>
            </dl>
          </div>
        </div>
        <WeightSparkline entries={recent.length >= 2 ? recent : sorted} />
      </div>
    </Panel>
  )
}
