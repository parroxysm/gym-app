'use client'

import { Minus, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Panel({
  children,
  className,
  as: Tag = 'section',
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn('rounded-lg border border-border bg-card', className)} {...rest}>
      {children}
    </Tag>
  )
}

export function Eyebrow({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <p id={id} className={cn('text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground', className)}>
      {children}
    </p>
  )
}

export function PanelHeader({
  title,
  meta,
  id,
  action,
}: {
  title: string
  meta?: ReactNode
  id?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 id={id} className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        {meta ? <span className="num truncate text-[11px] text-muted-foreground">{meta}</span> : null}
      </div>
      {action}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex gap-px overflow-hidden rounded-md border border-border bg-border', className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-10 flex-1 px-3 text-sm transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring',
              active ? 'bg-foreground font-medium text-background' : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  format = (n) => String(n),
  suffix,
}: {
  value: number
  onChange: (n: number) => void
  min: number
  max: number
  step?: number
  label: string
  format?: (n: number) => string
  suffix?: string
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 100) / 100))
  return (
    <div className="flex h-10 items-stretch overflow-hidden rounded-md border border-border bg-background">
      <button
        type="button"
        aria-label={`Scade ${label}`}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="flex w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <output
        aria-live="polite"
        aria-label={label}
        className="num flex min-w-14 flex-1 items-center justify-center border-x border-border px-2 text-sm"
      >
        {format(value)}
        {suffix ? <span className="ml-1 text-muted-foreground">{suffix}</span> : null}
      </output>
      <button
        type="button"
        aria-label={`Crește ${label}`}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="flex w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs text-muted-foreground">
      {children}
    </label>
  )
}

export const inputClass =
  'num h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none'

export function PrimaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function SegmentBar({
  value,
  segments = 24,
  className,
  label,
}: {
  value: number
  segments?: number
  className?: string
  label: string
}) {
  const filled = Math.round(Math.min(1, Math.max(0, value)) * segments)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cn('flex h-2.5 gap-[3px]', className)}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={cn('flex-1 rounded-[1px]', i < filled ? 'bg-primary' : 'bg-[#262624]')}
          aria-hidden
        />
      ))}
    </div>
  )
}
