'use client'

import {
  fmt,
  fmtSigned,
  fromISODate,
  movingAverage,
  overloadTarget,
  previousSets,
  sortedWeights,
  weeklyChange,
} from '@/lib/fitness/calc'
import { EXERCISE_MAP } from '@/lib/fitness/mock-data'
import { useFitness } from '@/lib/fitness/store'
import { Eyebrow } from '../primitives'

function plateauDays(sorted: ReturnType<typeof sortedWeights>) {
  const ma = movingAverage(sorted)
  let days = 0
  const lastMa = ma[ma.length - 1]
  const lastT = fromISODate(sorted[sorted.length - 1].date).getTime()
  for (let i = ma.length - 1; i >= 0; i--) {
    if (Math.abs(ma[i] - lastMa) > 0.3) break
    days = Math.round((lastT - fromISODate(sorted[i].date).getTime()) / 86_400_000)
  }
  return days
}

export function CoachInsights() {
  const { state } = useFitness()
  const { profile, session } = state
  const sorted = sortedWeights(state.weights)
  const insights: { tag: string; text: string }[] = []

  const stall = sorted.length > 7 ? plateauDays(sorted) : 0
  const weekly = weeklyChange(state.weights)
  if (profile.objective === 'cut' && stall >= 7) {
    insights.push({
      tag: 'Nutriție',
      text: `Greutatea stagnează de ${stall} zile; redu aportul zilnic cu ~150 kcal.`,
    })
  } else if (profile.objective === 'bulk' && weekly < 0.1) {
    insights.push({ tag: 'Nutriție', text: 'Greutatea nu crește; adaugă ~200 kcal pe zi, preferabil din carbohidrați.' })
  } else {
    insights.push({
      tag: 'Nutriție',
      text: `Ritm de ${fmtSigned(weekly)} kg/săpt — în linie cu planul. Menține aportul actual.`,
    })
  }

  const ready = session.exercises.find((e) => {
    const t = overloadTarget(previousSets(state.history, session.routineId, e.exerciseId), e.repMin, e.repMax)
    return t.kind === 'weight'
  })
  if (ready) {
    const t = overloadTarget(previousSets(state.history, session.routineId, ready.exerciseId), ready.repMin, ready.repMax)
    if (t.kind === 'weight') {
      insights.push({
        tag: 'Progresie',
        text: `Ai atins limita superioară de repetări la ${EXERCISE_MAP[ready.exerciseId]?.name} — crește cu +${fmt(t.inc)} kg azi (${fmt(t.kg)} kg × ${t.reps}).`,
      })
    }
  } else {
    insights.push({
      tag: 'Progresie',
      text: 'Niciun exercițiu nu a atins plafonul de repetări. Țintește +1 repetare pe prima serie.',
    })
  }

  return (
    <section aria-labelledby="coach-title" className="border-l-2 border-primary bg-card/40 py-1 pl-4 pr-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="coach-title" className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Notă antrenor
        </h2>
        <Eyebrow className="num normal-case tracking-normal">bazat pe ultimele 28 zile</Eyebrow>
      </div>
      <ol className="mt-3 flex flex-col gap-3">
        {insights.map((i, idx) => (
          <li key={i.tag} className="flex gap-3">
            <span className="num pt-0.5 text-[11px] text-primary">{String(idx + 1).padStart(2, '0')}</span>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{i.tag}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-pretty">{i.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
