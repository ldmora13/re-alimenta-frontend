import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  PackageCheck,
  Plus,
  ShoppingBasket,
  Truck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  formatFullDay,
  roleLabel,
  shortCode,
} from '../../../shared/lib/format'
import {
  Badge,
  EmptyState,
  ErrorNotice,
  Loading,
  Note,
  Progress,
  SectionHead,
  StatCard,
  StatusBadge,
} from '../../../shared/components/ui'
import { useWorkspace } from '../../workspace/WorkspaceProvider'
import { useDeliveries } from '../../deliveries/api'
import { useDonationItems, useDonations } from '../api'
import { DonationCard } from '../components/DonationCard'

const terminalStatuses = new Set(['delivered', 'cancelled', 'rejected'])

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function monthLabel(): string {
  return new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date())
}

export function DashboardPage() {
  const workspace = useWorkspace()
  const organizationId = workspace.organizationId
  const isDonor = workspace.isDonor
  const role = workspace.membership?.role

  const ownDonations = useDonations(
    isDonor
      ? { donor: organizationId ?? undefined, limit: 100 }
      : { recipient: organizationId ?? undefined, limit: 100 },
    Boolean(organizationId),
  )
  const available = useDonations(
    { status: 'published', limit: 100 },
    Boolean(organizationId) && !isDonor,
  )
  const deliveries = useDeliveries({ limit: 100 }, Boolean(organizationId))
  const items = useDonationItems()

  const isLoading = ownDonations.isLoading || deliveries.isLoading || available.isLoading
  const queryError = ownDonations.error ?? deliveries.error ?? available.error

  if (isLoading) return <Loading label="Cargando tu panel…" />
  if (queryError) {
    return (
      <ErrorNotice
        error={queryError}
        onRetry={() => {
          void ownDonations.refetch()
          void deliveries.refetch()
          void available.refetch()
        }}
      />
    )
  }

  const own = ownDonations.data?.data ?? []
  const deliveryList = deliveries.data?.data ?? []
  const availableList = available.data?.data ?? []
  const itemList = items.data?.data ?? []

  const itemsByDonation = new Map<string, typeof itemList>()
  for (const item of itemList) {
    const current = itemsByDonation.get(item.donation_id) ?? []
    current.push(item)
    itemsByDonation.set(item.donation_id, current)
  }

  const donationById = new Map(own.map((donation) => [donation.id, donation]))
  for (const donation of availableList) donationById.set(donation.id, donation)

  const published = own.filter((donation) => donation.status === 'published')
  const reserved = own.filter((donation) => donation.status === 'reserved')
  const activeDeliveries = deliveryList.filter(
    (delivery) => !terminalStatuses.has(delivery.status),
  )
  const completedDeliveries = deliveryList.filter((delivery) => delivery.status === 'delivered')
  const cancelledDeliveries = deliveryList.filter((delivery) => delivery.status === 'cancelled')
  const receivedThisMonth = completedDeliveries.filter((delivery) => {
    const date = new Date(delivery.updated_at)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })

  const completionRate =
    completedDeliveries.length + cancelledDeliveries.length > 0
      ? Math.round(
          (completedDeliveries.length /
            (completedDeliveries.length + cancelledDeliveries.length)) *
            100,
        )
      : 0

  const suggestedDonations = (isDonor ? published : availableList)
    .filter((donation) => donation.donor_organization_id !== organizationId)
    .slice(0, 2)
  const latestDonations = (isDonor ? own : availableList).slice(0, 2)
  const highlighted = suggestedDonations.length > 0 ? suggestedDonations : latestDonations

  const upcomingDeliveries = activeDeliveries.slice(0, 2)
  const firstName = workspace.displayName.split(' ')[0]

  const checklist = isDonor
    ? [
        {
          label: 'Registra los datos de tu organización',
          done: Boolean(workspace.organization?.tax_id),
        },
        { label: 'Publica tu primera donación', done: own.length > 0 },
        {
          label: 'Confirma la entrega de una donación',
          done: own.some((donation) => donation.status === 'delivered'),
        },
      ]
    : [
        {
          label: 'Registra los datos de tu organización',
          done: Boolean(workspace.organization?.tax_id),
        },
        { label: 'Solicita tu primera donación', done: own.length > 0 },
        { label: 'Confirma la recepción de una entrega', done: completedDeliveries.length > 0 },
      ]

  const checklistDone = checklist.filter((item) => item.done).length

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.08em] text-muted uppercase">
            {formatFullDay(new Date().toISOString())} · {workspace.organization?.legal_name}
          </p>
          <h2 className="mt-0.5 font-serif text-[26px] leading-tight font-medium tracking-[-0.02em]">
            {greeting()}, {firstName}.
          </h2>
        </div>
        <Link
          to={isDonor ? '/donaciones/nueva' : '/donaciones'}
          className="btn btn-primary btn-sm sm:btn"
        >
          {isDonor ? 'Publicar donación' : 'Explorar donaciones'}
          {isDonor ? <Plus className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isDonor ? (
          <>
            <StatCard
              icon={ShoppingBasket}
              label="Publicadas"
              value={published.length}
              hint={`${own.length} donaciones en total`}
            />
            <StatCard
              icon={Clock}
              label="Reservadas"
              value={reserved.length}
              hint="pendientes de entrega"
            />
            <StatCard
              icon={Truck}
              label="Entregas en curso"
              value={activeDeliveries.length}
              hint={`${deliveryList.length} entregas registradas`}
            />
            <StatCard
              icon={CheckCircle2}
              label="Entregas completadas"
              value={completedDeliveries.length}
              hint={`${completionRate}% de confirmación`}
            />
          </>
        ) : (
          <>
            <StatCard
              icon={ShoppingBasket}
              label="Disponibles"
              value={available.data?.total ?? 0}
              hint="donaciones publicadas"
            />
            <StatCard
              icon={Truck}
              label="Por recibir"
              value={activeDeliveries.length}
              hint={`${deliveryList.length} entregas registradas`}
            />
            <StatCard
              icon={CheckCircle2}
              label="Recibidas en el mes"
              value={receivedThisMonth.length}
              hint={monthLabel()}
            />
            <StatCard
              icon={ClipboardList}
              label="Solicitudes"
              value={own.length}
              hint={`${own.filter((donation) => donation.status === 'reserved').length} reservadas`}
            />
          </>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)]">
        <div className="grid gap-5">
          <section>
            <SectionHead
              title={isDonor ? 'Tus donaciones' : 'Donaciones para ti'}
              action={
                <Link to="/donaciones" className="link">
                  Ver todas <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            {highlighted.length > 0 ? (
              <div className="grid gap-3.5 sm:grid-cols-2">
                {highlighted.map((donation) => (
                  <DonationCard
                    key={donation.id}
                    donation={donation}
                    items={itemsByDonation.get(donation.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-panel border border-line bg-surface px-6 py-8 text-center">
                <p className="text-[13px] text-muted">
                  {isDonor
                    ? 'Todavía no has publicado donaciones. Crea la primera para que las organizaciones la encuentren.'
                    : 'No hay donaciones publicadas en este momento. Vuelve a revisar más tarde.'}
                </p>
                <Link
                  to={isDonor ? '/donaciones/nueva' : '/donaciones'}
                  className="btn btn-primary btn-sm mt-4"
                >
                  {isDonor ? 'Nueva donación' : 'Ir al catálogo'}
                </Link>
              </div>
            )}
          </section>

          <section className="card">
            <SectionHead
              title="Entregas en curso"
              action={
                <Link to="/entregas" className="link">
                  Ver logística <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            {upcomingDeliveries.length > 0 ? (
              <div>
                {upcomingDeliveries.map((delivery, index) => {
                  const donation = donationById.get(delivery.donation_id)
                  return (
                    <div
                      key={delivery.id}
                      className={`flex flex-wrap items-center justify-between gap-3 py-3 ${
                        index < upcomingDeliveries.length - 1 ? 'border-b border-line' : ''
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                            delivery.status === 'in_transit' || delivery.status === 'picked_up'
                              ? 'bg-blue-100 text-blue'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          <Truck className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <strong className="block truncate text-[12.5px]">
                            {shortCode('ENT', delivery.id)} ·{' '}
                            {donation?.description?.split(/[.\n]/)[0] ?? 'Entrega programada'}
                          </strong>
                          <div className="truncate text-[11px] text-muted">
                            {delivery.courier_id ? 'Repartidor asignado' : 'Sin repartidor asignado'}
                            {delivery.scheduled_at ? ` · ${delivery.scheduled_at.slice(0, 10)}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={delivery.status} />
                        <Link to={`/entregas/${delivery.id}`} className="btn btn-secondary btn-xs">
                          Seguir
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-[12.5px] text-muted">
                No hay entregas activas en este momento.
              </p>
            )}
          </section>
        </div>

        <div className="grid gap-4">
          <div className="card-flat">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Próximos pasos</h3>
              <span className="text-[11.5px] text-muted">
                {checklistDone} de {checklist.length}
              </span>
            </div>
            <div className="grid gap-2.5">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-start gap-2.5 text-[12.5px] ${
                    item.done ? 'text-ink-2' : 'text-muted'
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                      item.done
                        ? 'border-green bg-green text-white'
                        : 'border-line-strong bg-surface text-transparent'
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
            {workspace.organization?.verification_status !== 'verified' ? (
              <Note className="mt-4 px-3 py-2.5">
                Tu organización está <b>en verificación</b>. Puedes operar con normalidad.
              </Note>
            ) : (
              <Note tone="green" className="mt-4 px-3 py-2.5">
                Tu organización está <b>verificada</b>.
              </Note>
            )}
          </div>

          <div className="card-flat">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Tu impacto</h3>
              <span className="text-[11.5px] text-muted">{new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11.5px] text-muted">Entregas completadas</span>
              <b className="font-serif text-xl">{completedDeliveries.length}</b>
            </div>
            <Progress
              value={
                deliveryList.length > 0
                  ? (completedDeliveries.length / deliveryList.length) * 100
                  : 0
              }
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
              <span>{deliveryList.length} entregas registradas</span>
              <span className="font-semibold text-ink-2">
                {deliveryList.length > 0
                  ? Math.round((completedDeliveries.length / deliveryList.length) * 100)
                  : 0}
                %
              </span>
            </div>

            <div className="divider" />

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11.5px] text-muted">Entregas confirmadas</span>
              <b className="font-serif text-xl">{completionRate}%</b>
            </div>
            <Progress value={completionRate} tone="amber" />
          </div>

          <div className="card-flat">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Organización</h3>
            <div className="mt-4 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-green-100 text-xs font-bold text-green-700">
                {workspace.organization?.legal_name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <strong className="block text-[12.5px]">{workspace.organization?.legal_name}</strong>
                <div className="text-[11px] text-muted">
                  {workspace.organization?.type === 'donor' ? 'Donante' : 'Receptora'} ·{' '}
                  {roleLabel(role)}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Badge
                tone={
                  workspace.organization?.verification_status === 'verified' ? 'green' : 'amber'
                }
              >
                {workspace.organization?.verification_status === 'verified'
                  ? 'Verificada'
                  : 'Verificación pendiente'}
              </Badge>
            </div>
            <Link to="/configuracion" className="btn btn-secondary btn-sm btn-block mt-4">
              Completar datos
            </Link>
          </div>
        </div>
      </div>

      {own.length === 0 && !isDonor && availableList.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="Aún no hay actividad"
          description="Cuando las organizaciones donantes publiquen excedentes, aparecerán aquí. También puedes revisar el catálogo completo."
          actions={
            <Link to="/donaciones" className="btn btn-primary btn-sm">
              Ir al catálogo
            </Link>
          }
        />
      ) : null}

      {workspace.isAdmin ? (
        <div className="flex items-start gap-2.5 text-[11px] text-muted">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Como administrador puedes gestionar direcciones y equipo desde Configuración. La
            verificación de la organización la realiza el equipo de Re-Alimenta.
          </span>
        </div>
      ) : null}
    </div>
  )
}
