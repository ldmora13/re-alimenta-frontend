import { useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Share2,
  ShoppingBasket,
  Truck,
  XCircle,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  donationTitle,
  errorMessage,
  formatDateTime,
  formatFullDay,
  formatRange,
  quantityLabel,
  relativeTime,
  shortCode,
} from '../../../shared/lib/format'
import type { Address } from '../../../shared/types'
import {
  Badge,
  ErrorNotice,
  Loading,
  Note,
  StatusBadge,
} from '../../../shared/components/ui'
import { Timeline, type TimelineItem } from '../../../shared/components/Timeline'
import { RouteMap } from '../../../shared/components/RouteMap'
import { useToast } from '../../../shared/components/ToastProvider'
import { useWorkspace } from '../../workspace/WorkspaceProvider'
import { useAddresses } from '../../organizations/api'
import { useDeliveries } from '../../deliveries/api'
import {
  useDonation,
  useDonationItems,
  useReserveDonation,
  useUpdateDonationStatus,
} from '../api'

const imageByCategory: Record<string, string> = {
  preparados: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  frescos: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
  panadería: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
  lácteos: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80',
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

export function DonationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const workspace = useWorkspace()
  const { showToast } = useToast()

  const donationQuery = useDonation(id)
  const itemsQuery = useDonationItems(id)
  const addressesQuery = useAddresses(workspace.organizationId)
  const deliveriesQuery = useDeliveries({ donationId: id, limit: 5 })
  const reserve = useReserveDonation()
  const cancel = useUpdateDonationStatus()

  const [deliveryAddressId, setDeliveryAddressId] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const addresses = addressesQuery.data?.data ?? []
  const donation = donationQuery.data
  const items = itemsQuery.data?.data ?? []

  if (donationQuery.isLoading) return <Loading label="Cargando donación…" />
  if (donationQuery.isError) {
    return <ErrorNotice error={donationQuery.error} onRetry={() => void donationQuery.refetch()} />
  }
  if (!donation) {
    return <ErrorNotice error={new Error('No encontramos esta donación.')} />
  }

  const donationId = donation.id
  const selectedAddressId = deliveryAddressId || addresses[0]?.id || ''
  const isDonorOwner = donation.donor_organization_id === workspace.organizationId
  const isRecipientOwner = donation.recipient_organization_id === workspace.organizationId
  const canReserve =
    !isDonorOwner &&
    !isRecipientOwner &&
    donation.status === 'published' &&
    Boolean(workspace.organizationId)
  const canCancel =
    isDonorOwner && ['published', 'draft', 'reserved'].includes(donation.status)
  const delivery = deliveriesQuery.data?.data?.[0]
  const pickupAddress = addresses.find((address: Address) => address.id === donation.pickup_address_id)
  const totalQuantity = items.reduce((total, item) => total + Number(item.quantity ?? 0), 0)
  const category = items[0]?.category ?? 'Alimentos'
  const condition = items.find((item) => item.condition)?.condition
  const photo = imageByCategory[category.toLowerCase()] ?? imageByCategory.preparados
  const title = donationTitle(donation.description)
  const ownerName = isDonorOwner
    ? (workspace.organization?.legal_name ?? 'Tu organización')
    : 'Organización donante'

  const timeline: TimelineItem[] = [
    {
      title: 'Donación publicada',
      subtitle: ownerName,
      time: formatDateTime(donation.created_at),
      state: 'done',
    },
    {
      title:
        donation.status === 'reserved' || isRecipientOwner
          ? 'Reservada por una organización'
          : 'Esperando reserva',
      subtitle:
        donation.status === 'reserved' || isRecipientOwner
          ? 'La organización receptora coordina la entrega'
          : 'Disponible para organizaciones receptoras',
      time:
        donation.status === 'reserved'
          ? `Actualizado ${relativeTime(donation.updated_at)}`
          : 'Ahora',
      state: donation.status === 'reserved' || isRecipientOwner ? 'done' : 'active',
    },
    ...(delivery
      ? [
          {
            title:
              delivery.status === 'delivered'
                ? 'Entrega completada'
                : delivery.status === 'in_transit'
                  ? 'En tránsito al destino'
                  : 'Entrega programada',
            subtitle: delivery.courier_id
              ? 'Repartidor asignado'
              : 'Pendiente de asignar repartidor',
            time: delivery.scheduled_at ? formatDateTime(delivery.scheduled_at) : undefined,
            state: delivery.status === 'delivered' ? 'done' : 'active',
          } satisfies TimelineItem,
        ]
      : []),
    ...(donation.status === 'cancelled'
      ? [
          {
            title: 'Donación cancelada',
            subtitle: 'La publicación ya no está disponible',
            state: 'todo',
          } satisfies TimelineItem,
        ]
      : []),
  ]

  async function handleReserve() {
    if (!workspace.organizationId) return
    setActionError(null)
    try {
      await reserve.mutateAsync({
        id: donationId,
        organizationId: workspace.organizationId,
        deliveryAddressId: selectedAddressId || undefined,
      })
      showToast('Reserva enviada. La donación queda reservada para tu organización.')
    } catch (requestError) {
      setActionError(errorMessage(requestError))
    }
  }

  async function handleCancel() {
    if (!window.confirm('¿Cancelar esta donación? Las organizaciones dejarán de verla.')) return
    setActionError(null)
    try {
      await cancel.mutateAsync({ id: donationId, status: 'cancelled' })
      showToast('La donación fue cancelada.')
    } catch (requestError) {
      setActionError(errorMessage(requestError))
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Enlace copiado al portapapeles.')
    } catch {
      showToast('No pudimos copiar el enlace.', 'error')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={donation.status} />
          <span className="text-[11px] text-muted">
            {shortCode('DON', donation.id)} · {relativeTime(donation.created_at)}
          </span>
          <button type="button" className="btn btn-secondary btn-xs" onClick={() => void share()}>
            <Share2 className="h-3.5 w-3.5" />
            Compartir
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)]">
        <div className="grid gap-4">
          <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#D9C7A3,#8FA98C)]">
            <img
              src={photo}
              alt={title}
              className="h-full w-full object-cover"
              onError={(event) => event.currentTarget.remove()}
            />
            <div className="absolute top-3 left-3">
              <Badge tone="neutral">{category}</Badge>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-[26px] leading-tight font-medium tracking-[-0.02em]">
              {title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
              {donation.description || 'Sin descripción adicional.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {condition ? <span className="chip">{condition}</span> : null}
              {items.slice(0, 3).map((item) => (
                <span key={item.id} className="chip">
                  {item.name}
                </span>
              ))}
            </div>
          </div>

          <div className="card-flat">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
                Productos · {items.length}
              </h3>
              <span className="text-[11.5px] text-muted">
                {quantityLabel(totalQuantity)} unidades en total
              </span>
            </div>
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table min-w-[520px]">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Categoría</th>
                      <th>Condición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="cursor-default hover:bg-transparent">
                        <td className="main-cell">{item.name}</td>
                        <td>{quantityLabel(Number(item.quantity))}</td>
                        <td>{item.category}</td>
                        <td>{item.condition ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[12.5px] text-muted">El detalle de productos aún no está disponible.</p>
            )}
          </div>

          <div className="card-flat">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Punto de recolección</h3>
              <span className="chip">
                <MapPin className="h-3 w-3" />
                {pickupAddress ? pickupAddress.label : 'Zona aproximada'}
              </span>
            </div>
            <RouteMap
              originLabel={pickupAddress ? pickupAddress.label.slice(0, 18) : 'Recojo'}
              destinationLabel="Destino"
              caption={pickupAddress ? 'Dirección compartida' : 'Zona aproximada'}
            />
            {pickupAddress ? (
              <div className="mt-3 flex items-start gap-2 text-[12.5px] text-ink-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                <span>
                  {pickupAddress.address_line}
                  {pickupAddress.latitude !== null && pickupAddress.longitude !== null
                    ? ` · ${pickupAddress.latitude.toFixed(4)}, ${pickupAddress.longitude.toFixed(4)}`
                    : ''}
                </span>
              </div>
            ) : null}
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              La dirección exacta se comparte entre las organizaciones involucradas. El backend
              actual solo expone la dirección a miembros de la organización donante.
            </p>
          </div>

          <div className="card-flat">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Trazabilidad</h3>
              <span className="text-[11.5px] text-muted">
                Actualizado {relativeTime(donation.updated_at)}
              </span>
            </div>
            <Timeline items={timeline} />
          </div>

          {delivery ? (
            <div className="card-flat flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-blue">
                  <Truck className="h-4 w-4" />
                </span>
                <div>
                  <strong className="block text-[12.5px]">
                    {shortCode('ENT', delivery.id)} · entrega
                  </strong>
                  <span className="text-[11px] text-muted">
                    {delivery.scheduled_at
                      ? formatDateTime(delivery.scheduled_at)
                      : 'Sin fecha programada'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={delivery.status} />
                <Link to={`/entregas/${delivery.id}`} className="btn btn-secondary btn-xs">
                  Ver seguimiento
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 lg:sticky lg:top-24">
          <div className="card">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-semibold tracking-[0.1em] text-muted uppercase">
                Disponible hasta
              </span>
              {endsToday(donation.available_until) ? (
                <Badge tone="amber">Hoy</Badge>
              ) : (
                <Badge tone="neutral">{formatFullDay(donation.available_until)}</Badge>
              )}
            </div>

            <div className="mt-2 font-serif text-[28px] leading-none tracking-[-0.02em] text-green-700">
              {quantityLabel(totalQuantity)}{' '}
              <small className="font-sans text-[11px] tracking-normal text-muted">unidades</small>
            </div>
            <p className="mt-1.5 text-[11.5px] text-muted">
              Recojo {formatRange(donation.available_from, donation.available_until)}
            </p>

            <div className="my-3.5 flex items-center gap-2.5 border-y border-line py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-green-100 text-green-700">
                <ShoppingBasket className="h-4 w-4" />
              </span>
              <div>
                <strong className="block text-xs">{ownerName}</strong>
                <small className="block text-[10.5px] text-muted">
                  {isDonorOwner ? 'Tu organización' : 'Verificada · datos al confirmar'}
                </small>
              </div>
            </div>

            {canReserve ? (
              <div className="field">
                <label className="field-label" htmlFor="delivery-address">
                  Dirección de entrega
                </label>
                {addresses.length > 0 ? (
                  <select
                    id="delivery-address"
                    className="select"
                    value={selectedAddressId}
                    onChange={(event) => setDeliveryAddressId(event.target.value)}
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label} · {address.address_line}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Link to="/configuracion" className="link text-[12px]">
                    Agrega una dirección en Configuración
                  </Link>
                )}
                <span className="text-[11.5px] text-muted">
                  Puedes cambiarla desde Configuración → Direcciones.
                </span>
              </div>
            ) : null}

            {canReserve ? (
              <button
                type="button"
                className="btn btn-primary btn-block mt-4"
                disabled={reserve.isPending}
                onClick={() => void handleReserve()}
              >
                {reserve.isPending ? 'Reservando…' : 'Reservar esta donación'}
                {reserve.isPending ? null : <ArrowRight className="h-4 w-4" />}
              </button>
            ) : null}

            {canCancel ? (
              <button
                type="button"
                className="btn btn-secondary btn-block mt-2"
                disabled={cancel.isPending}
                onClick={() => void handleCancel()}
              >
                <XCircle className="h-4 w-4" />
                {cancel.isPending ? 'Cancelando…' : 'Cancelar donación'}
              </button>
            ) : null}

            {isRecipientOwner ? (
              <Note tone="green" className="mt-4 px-3 py-2.5">
                Esta donación está reservada para tu organización. Coordina la entrega desde el
                módulo de Entregas.
              </Note>
            ) : null}

            {isDonorOwner ? (
              <Link to="/entregas" className="btn btn-secondary btn-block mt-2">
                Ver entregas
              </Link>
            ) : null}

            {actionError ? (
              <div className="mt-3 rounded-xl border border-red/20 bg-red-100 px-3 py-2.5 text-[11.5px] leading-relaxed text-red">
                {actionError}
              </div>
            ) : null}

            {canReserve ? (
              <Note className="mt-4 px-3 py-2.5">
                La reserva es exclusiva. Si otra organización la toma primero, verás un aviso y
                podrás volver al catálogo.
              </Note>
            ) : null}

            <div className="divider" />

            <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-2 text-[12px]">
              <dt className="text-muted">Publicado por</dt>
              <dd className="text-right font-medium">
                {isDonorOwner ? ownerName : 'Organización verificada'}
              </dd>
              <dt className="text-muted">Categoría</dt>
              <dd className="text-right">{category}</dd>
              <dt className="text-muted">Condición</dt>
              <dd className="text-right">{condition ?? 'No especificada'}</dd>
              <dt className="text-muted">Productos</dt>
              <dd className="text-right">{items.length}</dd>
            </dl>

            {donation.status === 'reserved' && !isRecipientOwner && !isDonorOwner ? (
              <Note className="mt-4 px-3 py-2.5">
                Esta donación ya fue reservada por otra organización. Explora el catálogo para
                encontrar más opciones.
              </Note>
            ) : null}

            {donation.status === 'cancelled' ? (
              <Note className="mt-4 px-3 py-2.5">
                <XCircle className="mr-1 inline h-3.5 w-3.5" />
                Esta donación fue cancelada.
              </Note>
            ) : null}
          </div>

          <div className="note note-green">
            <AlertCircle className="mt-px h-4 w-4 shrink-0" />
            <span>
              <b>Datos protegidos.</b> La organización donante solo se identifica cuando la reserva
              se confirma. Cada evento de la entrega queda registrado.
            </span>
          </div>

          <div className="card-flat">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold">
              <CalendarDays className="h-4 w-4 text-green" />
              Ventana de recojo
            </div>
            <p className="mt-2 text-[12px] text-ink-2">
              {formatRange(donation.available_from, donation.available_until)}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
              <Clock className="h-3.5 w-3.5" />
              Coordina la entrega dentro de este rango.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
