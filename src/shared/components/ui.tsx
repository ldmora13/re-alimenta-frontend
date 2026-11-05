import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, Inbox, Leaf, LoaderCircle } from 'lucide-react'
import { initials } from '../lib/format'
import { errorMessage } from '../lib/format'

export type Tone = 'green' | 'amber' | 'blue' | 'neutral' | 'red'

const toneClasses: Record<Tone, string> = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue',
  neutral: 'bg-[#ece9df] text-[#5e665f]',
  red: 'bg-red-100 text-red',
}

const avatarTone: Record<Tone, string> = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue',
  neutral: 'bg-surface-3 text-ink-2',
  red: 'bg-red-100 text-red',
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11.5 w-11.5 text-sm',
}

export function Avatar({
  name,
  tone = 'green',
  size = 'md',
  icon: Icon,
}: {
  name?: string | null
  tone?: Tone
  size?: keyof typeof sizeClasses
  icon?: LucideIcon
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold tracking-wide ${avatarTone[tone]} ${sizeClasses[size]}`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : initials(name)}
    </span>
  )
}

export function Badge({
  children,
  tone = 'neutral',
  dot = true,
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] leading-snug font-semibold whitespace-nowrap ${toneClasses[tone]} ${className}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-85" /> : null}
      {children}
    </span>
  )
}

const statusMap: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  published: { label: 'Publicada', tone: 'green' },
  reserved: { label: 'Reservada', tone: 'amber' },
  accepted: { label: 'Aceptada', tone: 'amber' },
  pending: { label: 'Pendiente', tone: 'amber' },
  assigned: { label: 'Programada', tone: 'amber' },
  scheduled: { label: 'Programada', tone: 'amber' },
  picked_up: { label: 'Recogida', tone: 'blue' },
  in_transit: { label: 'En tránsito', tone: 'blue' },
  intransit: { label: 'En tránsito', tone: 'blue' },
  delivered: { label: 'Entregada', tone: 'green' },
  received: { label: 'Recibida', tone: 'green' },
  cancelled: { label: 'Cancelada', tone: 'red' },
  rejected: { label: 'Rechazada', tone: 'red' },
  active: { label: 'Activa', tone: 'green' },
  verified: { label: 'Verificada', tone: 'green' },
  pending_verification: { label: 'Verificación pendiente', tone: 'amber' },
}

export function StatusBadge({ status, dot = true }: { status?: string | null; dot?: boolean }) {
  const key = (status ?? '').toLowerCase()
  const item = statusMap[key]
  const label = item?.label ?? (status ? status.replace(/_/g, ' ') : 'Sin estado')
  return (
    <Badge tone={item?.tone ?? 'neutral'} dot={dot}>
      {label}
    </Badge>
  )
}

export function Logo({ mark = true, className = '' }: { mark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-serif text-xl font-semibold tracking-[-0.02em] ${className}`}>
      {mark ? (
        <span className="grid h-8.5 w-8.5 -rotate-8 place-items-center rounded-[50%_50%_50%_8px] bg-green text-white">
          <Leaf className="h-4.5 w-4.5 rotate-8" />
        </span>
      ) : null}
      Re-Alimenta
    </span>
  )
}

export function Note({
  children,
  tone = 'amber',
  className = '',
}: {
  children: ReactNode
  tone?: 'amber' | 'green' | 'blue'
  className?: string
}) {
  const cls = tone === 'green' ? 'note-green' : tone === 'blue' ? 'note-blue' : ''
  return (
    <div className={`note ${cls} ${className}`}>
      <AlertCircle className="mt-px h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export function Progress({ value, tone = 'green' }: { value: number; tone?: 'green' | 'amber' }) {
  return (
    <div className="progress">
      <span
        className={tone === 'amber' ? 'bg-amber' : undefined}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: ReactNode
}) {
  return (
    <div className="stat">
      <div className="stat-k">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="stat-v">{value}</div>
      {hint ? <div className="stat-d">{hint}</div> : null}
    </div>
  )
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-muted">
      <LoaderCircle className="h-6 w-6 animate-spin text-green" />
      <span className="text-xs">{label}</span>
    </div>
  )
}

export function ErrorNotice({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-panel border border-red/20 bg-red-100/40 px-6 py-10 text-center">
      <AlertCircle className="h-6 w-6 text-red" />
      <p className="text-[13px] text-ink-2">{errorMessage(error)}</p>
      {onRetry ? (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actions,
}: {
  title: string
  description: string
  icon?: LucideIcon
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-5 grid h-28 w-28 place-items-center rounded-full border border-line bg-surface-2">
        <Icon className="h-10 w-10 text-green" />
      </div>
      <h2 className="font-serif text-[26px] font-medium tracking-[-0.02em]">{title}</h2>
      <p className="mt-2 max-w-md text-[13.5px] text-muted">{description}</p>
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function SectionHead({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  )
}
