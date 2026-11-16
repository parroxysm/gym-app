'use client'

import { ArrowRight } from 'lucide-react'
import { EXERCISE_MAP } from '@/lib/fitness/mock-data'
import { useFitness } from '@/lib/fitness/store'
import { Eyebrow, Panel, PrimaryButton } from '../primitives'

export function NextWorkoutCard({ onStart }: { onStart: () => void }) {
  const { state, dispatch } = useFitness()
  const { session } = state
  const routine = state.routines[session.routineId]
  const inProgress = session.startedAt !== null
  const totalSets = session.exercises.reduce((a, e) => a + e.sets, 0)

  return (
    <Panel aria-labelledby="next-title" className="flex flex-col p-4 sm:p-5">
      <Eyebrow>{inProgress ? 'În desfășurare' : 'Urmează azi'}</Eyebrow>
      <h2 id="next-title" className="mt-2 text-xl font-semibold tracking-tight">
        {routine?.name}
      </h2>
      <p className="num mt-1 text-xs text-muted-foreground">
        {session.exercises.length} exerciții · {totalSets} serii
      </p>
      <ol className="mt-4 flex flex-col divide-y divide-border border-y border-border">
        {session.exercises.slice(0, 6).map((e, i) => (
          <li key={e.uid} className="flex items-center gap-3 py-2 text-sm">
            <span className="num w-5 text-[11px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
            <span className="min-w-0 flex-1 truncate">{EXERCISE_MAP[e.exerciseId]?.name}</span>
            <span className="num text-[11px] text-muted-foreground">
              {e.sets}×{e.repMin}-{e.repMax}
            </span>
          </li>
        ))}
      </ol>
      <PrimaryButton
        className="mt-5 w-full"
        onClick={() => {
          dispatch({ type: 'startSession' })
          onStart()
        }}
      >
        {inProgress ? 'Continuă Antrenamentul' : 'Începe Antrenamentul'}
        <ArrowRight className="size-4" aria-hidden />
      </PrimaryButton>
    </Panel>
  )
}
