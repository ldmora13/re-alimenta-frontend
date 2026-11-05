import { useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileImage,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  Upload,
  XCircle,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  donationTitle,
  errorMessage,
  formatDateTime,
  formatFullDay,
  quantityLabel,
  shortCode,
} from '../../../shared/lib/format'
import {
  ErrorNotice,
  Loading,
  Note,
  Progress,
  StatusBadge,
} from '../../../shared/components/ui'
import { Timeline, type TimelineItem } from '../../../shared/components/Timeline'
import { RouteMap } from '../../../shared/components/RouteMap'
import { useToast } from '../../../shared/components/ToastProvider'
import { useAuth } from '../../auth/AuthProvider'
import { useWorkspace } from '../../workspace/WorkspaceProvider'
import {
  useAdvanceDelivery,
  useDelivery,
  useDeliveryEvents,
} from '../api'
import {
  attachmentUrl,
  useAttachments,
  useUploadAttachment,
} from '../../attachments/api'
import {
  useDonation,
  useDonationItems,
  useUpdateDonationStatus,
} from '../../donations/api'
import { useAddresses } from '../../organizations/api'
import { createDeliveryEvent } from '../api'
import { useQueryClient } from '@tanstack/react-query'

const eventLabels: Record<string, string> = {
  assigned: 'Entrega asignada',
  scheduled: 'Entrega programada',
  picked_up: 'Donación recogida',
  in_transit: 'En tránsito',
  delivered: 'Entrega completada',
  received: 'Recepción confirmada',
  incident: 'Incidencia reportada',
}

const nextStep: Record<
  string,
  { label: string; description: string; status: string; eventType: string }
> = {
  assigned: {
    label: 'Marcar recojo',
    description: 'Confirma que recogiste la donación en el punto de origen.',
    status: 'picked_up',
    eventType: 'picked_up',
  },
  scheduled: {
    label: 'Marcar recojo',
    description: 'Confirma que recogiste la donación en el punto de origen.',
    status: 'picked_up',
    eventType: 'picked_up',
  },
  picked_up: {
    label: 'Iniciar traslado',
    description: 'La donación va en camino al punto de destino.',
    status: 'in_transit',
    eventType: 'in_transit',
  },
  in_transit: {
    label: 'Confirmar entrega',
    description: 'Marca la entrega como completada al llegar al destino.',
    status: 'delivered',
    eventType: 'delivered',
  },
}

function eventTime(value?: string | null): string {
  return value ? formatDateTime(value) : ''
}

