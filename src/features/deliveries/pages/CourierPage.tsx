import { useMemo } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Truck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  donationTitle,
  formatFullDay,
  formatDateTime,
  shortCode,
} from '../../../shared/lib/format'
import {
  EmptyState,
  ErrorNotice,
  Loading,
  Progress,
  StatCard,
  StatusBadge,
} from '../../../shared/components/ui'
import { RouteMap } from '../../../shared/components/RouteMap'
import { useAuth } from '../../auth/AuthProvider'
import { useWorkspace } from '../../workspace/WorkspaceProvider'
import { useAddresses } from '../../organizations/api'
import { useDeliveries } from '../api'
import { useDonations } from '../../donations/api'

const activeStatuses = new Set(['assigned', 'scheduled', 'picked_up', 'in_transit'])

function isToday(value?: string | null): boolean {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function CourierPage() {
  const { user } = useAuth()
  const workspace = useWorkspace()
  const deliveries = useDeliveries(
    { courierId: user?.id, limit: 100 },
    Boolean(workspace.organizationId),
  )
  const donations = useDonations({ limit: 100 }, Boolean(workspace.organizationId))
  const addresses = useAddresses(workspace.organizationId)

  const donationById = useMemo(
    () => new Map((donations.data?.data ?? []).map((donation) => [donation.id, donation])),
    [donations.data],
  )

  if (deliveries.isLoading) return <Loading label="Cargando tus entregas…" />
  if (deliveries.isError) {
    return <ErrorNotice error={deliveries.error} onRetry={() => void deliveries.refetch()} />
  }

  const all = deliveries.data?.data ?? []
  const addressList = addresses.data?.data ?? []
  const active = all
    .filter((delivery) => activeStatuses.has(delivery.status))
    .sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0
      return aTime - bTime
    })
  const todays = active.filter((delivery) => isToday(delivery.scheduled_at))
  const completed = all.filter((delivery) => delivery.status === 'delivered')
  const completedToday = completed.filter((delivery) => isToday(delivery.updated_at))
  const next = todays[0] ?? active[0]
  const nextDonation = next ? donationById.get(next.donation_id) : undefined
  const origin = next
    ? addressList.find((address) => address.id === next.origin_address_id)
    : undefined
  const destination = next
    ? addressList.find((address) => address.id === next.destination_address_id)
    : undefined

  const completedOfTotal =
    all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0

  return (
    <div className="mx-auto grid w-full max-w-[760px] gap-5">
      <div>
        <p className="text-[11px] tracking-[0.08em] text-muted uppercase">
          {formatFullDay(new Date().toISOString())}
        </p>
        <h2 className="mt-0.5 font-serif text-[26px] leading-tight font-medium tracking-[-0.02em]">
          Hola, {workspace.displayName.split(' ')[0]}.
        </h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Tienes {active.length} {active.length === 1 ? 'entrega activa' : 'entregas activas'}.
          Actualiza cada hito al mover la donación.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Clock} label="Hoy" value={todays.length} hint="entregas programadas" />
        <StatCard icon={CheckCircle2} label="Completadas hoy" value={completedToday.length} hint="confirmadas" />
        <StatCard icon={Truck} label="En curso" value={active.length} hint="por completar" />
      </div>

      {next ? (
        <div className="overflow-hidden rounded-[22px] bg-ink text-[#f6f1e6]">
          <div className="flex items-center justify-between gap-3 px-5 pt-4">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-[#f2c879] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f2c879]" />
              Siguiente entrega
            </span>
            <StatusBadge status={next.status} />
          </div>

          <div className="px-5 pt-3">
            <h3 className="font-serif text-[22px] leading-tight font-medium tracking-[-0.02em]">
              {nextDonation ? donationTitle(nextDonation.description) : 'Entrega programada'}
            </h3>
            <div className="mt-1 text-[11.5px] text-[#b9c4bb]">
              {shortCode('ENT', next.id)} ·{' '}
              {next.scheduled_at ? formatDateTime(next.scheduled_at) : 'Sin horario definido'}
            </div>
          </div>

          <div className="mx-5 mt-4">
            <RouteMap
              originLabel={origin ? origin.label : 'Origen'}
              destinationLabel={destination ? destination.label : 'Destino'}
              caption={`${next.status === 'in_transit' ? 'En camino' : 'Ruta asignada'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 px-5 pt-3 pb-5">
            <div className="rounded-xl bg-white/6 px-3 py-2.5">
              <div className="text-[9.5px] tracking-[0.08em] text-[#9faba2] uppercase">Recojo</div>
              <div className="mt-1 text-[11.5px] font-semibold">
                {origin?.label ?? 'Punto de origen'}
              </div>
            </div>
            <div className="rounded-xl bg-white/6 px-3 py-2.5">
              <div className="text-[9.5px] tracking-[0.08em] text-[#9faba2] uppercase">
                Destino
              </div>
              <div className="mt-1 text-[11.5px] font-semibold">
                {destination?.label ?? 'Punto de entrega'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
            <span className="text-[11px] text-[#9faba2]">
              {next.courier_id === user?.id ? 'Asignada a ti' : 'Entrega de tu organización'}
            </span>
            <Link to={`/entregas/${next.id}`} className="btn btn-amber btn-sm">
              Abrir entrega
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-panel border border-line bg-surface">
          <EmptyState
            icon={Truck}
            title="No tienes entregas asignadas."
            description="Cuando la organización te asigne una entrega, aparecerá aquí con la ruta y las acciones para actualizarla."
            actions={
              <Link to="/configuracion" className="btn btn-secondary btn-sm">
                Ver mi organización
              </Link>
            }
          />
        </div>
      )}

      <div className="card">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Mi jornada</h3>
          <span className="text-[11px] text-muted">{completedOfTotal}% completado</span>
        </div>
        <Progress value={completedOfTotal} />
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
          <span>{active.length} activas</span>
          <span>{completed.length} entregadas</span>
        </div>

        <div className="divider" />

        {all.length === 0 ? (
          <p className="py-3 text-center text-[12px] text-muted">Aún no hay entregas registradas.</p>
        ) : (
          <div className="divide-y divide-line">
            {all.slice(0, 6).map((delivery) => {
              const donation = donationById.get(delivery.donation_id)
              return (
                <Link
                  key={delivery.id}
                  to={`/entregas/${delivery.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition hover:opacity-80"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        delivery.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : delivery.status === 'in_transit' || delivery.status === 'picked_up'
                            ? 'bg-blue-100 text-blue'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {delivery.status === 'delivered' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-[12px]">
                        {donation ? donationTitle(donation.description) : shortCode('ENT', delivery.id)}
                      </strong>
                      <span className="flex items-center gap-1 text-[10.5px] text-muted">
                        <MapPin className="h-3 w-3" />
                        {delivery.scheduled_at
                          ? formatDateTime(delivery.scheduled_at)
                          : 'Sin fecha'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={delivery.status} />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-muted">
        ¿Necesitas actualizar una entrega? Abre el detalle y marca el siguiente hito.
      </p>
    </div>
  )
}
