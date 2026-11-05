import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { donationTitle, formatDateTime, formatDay, shortCode } from '../../../shared/lib/format'
import {
  EmptyState,
  ErrorNotice,
  Loading,
  StatCard,
  StatusBadge,
} from '../../../shared/components/ui'
import { useAuth } from '../../auth/AuthProvider'
import { useWorkspace } from '../../workspace/WorkspaceProvider'
import { useDeliveries } from '../api'
import { useDonations } from '../../donations/api'

type TabKey = 'all' | 'scheduled' | 'transit' | 'delivered' | 'cancelled'

const tabStatuses: Record<Exclude<TabKey, 'all'>, string[]> = {
  scheduled: ['assigned', 'scheduled'],
  transit: ['picked_up', 'in_transit'],
  delivered: ['delivered'],
  cancelled: ['cancelled', 'rejected'],
}

function dayLabel(value?: string | null): string {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  if (same(date, today)) return 'Hoy'
  if (same(date, tomorrow)) return 'Mañana'
  return formatDay(value)
}

export function DeliveriesPage() {
  const { user } = useAuth()
  const workspace = useWorkspace()
  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')

  const deliveries = useDeliveries(
    { limit: 100, courierId: workspace.isCourier ? user?.id : undefined },
    Boolean(workspace.organizationId),
  )
  const donations = useDonations({ limit: 100 }, Boolean(workspace.organizationId))

  const donationById = useMemo(() => {
    const map = new Map((donations.data?.data ?? []).map((donation) => [donation.id, donation]))
    return map
  }, [donations.data])

  if (deliveries.isLoading) return <Loading label="Cargando entregas…" />
  if (deliveries.isError) {
    return <ErrorNotice error={deliveries.error} onRetry={() => void deliveries.refetch()} />
  }

  const all = deliveries.data?.data ?? []
  const active = all.filter((delivery) => !['delivered', 'cancelled', 'rejected'].includes(delivery.status))
  const inTransit = all.filter((delivery) => ['picked_up', 'in_transit'].includes(delivery.status))
  const delivered = all.filter((delivery) => delivery.status === 'delivered')
  const cancelled = all.filter((delivery) => ['cancelled', 'rejected'].includes(delivery.status))

  const tabCounts: Record<TabKey, number> = {
    all: all.length,
    scheduled: all.filter((delivery) => tabStatuses.scheduled.includes(delivery.status)).length,
    transit: inTransit.length,
    delivered: delivered.length,
    cancelled: cancelled.length,
  }

  const filtered = all
    .filter((delivery) => tab === 'all' || tabStatuses[tab].includes(delivery.status))
    .filter((delivery) => {
      const term = search.trim().toLowerCase()
      if (!term) return true
      const donation = donationById.get(delivery.donation_id)
      const title = donation ? donationTitle(donation.description) : ''
      return (
        title.toLowerCase().includes(term) ||
        delivery.id.toLowerCase().includes(term) ||
        shortCode('ENT', delivery.id).toLowerCase().includes(term)
      )
    })
    .sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0
      return bTime - aTime
    })

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted">
            {workspace.isCourier
              ? 'Solo ves las entregas que tienes asignadas.'
              : 'Entregas de las donaciones de tu organización.'}
          </p>
          <h2 className="mt-0.5 font-serif text-[24px] leading-tight font-medium tracking-[-0.02em]">
            {active.length} {active.length === 1 ? 'entrega activa' : 'entregas activas'}
          </h2>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            void deliveries.refetch()
            void donations.refetch()
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Truck} label="Registradas" value={all.length} hint="en total" />
        <StatCard icon={Clock} label="Activas" value={active.length} hint="por completar" />
        <StatCard
          icon={MapPin}
          label="En tránsito"
          value={inTransit.length}
          hint="recogidas o en camino"
        />
        <StatCard
          icon={CheckCircle2}
          label="Entregadas"
          value={delivered.length}
          hint={`${cancelled.length} canceladas`}
        />
      </div>

      <div className="tabs mb-0">
        {(
          [
            ['all', 'Todas'],
            ['scheduled', 'Programadas'],
            ['transit', 'En tránsito'],
            ['delivered', 'Entregadas'],
            ['cancelled', 'Canceladas'],
          ] as Array<[TabKey, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
            <span className="tab-count">{tabCounts[key]}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="input pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por donación o código de entrega"
          aria-label="Buscar entregas"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-panel border border-line bg-surface">
          <EmptyState
            icon={Truck}
            title="No hay entregas en esta vista."
            description={
              workspace.isCourier
                ? 'Cuando te asignen una entrega, aparecerá aquí con la ruta y las acciones disponibles.'
                : 'Las entregas se crean al coordinar una donación reservada. Revisa el catálogo o las donaciones de tu organización.'
            }
            actions={
              <Link to="/donaciones" className="btn btn-primary btn-sm">
                Ir a donaciones
              </Link>
            }
          />
        </div>
      ) : (
        <div className="rounded-panel border border-line bg-surface">
          <div className="divide-y divide-line">
            {filtered.map((delivery) => {
              const donation = donationById.get(delivery.donation_id)
              const title = donation ? donationTitle(donation.description) : 'Entrega programada'
              return (
                <Link
                  key={delivery.id}
                  to={`/entregas/${delivery.id}`}
                  className="grid gap-3 px-4 py-3.5 transition hover:bg-surface-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4 sm:px-5"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                      delivery.status === 'in_transit' || delivery.status === 'picked_up'
                        ? 'bg-blue-100 text-blue'
                        : delivery.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : delivery.status === 'cancelled' || delivery.status === 'rejected'
                            ? 'bg-red-100 text-red'
                            : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {delivery.status === 'delivered' ? (
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    ) : delivery.status === 'cancelled' || delivery.status === 'rejected' ? (
                      <XCircle className="h-4.5 w-4.5" />
                    ) : (
                      <Truck className="h-4.5 w-4.5" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-[13px]">{title}</strong>
                      <span className="text-[10.5px] text-muted">
                        {shortCode('ENT', delivery.id)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dayLabel(delivery.scheduled_at)}
                        {delivery.scheduled_at ? ` · ${formatDateTime(delivery.scheduled_at).split(',')[1] ?? ''}` : ''}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {delivery.courier_id
                          ? workspace.isCourier
                            ? 'Asignada a ti'
                            : 'Repartidor asignado'
                          : 'Sin repartidor'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={delivery.status} />
                  </div>

                  <span className="hidden text-[11.5px] font-semibold text-green sm:inline">
                    Ver detalle →
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted">
        Los nombres de repartidores y direcciones de otras organizaciones no se exponen por las
        políticas de acceso del backend. Las direcciones propias se gestionan en Configuración.
      </p>
    </div>
  )
}
