import { ArrowRight, Box, Clock, Leaf, Package, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  donationTitle,
  formatRange,
  quantityLabel,
} from '../../../shared/lib/format'
import type { Donation, DonationItem } from '../../../shared/types'
import { Badge, StatusBadge } from '../../../shared/components/ui'

const categoryIcons = {
  preparados: Sparkles,
  frescos: Leaf,
  panadería: Clock,
  lácteos: Box,
  'no perecederos': Package,
}

function CategoryIcon({ category }: { category: string }) {
  const Icon = categoryIcons[category.toLowerCase() as keyof typeof categoryIcons] ?? Package
  return <Icon className="h-[13px] w-[13px] text-green" />
}

function endsToday(value?: string | null): boolean {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function DonationCard({
  donation,
  items = [],
  compact = false,
}: {
  donation: Donation
  items?: DonationItem[]
  compact?: boolean
}) {
  const category = items[0]?.category ?? 'Alimentos'
  const condition = items.find((item) => item.condition)?.condition
  const quantity = items.reduce((total, item) => total + Number(item.quantity ?? 0), 0)
  const urgent = donation.status === 'published' && endsToday(donation.available_until)
  const stripe = urgent ? 'urgent' : donation.status === 'reserved' ? 'reserved' : ''

  return (
    <Link
      to={`/donaciones/${donation.id}`}
      className={`dcard ${compact ? 'dcard-compact' : ''} ${stripe} block no-underline`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2.5">
        <span className="cat inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">
          <CategoryIcon category={category} />
          {category}
        </span>
        {urgent ? <Badge tone="amber">Urgente</Badge> : <StatusBadge status={donation.status} />}
      </div>

      <h3
        className={`font-serif leading-[1.2] font-medium tracking-[-0.01em] ${compact ? 'text-base' : 'text-[19px]'}`}
      >
        {donationTitle(donation.description)}
      </h3>

      {compact ? null : donation.description ? (
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted">
          {donation.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          <span className="chip">
            {quantityLabel(quantity)} {items.length === 1 ? 'unidad' : 'unidades'}
          </span>
        ) : null}
        {condition ? <span className="chip">{condition}</span> : null}
        {items[0]?.name && items.length > 1 ? (
          <span className="chip">+{items.length - 1} productos</span>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-dashed border-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-2">
          <Clock className="h-3.5 w-3.5 text-muted" />
          {formatRange(donation.available_from, donation.available_until)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-green">
          Ver detalle
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}
