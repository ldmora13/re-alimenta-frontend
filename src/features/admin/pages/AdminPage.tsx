import { useMemo, useState } from 'react'
import { Building2, CheckCircle2, Clock, Search, ShieldCheck } from 'lucide-react'
import { initials, orgTypeLabel } from '../../../shared/lib/format'
import {
  Badge,
  ErrorNotice,
  Loading,
  Note,
  StatCard,
} from '../../../shared/components/ui'
import { useAuth } from '../../auth/AuthProvider'
import { useOrganizations } from '../../organizations/api'

function adminEmails(): string[] {
  return ((import.meta.env.VITE_PLATFORM_ADMIN_EMAILS as string | undefined) ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function AdminPage() {
  const { user } = useAuth()
  const allowed = adminEmails().includes((user?.email ?? '').toLowerCase())
  const organizations = useOrganizations(allowed)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = organizations.data?.data ?? []
    if (!term) return list
    return list.filter(
      (organization) =>
        organization.legal_name.toLowerCase().includes(term) ||
        organization.tax_id.toLowerCase().includes(term),
    )
  }, [organizations.data, search])

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <ErrorNotice
          error={
            new Error(
              'Acceso restringido. Configura VITE_PLATFORM_ADMIN_EMAILS con el correo de un administrador de plataforma.',
            )
          }
        />
      </div>
    )
  }

  const list = organizations.data?.data ?? []
  const verified = list.filter((organization) => organization.verification_status === 'verified')
  const pending = list.filter((organization) => organization.verification_status !== 'verified')

  return (
    <div className="grid gap-5">
      <Note tone="blue">
        <b>Fase 2.</b> El backend actual no tiene un rol de administrador de plataforma ni un
        endpoint de verificación global. Esta pantalla lista las organizaciones visibles según las
        políticas RLS y deja las acciones de aprobación en modo informativo.
      </Note>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Organizaciones"
          value={organizations.data?.total ?? 0}
          hint="visibles para tu usuario"
        />
        <StatCard icon={ShieldCheck} label="Verificadas" value={verified.length} hint="estado verified" />
        <StatCard icon={Clock} label="Pendientes" value={pending.length} hint="en revisión" />
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="input pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o RUC"
          aria-label="Buscar organizaciones"
        />
      </div>

      {organizations.isLoading ? (
        <Loading label="Cargando organizaciones…" />
      ) : organizations.isError ? (
        <ErrorNotice
          error={organizations.error}
          onRetry={() => void organizations.refetch()}
        />
      ) : (
        <div className="rounded-panel border border-line bg-surface">
          <div className="hidden grid-cols-[1.6fr_.7fr_.9fr_.7fr] gap-3 border-b border-line px-5 py-2.5 text-[10px] tracking-[0.08em] text-muted uppercase sm:grid">
            <span>Organización</span>
            <span>Tipo</span>
            <span>RUC</span>
            <span>Estado</span>
          </div>
          <div className="divide-y divide-line">
            {filtered.map((organization) => (
              <div
                key={organization.id}
                className="grid gap-2 px-4 py-3.5 sm:grid-cols-[1.6fr_.7fr_.9fr_.7fr] sm:items-center sm:gap-3 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-green-100 text-[10px] font-bold text-green-700">
                    {initials(organization.legal_name)}
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-[12.5px]">
                      {organization.legal_name}
                    </strong>
                    <span className="text-[10.5px] text-muted">
                      Alta {organization.created_at.slice(0, 10)}
                    </span>
                  </div>
                </div>
                <span className="text-[12px] text-ink-2">{orgTypeLabel(organization.type)}</span>
                <span className="text-[12px] text-ink-2">{organization.tax_id}</span>
                <div>
                  {organization.verification_status === 'verified' ? (
                    <Badge tone="green">
                      <CheckCircle2 className="h-3 w-3" /> Verificada
                    </Badge>
                  ) : (
                    <Badge tone="amber">Pendiente</Badge>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12.5px] text-muted">
                No hay organizaciones que coincidan con la búsqueda.
              </p>
            ) : null}
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted">
        Para habilitar aprobaciones reales hace falta un endpoint con service role o un rol
        `platform_admin` en la base de datos. No se simulan acciones que el backend rechazaría.
      </p>
    </div>
  )
}
