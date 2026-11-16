import type { FitnessState, Profile, SessionRecord, SetEntry, WeightEntry } from './types'

const DAY_MS = 86_400_000

export function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISODate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

const numFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 0 })
const numFmt1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const intFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export const fmt = (n: number) => numFmt.format(n)
export const fmt1 = (n: number) => numFmt1.format(n)
export const fmtInt = (n: number) => intFmt.format(n)
export const fmtSigned = (n: number, digits = 2) =>
  `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toFixed(digits)}`

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function formatLongDate(d: Date) {
  const s = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
  return capitalize(s)
}

export function formatDayMonth(d: Date) {
  const day = d.getDate()
  const month = new Intl.DateTimeFormat('ro-RO', { month: 'long' }).format(d)
  return `${day} ${capitalize(month)}`
}

export function formatShortDate(iso: string) {
  const d = fromISODate(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function sortedWeights(weights: WeightEntry[]) {
  return [...weights].sort((a, b) => a.date.localeCompare(b.date))
}

export function currentWeight(weights: WeightEntry[]) {
  const s = sortedWeights(weights)
  return s.length ? s[s.length - 1].kg : 0
}

export function movingAverage(series: WeightEntry[], window = 7) {
  return series.map((entry, i) => {
    const end = fromISODate(entry.date).getTime()
    const slice = series.slice(0, i + 1).filter((e) => end - fromISODate(e.date).getTime() < window * DAY_MS)
    return slice.reduce((s, e) => s + e.kg, 0) / slice.length
  })
}

export function weeklyChange(weights: WeightEntry[], days = 28) {
  const s = sortedWeights(weights)
  if (s.length < 3) return 0
  const last = fromISODate(s[s.length - 1].date).getTime()
  const pts = s
    .filter((e) => last - fromISODate(e.date).getTime() < days * DAY_MS)
    .map((e) => ({ x: (fromISODate(e.date).getTime() - last) / DAY_MS, y: e.kg }))
  const n = pts.length
  const mx = pts.reduce((a, p) => a + p.x, 0) / n
  const my = pts.reduce((a, p) => a + p.y, 0) / n
  const num = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0)
  const den = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0)
  return den === 0 ? 0 : (num / den) * 7
}

export type Eta =
  | { status: 'ok'; weeks: number; date: Date; direction: 'down' | 'up' }
  | { status: 'reached' }
  | { status: 'mismatch' }

export function computeEta(current: number, profile: Profile, now: Date): Eta {
  const diff = profile.targetWeight - current
  if (Math.abs(diff) < 0.1) return { status: 'reached' }
  if ((profile.objective === 'cut' && diff > 0) || (profile.objective === 'bulk' && diff < 0)) {
    return { status: 'mismatch' }
  }
  const rate = profile.objective === 'recomp' ? Math.min(profile.pace, 0.25) : profile.pace
  const weeks = Math.abs(diff) / Math.max(rate, 0.05)
  return {
    status: 'ok',
    weeks,
    date: addDays(startOfDay(now), Math.round(weeks * 7)),
    direction: diff < 0 ? 'down' : 'up',
  }
}

export function workoutSequence(state: Pick<FitnessState, 'plan'>) {
  return state.plan.days.map((d) => d.routineId).filter((id): id is string => id !== null)
}

export function queuedRoutineId(state: Pick<FitnessState, 'plan' | 'queueIndex'>) {
  const seq = workoutSequence(state)
  if (!seq.length) return null
  return seq[((state.queueIndex % seq.length) + seq.length) % seq.length]
}

export function previousSets(
  history: Record<string, SessionRecord>,
  routineId: string,
  exerciseId: string,
): SetEntry[] | undefined {
  const own = history[routineId]?.sets[exerciseId]
  if (own?.length) return own
  const others = Object.values(history)
    .filter((r) => r.sets[exerciseId]?.length)
    .sort((a, b) => b.date.localeCompare(a.date))
  return others[0]?.sets[exerciseId]
}

export function weightIncrement(kg: number) {
  return kg >= 15 ? 2.5 : 1
}

export type OverloadTarget =
  | { kind: 'baseline' }
  | { kind: 'weight'; kg: number; reps: number; inc: number }
  | { kind: 'reps'; kg: number; altKg: number }

export function overloadTarget(prev: SetEntry[] | undefined, repMin: number, repMax: number): OverloadTarget {
  if (!prev?.length) return { kind: 'baseline' }
  const topKg = Math.max(...prev.map((s) => s.kg))
  const inc = weightIncrement(topKg)
  if (prev.every((s) => s.reps >= repMax)) return { kind: 'weight', kg: topKg + inc, reps: repMin, inc }
  return { kind: 'reps', kg: topKg, altKg: topKg + inc }
}

export function setsVolume(sets: SetEntry[]) {
  return sets.reduce((s, e) => s + e.kg * e.reps, 0)
}

export function computeStreak(activity: string[], now: Date) {
  const set = new Set(activity)
  let streak = 0
  let gap = 0
  for (let d = 0; d < 400; d++) {
    const iso = toISODate(addDays(now, -d))
    if (set.has(iso)) {
      streak += 1 + gap
      gap = 0
    } else if (d === 0) {
      continue
    } else {
      gap++
      if (gap >= 2) break
    }
  }
  return streak
}

export function workoutsInLastDays(activity: string[], now: Date, days = 7) {
  const set = new Set(activity)
  let c = 0
  for (let d = 0; d < days; d++) if (set.has(toISODate(addDays(now, -d)))) c++
  return c
}
