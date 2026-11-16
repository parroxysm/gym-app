'use client'

import { fmt1, formatShortDate, fromISODate, movingAverage } from '@/lib/fitness/calc'
import type { WeightEntry } from '@/lib/fitness/types'

const W = 600
const H = 120
const PAD_Y = 10

export function WeightSparkline({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) return null
  const ma = movingAverage(entries)
  const all = [...entries.map((e) => e.kg), ...ma]
  const min = Math.min(...all) - 0.2
  const max = Math.max(...all) + 0.2
  const t0 = fromISODate(entries[0].date).getTime()
  const t1 = fromISODate(entries[entries.length - 1].date).getTime()
  const x = (iso: string) => ((fromISODate(iso).getTime() - t0) / Math.max(1, t1 - t0)) * W
  const y = (kg: number) => PAD_Y + (1 - (kg - min) / (max - min)) * (H - PAD_Y * 2)
  const path = ma.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(entries[i].date).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const lastMa = ma[ma.length - 1]

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-muted-foreground/60" aria-hidden />
            Cântar zilnic
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full bg-foreground" aria-hidden />
            Medie 7 zile
          </span>
        </div>
        <span className="num">{fmt1(lastMa)} kg</span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={`Evoluția greutății în ultimele ${entries.length} înregistrări; media pe 7 zile este ${fmt1(lastMa)} kg`}
        >
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="#232321" strokeWidth={1} />
          ))}
          {entries.map((e) => (
            <circle key={e.id} cx={x(e.date)} cy={y(e.kg)} r={2.6} fill="#8E8D8A" fillOpacity={0.45} />
          ))}
          <path d={path} fill="none" stroke="#F4F3EF" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(entries[entries.length - 1].date)} cy={y(lastMa)} r={4} fill="#E84C22" />
        </svg>
        <span className="num pointer-events-none absolute left-0 top-0 text-[10px] text-muted-foreground">
          {fmt1(max)}
        </span>
        <span className="num pointer-events-none absolute bottom-0 left-0 text-[10px] text-muted-foreground">
          {fmt1(min)}
        </span>
      </div>
      <figcaption className="num flex justify-between text-[10px] text-muted-foreground">
        <span>{formatShortDate(entries[0].date)}</span>
        <span>{formatShortDate(entries[entries.length - 1].date)}</span>
      </figcaption>
    </figure>
  )
}
