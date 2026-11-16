'use client'

import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { computeEta, currentWeight, fmt, fmt1, formatDayMonth, formatShortDate, sortedWeights, startOfDay } from '@/lib/fitness/calc'
import { useFitness } from '@/lib/fitness/store'
import type { Experience, Objective, Sex } from '@/lib/fitness/types'
import { Eyebrow, inputClass, Panel, PanelHeader, Segmented, SegmentBar, Stepper } from '../primitives'

export function ProfileView() {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <header>
        <Eyebrow>Profil</Eyebrow>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Date și obiective</h1>
      </header>
      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4 md:gap-5">
          <BiometricsPanel />
          <GoalsPanel />
        </div>
        <div className="flex flex-col gap-4 md:gap-5">
          <LiftsPanel />
          <WeightLogPanel />
        </div>
      </div>
    </div>
  )
}

function BiometricsPanel() {
  const { state, dispatch } = useFitness()
  const p = state.profile
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'setProfile', patch })
  return (
    <Panel aria-labelledby="bio-title">
      <PanelHeader id="bio-title" title="Biometrie" />
      <div className="grid grid-cols-2 gap-4 p-4 sm:p-5">
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Vârstă</p>
          <Stepper label="vârstă" value={p.age} min={14} max={90} suffix="ani" onChange={(n) => set({ age: n })} />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Înălțime</p>
          <Stepper label="înălțime" value={p.height} min={140} max={220} suffix="cm" onChange={(n) => set({ height: n })} />
        </div>
        <div className="col-span-2">
          <p className="mb-1.5 text-xs text-muted-foreground">Sex</p>
          <Segmented<Sex>
            label="Sex"
            value={p.sex}
            onChange={(v) => set({ sex: v })}
            options={[
              { value: 'M', label: 'Masculin' },
              { value: 'F', label: 'Feminin' },
            ]}
          />
        </div>
        <div className="col-span-2">
          <p className="mb-1.5 text-xs text-muted-foreground">Experiență</p>
          <Segmented<Experience>
            label="Experiență"
            value={p.experience}
            onChange={(v) => set({ experience: v })}
            options={[
              { value: 'incepator', label: 'Începător' },
              { value: 'intermediar', label: 'Mediu' },
              { value: 'avansat', label: 'Avansat' },
            ]}
          />
        </div>
      </div>
    </Panel>
  )
}

