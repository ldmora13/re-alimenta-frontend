import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Clock,
  Filter,
  MapPin,
  Plus,
  Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDay } from '../../../shared/lib/format'
import {
  EmptyState,
  ErrorNotice,
  Loading,
} from '../../../shared/components/ui'
import { useWorkspace } from '../../workspace/WorkspaceProvider'
import { useDonationItems, useDonations } from '../api'
import { DonationCard } from '../components/DonationCard'

type TabKey = 'available' | 'requests' | 'history'

const terminalStatuses = new Set(['delivered', 'cancelled'])

export function CatalogPage() {
  const workspace = useWorkspace()
  const organizationId = workspace.organizationId ?? ''
  const isDonor = workspace.isDonor

  const [tab, setTab] = useState<TabKey>('available')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<'recent' | 'soon' | 'quantity'>('recent')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const availableSummary = useDonations(
    isDonor
      ? { donor: organizationId, status: 'published', limit: 1 }
      : { status: 'published', limit: 1 },
    Boolean(organizationId),
  )
  const ownSummary = useDonations(
    isDonor
      ? { donor: organizationId, limit: 1 }
      : { recipient: organizationId, limit: 1 },
    Boolean(organizationId),
  )

  const activeFilters =
    tab === 'available'
      ? isDonor
        ? { donor: organizationId, status: 'published' }
        : { status: 'published' }
      : tab === 'requests'
        ? isDonor
          ? { donor: organizationId }
          : { recipient: organizationId }
        : isDonor
          ? { donor: organizationId, limit: 100 }
          : { recipient: organizationId, limit: 100 }

  const query = useDonations(
    {
      ...activeFilters,
      search: debouncedSearch || undefined,
      page: tab === 'history' ? 1 : page,
      limit: tab === 'history' ? 100 : 6,
      sort: sort === 'soon' ? 'available_from' : 'created_at',
      order: sort === 'soon' ? 'asc' : 'desc',
    },
    Boolean(organizationId),
  )
  const items = useDonationItems()

  const itemList = useMemo(() => items.data?.data ?? [], [items.data])
  const itemsByDonation = useMemo(() => {
    const map = new Map<string, typeof itemList>()
    for (const item of itemList) {
      const current = map.get(item.donation_id) ?? []
      current.push(item)
      map.set(item.donation_id, current)
    }
    return map
  }, [itemList])

  const categories = useMemo(
    () => Array.from(new Set(itemList.map((item) => item.category))).sort(),
    [itemList],
  )

  const rawDonations = useMemo(() => query.data?.data ?? [], [query.data])
  const filtered = useMemo(() => {
    let list = rawDonations
    if (tab === 'history') {
      list = list.filter((donation) => terminalStatuses.has(donation.status))
    }
    if (category) {
      list = list.filter((donation) =>
        (itemsByDonation.get(donation.id) ?? []).some(
          (item) => item.category.toLowerCase() === category.toLowerCase(),
        ),
      )
    }
    if (sort === 'quantity') {
      list = [...list].sort((a, b) => {
        const quantityOf = (id: string) =>
          (itemsByDonation.get(id) ?? []).reduce(
            (total, item) => total + Number(item.quantity ?? 0),
            0,
          )
        return quantityOf(b.id) - quantityOf(a.id)
      })
    }
    return list
  }, [rawDonations, tab, category, sort, itemsByDonation])

  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 6))
  const showPagination = tab !== 'history' && totalPages > 1

  const tabLabels: Array<{ key: TabKey; label: string; count?: number }> = isDonor
    ? [
        { key: 'available', label: 'Publicadas', count: availableSummary.data?.total },
        { key: 'requests', label: 'Mis donaciones', count: ownSummary.data?.total },
        { key: 'history', label: 'Historial' },
      ]
    : [
        { key: 'available', label: 'Disponibles', count: availableSummary.data?.total },
        { key: 'requests', label: 'Mis solicitudes', count: ownSummary.data?.total },
        { key: 'history', label: 'Historial' },
      ]

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="tabs mb-0 flex-1">
          {tabLabels.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={`tab ${tab === entry.key ? 'active' : ''}`}
              onClick={() => {
                setTab(entry.key)
                setPage(1)
                setCategory('')
              }}
            >
              {entry.label}
              {entry.count !== undefined ? <span className="tab-count">{entry.count}</span> : null}
            </button>
          ))}
        </div>
        {isDonor ? (
          <Link to="/donaciones/nueva" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" />
            Nueva donación
          </Link>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por producto o descripción"
            aria-label="Buscar donaciones"
          />
        </div>

        <select
          className="select w-full sm:w-[180px]"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value)
            setPage(1)
          }}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          className="select w-full sm:w-[170px]"
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
          aria-label="Ordenar donaciones"
        >
          <option value="recent">Más recientes</option>
          <option value="soon">Recojo más pronto</option>
          <option value="quantity">Mayor cantidad</option>
        </select>

        {(category || search || tab !== 'available') && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setCategory('')
              setSearch('')
              setTab('available')
              setPage(1)
            }}
          >
            <Filter className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11.5px] text-muted">
          {query.isLoading
            ? 'Buscando donaciones…'
            : `${filtered.length} ${filtered.length === 1 ? 'donación' : 'donaciones'} · ${
                tab === 'history'
                  ? 'historial completo'
                  : sort === 'soon'
                    ? 'ordenadas por fecha de recojo'
                    : 'ordenadas por publicación'
              }`}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <Clock className="h-3.5 w-3.5" />
          Actualizado ahora
        </span>
      </div>

      {query.isLoading ? (
        <Loading label="Cargando donaciones…" />
      ) : query.isError ? (
        <ErrorNotice error={query.error} onRetry={() => void query.refetch()} />
      ) : filtered.length === 0 ? (
        <>
          <div className="rounded-panel border border-line bg-surface">
            <EmptyState
              title="No hay donaciones con estos filtros."
              description="Prueba ampliando la categoría o la búsqueda. Las donaciones nuevas aparecen aquí en cuanto se publican."
              actions={
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setCategory('')
                      setSearch('')
                      setTab('available')
                      setPage(1)
                    }}
                  >
                    Limpiar filtros
                  </button>
                  <Link to="/panel" className="btn btn-secondary">
                    Volver al panel
                  </Link>
                </>
              }
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Bell,
                title: 'Avisos',
                text: 'Las donaciones nuevas de tu categoría aparecen aquí en cuanto se publican.',
              },
              {
                icon: MapPin,
                title: 'Coordina la entrega',
                text: 'La dirección exacta se comparte al confirmar la reserva entre las organizaciones.',
              },
              {
                icon: Clock,
                title: 'Revisa más tarde',
                text: 'Los restaurantes publican excedentes al cierre de cada servicio.',
              },
            ].map((hint) => (
              <div key={hint.title} className="card-flat">
                <div className="flex items-center gap-2">
                  <hint.icon className="h-4 w-4 text-green" />
                  <h3 className="text-[13.5px] font-semibold">{hint.title}</h3>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{hint.text}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {filtered.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                items={itemsByDonation.get(donation.id)}
              />
            ))}
          </div>

          {showPagination ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11.5px] text-muted">
                Mostrando {(page - 1) * 6 + 1}–{Math.min(page * 6, total)} de {total}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Anterior
                </button>
                {Array.from({ length: totalPages })
                  .slice(0, 5)
                  .map((_, index) => {
                    const value = index + 1
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`btn btn-xs ${value === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPage(value)}
                      >
                        {value}
                      </button>
                    )
                  })}
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  Siguiente
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[11.5px] text-muted">
              Mostrando {filtered.length} de {total} donaciones.
              {tab === 'history' && total > 100 ? ' El historial se limita a las 100 más recientes.' : ''}
            </p>
          )}
        </>
      )}

      {tab === 'available' && !isDonor ? (
        <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          La fecha de recojo corresponde a la ventana publicada por cada organización. Al reservar,
          coordina la entrega desde Entregas.
        </p>
      ) : null}

      {tab === 'history' ? (
        <p className="mt-4 text-[11px] text-muted">
          Historial de donaciones entregadas o canceladas. Última actualización:{' '}
          {formatDay(new Date().toISOString())}.
        </p>
      ) : null}
    </div>
  )
}