export function DeliveryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const workspace = useWorkspace()
  const { showToast } = useToast()

  const deliveryQuery = useDelivery(id)
  const delivery = deliveryQuery.data
  const donationQuery = useDonation(delivery?.donation_id)
  const itemsQuery = useDonationItems(delivery?.donation_id)
  const eventsQuery = useDeliveryEvents(id)
  const attachmentsQuery = useAttachments('delivery', id)
  const addressesQuery = useAddresses(workspace.organizationId)

  const advance = useAdvanceDelivery()
  const updateDonation = useUpdateDonationStatus()
  const upload = useUploadAttachment()
  const fileInput = useRef<HTMLInputElement>(null)

  const [actionError, setActionError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

  if (deliveryQuery.isLoading) return <Loading label="Cargando entrega…" />
  if (deliveryQuery.isError) {
    return <ErrorNotice error={deliveryQuery.error} onRetry={() => void deliveryQuery.refetch()} />
  }
  if (!delivery) {
    return <ErrorNotice error={new Error('No encontramos esta entrega.')} />
  }

  const deliveryId = delivery.id
  const donation = donationQuery.data
  const items = itemsQuery.data?.data ?? []
  const events = eventsQuery.data?.data ?? []
  const attachments = attachmentsQuery.data?.data ?? []
  const addresses = addressesQuery.data?.data ?? []

  const donationId = delivery.donation_id
  const isCourierOwner = Boolean(user?.id && delivery.courier_id === user.id) || workspace.isCourier
  const isRecipientOwner =
    donation?.recipient_organization_id === workspace.organizationId &&
    (workspace.organization?.type ?? '').toLowerCase() === 'recipient'
  const isDonorOwner = donation?.donor_organization_id === workspace.organizationId
  const next = nextStep[delivery.status]
  const canConfirmReception =
    isRecipientOwner && delivery.status === 'delivered' && donation?.status !== 'delivered'

  const origin = addresses.find((address) => address.id === delivery.origin_address_id)
  const destination = addresses.find((address) => address.id === delivery.destination_address_id)
  const totalQuantity = items.reduce((total, item) => total + Number(item.quantity ?? 0), 0)
  const deliveredCount = ['delivered'].includes(delivery.status) ? 3 : delivery.status === 'in_transit' ? 2 : delivery.status === 'picked_up' ? 1 : 0
  const progress = (deliveredCount / 3) * 100

  const timeline: TimelineItem[] =
    events.length > 0
      ? events.map((event, index) => ({
          title: eventLabels[event.event_type] ?? event.event_type.replace(/_/g, ' '),
          subtitle:
            event.actor_id === user?.id
              ? 'Por ti'
              : event.actor_id
                ? `Actor ${event.actor_id.slice(0, 8)}`
                : 'Sistema',
          time: eventTime(event.occurred_at),
          state: index === events.length - 1 && delivery.status !== 'delivered' ? 'active' : 'done',
        }))
      : [
          {
            title: 'Entrega creada',
            subtitle: 'Pendiente de actualizaciones',
            time: formatDateTime(delivery.created_at),
            state: 'active',
          },
        ]

  if (donation?.status === 'delivered') {
    timeline.push({
      title: 'Recepción confirmada por la organización receptora',
      subtitle: 'El ciclo de la donación quedó cerrado',
      state: 'done',
    })
  }

  async function handleAdvance() {
    if (!next) return
    setActionError(null)
    try {
      await advance.mutateAsync({
        deliveryId,
        status: next.status,
        eventType: next.eventType,
      })
      showToast(
        next.status === 'delivered'
          ? 'Entrega completada. La organización receptora debe confirmar la recepción.'
          : 'Estado de la entrega actualizado.',
      )
    } catch (requestError) {
      setActionError(errorMessage(requestError))
    }
  }

  async function handleConfirmReception() {
    if (!donation) return
    setActionError(null)
    try {
      await createDeliveryEvent({
        delivery_id: deliveryId,
        event_type: 'received',
        status: 'received',
      })
      await updateDonation.mutateAsync({ id: donation.id, status: 'delivered' })
      void queryClient.invalidateQueries({ queryKey: ['delivery-events', deliveryId] })
      void queryClient.invalidateQueries({ queryKey: ['delivery', deliveryId] })
      showToast('Recepción confirmada. ¡Gracias por cerrar el ciclo!')
    } catch (requestError) {
      setActionError(errorMessage(requestError))
    }
  }

  async function handleUpload(file: File | undefined) {
    if (!file || !workspace.organizationId) return
    setActionError(null)
    try {
      await upload.mutateAsync({
        organizationId: workspace.organizationId,
        resourceType: 'delivery',
        resourceId: deliveryId,
        file,
      })
      showToast('Evidencia adjuntada a la entrega.')
      if (fileInput.current) fileInput.current.value = ''
    } catch (requestError) {
      setActionError(errorMessage(requestError))
    }
  }

  async function openAttachment(attachmentId: string) {
    setOpeningId(attachmentId)
    try {
      const result = await attachmentUrl(attachmentId)
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } catch (requestError) {
      setActionError(errorMessage(requestError))
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={delivery.status} />
          <span className="text-[11px] text-muted">
            {shortCode('ENT', delivery.id)} · actualizada {formatFullDay(delivery.updated_at)}
          </span>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)]">
        <div className="grid gap-4">
          <div className="card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-[22px] font-medium tracking-[-0.02em]">Ruta de la entrega</h2>
              <span className="text-[11px] text-muted">
                {delivery.scheduled_at ? formatDateTime(delivery.scheduled_at) : 'Sin fecha programada'}
              </span>
            </div>

            <RouteMap
              originLabel={origin ? origin.label : 'Origen'}
              destinationLabel={destination ? destination.label : 'Destino'}
              caption={`${deliveredCount} de 3 hitos completados`}
            />

            <div className="mt-3">
              <Progress value={progress} />
              <div className="mt-1.5 flex justify-between text-[10.5px] text-muted">
                <span>Recojo</span>
                <span>En tránsito</span>
                <span>Entrega</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                <div className="text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
                  Origen
                </div>
                <div className="mt-1 flex items-start gap-2 text-[12px]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" />
                  <span>
                    <b className="block">{origin?.label ?? 'Punto de recolección'}</b>
                    <span className="text-[11px] text-muted">
                      {origin?.address_line ?? 'Dirección no visible para tu organización'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                <div className="text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
                  Destino
                </div>
                <div className="mt-1 flex items-start gap-2 text-[12px]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                  <span>
                    <b className="block">{destination?.label ?? 'Punto de entrega'}</b>
                    <span className="text-[11px] text-muted">
                      {destination?.address_line ?? 'Dirección no visible para tu organización'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              La dirección exacta solo se muestra si pertenece a tu organización. El backend no
              expone las direcciones de la contraparte.
            </p>
          </div>

          <div className="card-flat">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
                Donación asociada
              </h3>
              <Link to={`/donaciones/${donationId}`} className="link">
                Ver donación <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {donationQuery.isLoading ? (
              <p className="text-[12px] text-muted">Cargando donación…</p>
            ) : donation ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong className="text-[13px]">{donationTitle(donation.description)}</strong>
                    <div className="mt-0.5 text-[11.5px] text-muted">
                      {items.length} productos · {quantityLabel(totalQuantity)} unidades
                    </div>
                  </div>
                  <StatusBadge status={donation.status} />
                </div>
                {items.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <span key={item.id} className="chip">
                        {item.name} · {quantityLabel(Number(item.quantity))}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 flex items-start gap-2 text-[11.5px] text-muted">
                  <Package className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Recojo: {formatFullDay(donation.available_from)} –{' '}
                    {formatFullDay(donation.available_until)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-[12px] text-muted">No se pudo cargar el detalle de la donación.</p>
            )}
          </div>

          <div className="card-flat">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Evidencia</h3>
              {workspace.organizationId ? (
                <label className="btn btn-secondary btn-xs cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  {upload.isPending ? 'Subiendo…' : 'Adjuntar'}
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={upload.isPending}
                    onChange={(event) => void handleUpload(event.target.files?.[0])}
                  />
                </label>
              ) : null}
            </div>

            {attachmentsQuery.isLoading ? (
              <p className="text-[12px] text-muted">Cargando adjuntos…</p>
            ) : attachments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center">
                <FileImage className="mx-auto h-5 w-5 text-muted" />
                <p className="mt-2 text-[12px] text-muted">
                  Aún no hay fotos ni comprobantes de esta entrega.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {attachments.map((attachment) => {
                  const filename = attachment.storage_path.split('/').pop() ?? 'Adjunto'
                  const isImage = attachment.mime_type.startsWith('image/')
                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {isImage ? (
                          <FileImage className="h-4 w-4 shrink-0 text-green" />
                        ) : (
                          <Download className="h-4 w-4 shrink-0 text-muted" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-medium">{filename}</div>
                          <div className="text-[10.5px] text-muted">
                            {formatDateTime(attachment.created_at)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        disabled={openingId === attachment.id}
                        onClick={() => void openAttachment(attachment.id)}
                      >
                        {openingId === attachment.id ? 'Abriendo…' : 'Abrir'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="mt-2 text-[10.5px] text-muted">
              Los enlaces de descarga son firmados y expiran en una hora.
            </p>
          </div>

          <div className="card-flat">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Historial de eventos</h3>
              <span className="text-[11px] text-muted">
                {events.length} {events.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>
            <Timeline items={timeline} />
          </div>
        </div>

        <div className="grid gap-4 lg:sticky lg:top-24">
          <div className="card">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-semibold tracking-[0.1em] text-muted uppercase">
                Estado actual
              </span>
              <StatusBadge status={delivery.status} />
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue">
                <Truck className="h-5 w-5" />
              </span>
              <div>
                <strong className="block text-[12.5px]">
                  {workspace.isCourier ? 'Tu entrega' : 'Entrega de la donación'}
                </strong>
                <span className="text-[11px] text-muted">
                  {delivery.courier_id ? 'Repartidor asignado' : 'Sin repartidor asignado'}
                </span>
              </div>
            </div>

            {next && isCourierOwner ? (
              <>
                <div className="divider" />
                <p className="text-[12px] leading-relaxed text-ink-2">{next.description}</p>
                <button
                  type="button"
                  className="btn btn-primary btn-block mt-3"
                  disabled={advance.isPending}
                  onClick={() => void handleAdvance()}
                >
                  {advance.isPending ? 'Actualizando…' : next.label}
                  {advance.isPending ? null : <Check className="h-4 w-4" />}
                </button>
              </>
            ) : null}

            {canConfirmReception ? (
              <>
                <div className="divider" />
                <Note tone="green" className="px-3 py-2.5">
                  La entrega figura como completada. Confirma la recepción para cerrar el ciclo de
                  la donación.
                </Note>
                <button
                  type="button"
                  className="btn btn-primary btn-block mt-3"
                  disabled={updateDonation.isPending}
                  onClick={() => void handleConfirmReception()}
                >
                  {updateDonation.isPending ? 'Confirmando…' : 'Confirmar recepción'}
                  {updateDonation.isPending ? null : <ShieldCheck className="h-4 w-4" />}
                </button>
              </>
            ) : null}

            {delivery.status === 'delivered' && donation?.status === 'delivered' ? (
              <Note tone="green" className="mt-4 px-3 py-2.5">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                Ciclo completado: entrega realizada y recepción confirmada.
              </Note>
            ) : null}

            {delivery.status === 'cancelled' || delivery.status === 'rejected' ? (
              <Note className="mt-4 px-3 py-2.5">
                <XCircle className="mr-1 inline h-3.5 w-3.5" />
                Esta entrega fue cancelada o rechazada.
              </Note>
            ) : null}

            {isDonorOwner && !next ? (
              <Note className="mt-4 px-3 py-2.5">
                Como donante puedes seguir la entrega. La actualización la realiza el repartidor
                asignado.
              </Note>
            ) : null}

            {actionError ? (
              <div className="mt-3 rounded-xl border border-red/20 bg-red-100 px-3 py-2.5 text-[11.5px] leading-relaxed text-red">
                {actionError}
              </div>
            ) : null}

            <div className="divider" />

            <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-2 text-[12px]">
              <dt className="text-muted">Código</dt>
              <dd className="text-right font-medium">{shortCode('ENT', delivery.id)}</dd>
              <dt className="text-muted">Programada</dt>
              <dd className="text-right">{formatFullDay(delivery.scheduled_at)}</dd>
              <dt className="text-muted">Creada</dt>
              <dd className="text-right">{formatDateTime(delivery.created_at)}</dd>
              <dt className="text-muted">Productos</dt>
              <dd className="text-right">{items.length}</dd>
            </dl>
          </div>

          <div className="note note-blue">
            <Clock className="mt-px h-4 w-4 shrink-0" />
            <span>
              <b>Actualiza en el momento.</b> Cada cambio registra un evento inmutable con fecha,
              actor y estado; es la trazabilidad que verán ambas organizaciones.
            </span>
          </div>

          <div className="card-flat">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold">
              <Package className="h-4 w-4 text-green" />
              ¿Necesitas ayuda?
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Si no puedes completar la entrega, coordina con la organización donante. Las
              incidencias se registran como eventos del historial.
            </p>
            <Link to="/entregas" className="btn btn-secondary btn-sm btn-block mt-3">
              Volver a entregas
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