function GoalsPanel() {
  const { state, dispatch } = useFitness()
  const p = state.profile
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'setProfile', patch })
  const eta = computeEta(currentWeight(state.weights), p, startOfDay(new Date()))

  return (
    <Panel aria-labelledby="goals-title">
      <PanelHeader id="goals-title" title="Obiectiv" />
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <Segmented<Objective>
          label="Obiectiv"
          value={p.objective}
          onChange={(v) => set({ objective: v })}
          options={[
            { value: 'cut', label: 'Slăbire' },
            { value: 'recomp', label: 'Recompoziție' },
            { value: 'bulk', label: 'Masă' },
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Greutate țintă</p>
            <Stepper
              label="greutate țintă"
              value={p.targetWeight}
              min={40}
              max={200}
              step={0.5}
              format={fmt1}
              suffix="kg"
              onChange={(n) => set({ targetWeight: n })}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Ritm săptămânal</p>
            <Stepper
              label="ritm săptămânal"
              value={p.pace}
              min={0.1}
              max={1.2}
              step={0.05}
              format={(n) => n.toFixed(2)}
              suffix="kg"
              onChange={(n) => set({ pace: n })}
            />
          </div>
          <div className="col-span-2">
            <p className="mb-1.5 text-xs text-muted-foreground">Antrenamente pe săptămână</p>
            <Stepper
              label="antrenamente pe săptămână"
              value={p.workoutsPerWeek}
              min={1}
              max={7}
              onChange={(n) => set({ workoutsPerWeek: n })}
            />
          </div>
        </div>
        <p className="num border-t border-border pt-3 text-sm">
          {eta.status === 'ok' ? (
            <>
              <span className="text-primary">~{Math.round(eta.weeks)} săpt.</span>
              <span className="text-muted-foreground"> · Est. {formatDayMonth(eta.date)}</span>
            </>
          ) : eta.status === 'reached' ? (
            <span className="text-success">Țintă atinsă</span>
          ) : (
            <span className="font-sans text-muted-foreground">Ținta nu corespunde obiectivului.</span>
          )}
        </p>
      </div>
    </Panel>
  )
}

function LiftsPanel() {
  const { state, dispatch } = useFitness()
  return (
    <Panel aria-labelledby="lifts-title">
      <PanelHeader id="lifts-title" title="Ținte de forță" meta="1RM estimat" />
      <ul className="flex flex-col divide-y divide-border">
        {state.lifts.map((l) => (
          <li key={l.id} className="flex flex-col gap-2.5 px-4 py-3.5 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">{l.name}</span>
              <div className="w-36">
                <Stepper
                  label={`țintă ${l.name}`}
                  value={l.target}
                  min={10}
                  max={400}
                  step={2.5}
                  format={fmt}
                  onChange={(n) => dispatch({ type: 'setLiftTarget', id: l.id, target: n })}
                />
              </div>
            </div>
            <SegmentBar value={l.current / l.target} segments={30} label={`Progres ${l.name}`} />
            <p className="num text-[11px] text-muted-foreground">
              {fmt(l.current)} / {fmt(l.target)} kg · {Math.round(Math.min(1, l.current / l.target) * 100)}%
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function WeightLogPanel() {
  const { state, dispatch } = useFitness()
  const rows = sortedWeights(state.weights).reverse()
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null)
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? rows : rows.slice(0, 10)

  const save = () => {
    if (!editing) return
    const kg = Number(editing.value.replace(',', '.'))
    if (Number.isFinite(kg) && kg >= 30 && kg <= 300) {
      dispatch({ type: 'updateWeight', id: editing.id, kg: Math.round(kg * 10) / 10 })
    }
    setEditing(null)
  }

  return (
    <Panel aria-labelledby="log-title">
      <PanelHeader id="log-title" title="Jurnal greutate" meta={`${rows.length} înregistrări`} />
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th>Dată</th>
            <th>Greutate</th>
            <th>Diferență</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {visible.map((r, i) => {
            const prev = rows[i + 1]
            const diff = prev ? r.kg - prev.kg : 0
            const isEditing = editing?.id === r.id
            return (
              <tr key={r.id} className="h-12">
                <td className="num pl-4 text-xs text-muted-foreground sm:pl-5">{formatShortDate(r.date)}</td>
                <td className="num">
                  {isEditing ? (
                    <input
                      autoFocus
                      aria-label={`Greutate ${formatShortDate(r.date)}`}
                      inputMode="decimal"
                      value={editing.value}
                      onChange={(e) => setEditing({ id: r.id, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) save()
                        if (e.key === 'Escape') setEditing(null)
                      }}
                      className={`${inputClass} h-9 w-24`}
                    />
                  ) : (
                    <>
                      {fmt1(r.kg)} <span className="text-muted-foreground">kg</span>
                    </>
                  )}
                </td>
                <td className="num text-xs text-muted-foreground">
                  {prev ? `${diff > 0 ? '+' : diff < 0 ? '−' : '±'}${fmt1(Math.abs(diff))}` : ''}
                </td>
                <td className="pr-3 text-right sm:pr-4">
                  <div className="inline-flex gap-1">
                    {isEditing ? (
                      <>
                        <IconBtn label="Salvează" onClick={save}>
                          <Check className="size-3.5" aria-hidden />
                        </IconBtn>
                        <IconBtn label="Anulează" onClick={() => setEditing(null)}>
                          <X className="size-3.5" aria-hidden />
                        </IconBtn>
                      </>
                    ) : (
                      <>
                        <IconBtn label={`Editează ${formatShortDate(r.date)}`} onClick={() => setEditing({ id: r.id, value: fmt1(r.kg) })}>
                          <Pencil className="size-3.5" aria-hidden />
                        </IconBtn>
                        <IconBtn
                          label={`Șterge ${formatShortDate(r.date)}`}
                          destructive
                          onClick={() => dispatch({ type: 'deleteWeight', id: r.id })}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </IconBtn>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length > 10 ? (
        <div className="border-t border-border px-4 py-2 sm:px-5">
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            {showAll ? 'Arată mai puțin' : `Arată toate (${rows.length})`}
          </button>
        </div>
      ) : null}
    </Panel>
  )
}

function IconBtn({
  label,
  onClick,
  children,
  destructive,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary ${
        destructive ? 'hover:text-destructive' : 'hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
