import { useState, type FormEvent } from 'react'
import {
  Building2,
  Check,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  errorMessage,
  initials,
  orgTypeLabel,
  roleLabel,
  shortCode,
} from '../../../shared/lib/format'
import type { Address } from '../../../shared/types'
import {
  Badge,
  ErrorNotice,
  Loading,
  Note,
} from '../../../shared/components/ui'
import { useToast } from '../../../shared/components/ToastProvider'
import { useAuth } from '../../auth/AuthProvider'
import { useWorkspace } from '../../workspace/WorkspaceProvider'
import {
  useAddresses,
  useMembers,
  useOrganizationMutations,
} from '../../organizations/api'

type TabKey = 'organization' | 'addresses' | 'team'

const roleOptions = ['admin', 'member', 'courier']

export function SettingsPage() {
  const { user } = useAuth()
  const workspace = useWorkspace()
  const organization = workspace.organization
  const organizationId = workspace.organizationId
  const { showToast } = useToast()
  const [tab, setTab] = useState<TabKey>('organization')

  const addressesQuery = useAddresses(organizationId)
  const membersQuery = useMembers(organizationId)
  const mutations = useOrganizationMutations()

  const [legalName, setLegalName] = useState(organization?.legal_name ?? '')
  const [taxId, setTaxId] = useState(organization?.tax_id ?? '')
  const [type, setType] = useState(organization?.type ?? 'recipient')
  const [orgError, setOrgError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [addressLabel, setAddressLabel] = useState('Sede principal')
  const [addressLine, setAddressLine] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [addressError, setAddressError] = useState<string | null>(null)

  const [memberId, setMemberId] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [memberError, setMemberError] = useState<string | null>(null)

  if (!organization || !organizationId) {
    return <ErrorNotice error={new Error('No encontramos tu organización.')} />
  }

  const orgId = organizationId
  const addresses = addressesQuery.data?.data ?? []
  const members = membersQuery.data?.data ?? []
  const dirty =
    legalName.trim() !== organization.legal_name ||
    taxId.trim() !== organization.tax_id ||
    type !== organization.type

  async function saveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOrgError(null)
    try {
      await mutations.updateOrg.mutateAsync({
        id: orgId,
        input: { legal_name: legalName.trim(), tax_id: taxId.trim(), type },
      })
      await workspace.reload()
      showToast('Datos de la organización actualizados.')
    } catch (requestError) {
      setOrgError(errorMessage(requestError))
    }
  }

  function resetAddressForm() {
    setEditingId(null)
    setAddressLabel('Sede principal')
    setAddressLine('')
    setLatitude('')
    setLongitude('')
    setAddressError(null)
  }

  function editAddress(address: Address) {
    setEditingId(address.id)
    setAddressLabel(address.label)
    setAddressLine(address.address_line)
    setLatitude(address.latitude !== null ? String(address.latitude) : '')
    setLongitude(address.longitude !== null ? String(address.longitude) : '')
    setAddressError(null)
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAddressError(null)
    const input = {
      label: addressLabel.trim(),
      address_line: addressLine.trim(),
      ...(latitude ? { latitude: Number(latitude) } : {}),
      ...(longitude ? { longitude: Number(longitude) } : {}),
    }

    try {
      if (editingId) {
        await mutations.editAddress.mutateAsync({ id: editingId, input })
        showToast('Dirección actualizada.')
      } else {
        await mutations.addAddress.mutateAsync({
          organization_id: orgId,
          ...input,
        })
        showToast('Dirección agregada.')
      }
      resetAddressForm()
    } catch (requestError) {
      setAddressError(errorMessage(requestError))
    }
  }

  async function removeAddress(address: Address) {
    if (!window.confirm(`¿Eliminar la dirección "${address.label}"?`)) return
    setAddressError(null)
    try {
      await mutations.removeAddress.mutateAsync(address.id)
      if (editingId === address.id) resetAddressForm()
      showToast('Dirección eliminada.')
    } catch (requestError) {
      setAddressError(errorMessage(requestError))
    }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMemberError(null)
    try {
      await mutations.addMember.mutateAsync({
        organization_id: orgId,
        user_id: memberId.trim(),
        role: memberRole,
      })
      setMemberId('')
      setMemberRole('member')
      showToast('Miembro agregado al equipo.')
    } catch (requestError) {
      setMemberError(errorMessage(requestError))
    }
  }

  async function removeMember(id: string) {
    if (!window.confirm('¿Quitar a este miembro de la organización?')) return
    setMemberError(null)
    try {
      await mutations.removeMember.mutateAsync(id)
      showToast('Miembro removido.')
    } catch (requestError) {
      setMemberError(errorMessage(requestError))
    }
  }

  return (
    <div className="grid gap-5">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-green-100 text-sm font-bold text-green-700">
            {initials(organization.legal_name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-serif text-[22px] leading-tight font-medium tracking-[-0.02em]">
              {organization.legal_name}
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
              <span>{orgTypeLabel(organization.type)}</span>
              <span>·</span>
              <span>RUC {organization.tax_id}</span>
              <span>·</span>
              <span>{roleLabel(workspace.membership?.role)}</span>
            </div>
          </div>
        </div>
        <Badge tone={organization.verification_status === 'verified' ? 'green' : 'amber'}>
          {organization.verification_status === 'verified'
            ? 'Verificada'
            : 'Verificación pendiente'}
        </Badge>
      </div>

      <div className="tabs mb-0">
        {(
          [
            ['organization', 'Organización', Building2],
            ['addresses', 'Direcciones', MapPin],
            ['team', 'Equipo', Users],
          ] as Array<[TabKey, string, typeof Building2]>
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            className={`tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            <span className="tab-count">
              {key === 'addresses' ? addresses.length : key === 'team' ? members.length : ''}
            </span>
          </button>
        ))}
      </div>

      {tab === 'organization' ? (
        <form onSubmit={saveOrganization} className="card grid gap-4">
          <div>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Datos de la organización</h3>
            <p className="mt-1 text-[12px] text-muted">
              Esta información identifica a tu organización ante las contrapartes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label className="field-label" htmlFor="settings-name">
                Nombre legal
              </label>
              <input
                id="settings-name"
                className="input"
                required
                maxLength={200}
                value={legalName}
                onChange={(event) => setLegalName(event.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="settings-tax">
                RUC / Tax ID
              </label>
              <input
                id="settings-tax"
                className="input"
                required
                maxLength={50}
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
              />
            </div>
          </div>

          <div className="field max-w-xs">
            <label className="field-label" htmlFor="settings-type">
              Tipo de organización
            </label>
            <select
              id="settings-type"
              className="select"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="donor">Empresa donante</option>
              <option value="recipient">Empresa social receptora</option>
            </select>
          </div>

          <Note>
            <b>La verificación la realiza Re-Alimenta.</b> Tu estado actual es{' '}
            <b>{organization.verification_status === 'verified' ? 'verificado' : 'pendiente'}</b>.
            Puedes operar mientras se revisa.
          </Note>

          {orgError ? (
            <div className="rounded-xl border border-red/20 bg-red-100 px-3 py-2.5 text-[12px] text-red">
              {orgError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-[11.5px] text-muted">
              Última actualización: {organization.updated_at.slice(0, 10)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setLegalName(organization.legal_name)
                  setTaxId(organization.tax_id)
                  setType(organization.type)
                  setOrgError(null)
                }}
                disabled={!dirty}
              >
                Descartar
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!dirty || mutations.updateOrg.isPending}
              >
                <Check className="h-3.5 w-3.5" />
                {mutations.updateOrg.isPending ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {tab === 'addresses' ? (
        <div className="grid gap-4">
          <div className="card">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
              {editingId ? 'Editar dirección' : 'Agregar dirección'}
            </h3>
            <p className="mt-1 text-[12px] text-muted">
              Se usan como punto de recolección o recepción al coordinar una entrega.
            </p>

            <form onSubmit={saveAddress} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="field">
                  <label className="field-label" htmlFor="address-label">
                    Etiqueta
                  </label>
                  <input
                    id="address-label"
                    className="input"
                    required
                    maxLength={100}
                    value={addressLabel}
                    onChange={(event) => setAddressLabel(event.target.value)}
                    placeholder="Cocina principal"
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="address-line">
                    Dirección
                  </label>
                  <input
                    id="address-line"
                    className="input"
                    required
                    maxLength={300}
                    value={addressLine}
                    onChange={(event) => setAddressLine(event.target.value)}
                    placeholder="Av. Larco 345, Miraflores"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="field">
                  <label className="field-label" htmlFor="address-lat">
                    Latitud <span className="font-normal text-muted">(opcional)</span>
                  </label>
                  <input
                    id="address-lat"
                    className="input"
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    placeholder="-12.1219"
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="address-lng">
                    Longitud <span className="font-normal text-muted">(opcional)</span>
                  </label>
                  <input
                    id="address-lng"
                    className="input"
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    placeholder="-77.0297"
                  />
                </div>
              </div>

              {addressError ? (
                <div className="rounded-xl border border-red/20 bg-red-100 px-3 py-2.5 text-[12px] text-red">
                  {addressError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2">
                {editingId ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={resetAddressForm}
                  >
                    Cancelar
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={mutations.addAddress.isPending || mutations.editAddress.isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {editingId
                    ? mutations.editAddress.isPending
                      ? 'Guardando…'
                      : 'Guardar dirección'
                    : mutations.addAddress.isPending
                      ? 'Agregando…'
                      : 'Agregar dirección'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Direcciones</h3>
              <span className="text-[11.5px] text-muted">{addresses.length} registradas</span>
            </div>

            {addressesQuery.isLoading ? (
              <Loading label="Cargando direcciones…" />
            ) : addressesQuery.isError ? (
              <ErrorNotice
                error={addressesQuery.error}
                onRetry={() => void addressesQuery.refetch()}
              />
            ) : addresses.length === 0 ? (
              <p className="py-5 text-center text-[12.5px] text-muted">
                Aún no hay direcciones. Agrega la primera arriba.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <strong className="block text-[12.5px]">{address.label}</strong>
                        <span className="block truncate text-[11.5px] text-muted">
                          {address.address_line}
                        </span>
                        {address.latitude !== null && address.longitude !== null ? (
                          <span className="text-[10.5px] text-muted">
                            {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => editAddress(address)}
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-red"
                        onClick={() => void removeAddress(address)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'team' ? (
        <div className="grid gap-4">
          <div className="card">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Agregar miembro</h3>
            <p className="mt-1 text-[12px] text-muted">
              El backend requiere el UUID del usuario ya registrado. No envía invitaciones por
              correo.
            </p>

            <form onSubmit={addMember} className="mt-4 grid gap-3 sm:grid-cols-[1.6fr_.8fr_auto]">
              <div className="field">
                <label className="field-label" htmlFor="member-id">
                  UUID del usuario
                </label>
                <input
                  id="member-id"
                  className="input font-mono text-[12px]"
                  required
                  value={memberId}
                  onChange={(event) => setMemberId(event.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="member-role">
                  Rol
                </label>
                <select
                  id="member-role"
                  className="select"
                  value={memberRole}
                  onChange={(event) => setMemberRole(event.target.value)}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={mutations.addMember.isPending || !workspace.isAdmin}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {mutations.addMember.isPending ? 'Agregando…' : 'Agregar'}
                </button>
              </div>
            </form>

            {!workspace.isAdmin ? (
              <Note className="mt-3 px-3 py-2.5">
                Solo administradores pueden agregar o quitar miembros. Tu rol actual es{' '}
                <b>{roleLabel(workspace.membership?.role)}</b>.
              </Note>
            ) : null}

            {memberError ? (
              <div className="mt-3 rounded-xl border border-red/20 bg-red-100 px-3 py-2.5 text-[12px] text-red">
                {memberError}
              </div>
            ) : null}
          </div>

          <div className="card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Equipo</h3>
              <span className="text-[11.5px] text-muted">{members.length} miembros</span>
            </div>

            {membersQuery.isLoading ? (
              <Loading label="Cargando equipo…" />
            ) : membersQuery.isError ? (
              <ErrorNotice error={membersQuery.error} onRetry={() => void membersQuery.refetch()} />
            ) : (
              <div className="divide-y divide-line">
                {members.map((member) => {
                  const self = member.user_id === user?.id
                  return (
                    <div
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-3 text-[10px] font-bold text-ink-2">
                          {self ? initials(workspace.displayName) : member.user_id.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <strong className="block truncate text-[12.5px]">
                            {self ? workspace.displayName : `Usuario ${shortCode('U', member.user_id)}`}
                          </strong>
                          <span className="block truncate text-[10.5px] text-muted">
                            {self ? user?.email : member.user_id}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={member.role === 'courier' ? 'blue' : 'neutral'} dot={false}>
                          {roleLabel(member.role)}
                        </Badge>
                        {workspace.isAdmin && !self ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-red"
                            disabled={mutations.removeMember.isPending}
                            onClick={() => void removeMember(member.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Quitar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 text-[10.5px] leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Los nombres de otros usuarios no se exponen por las políticas de privacidad del
              backend. El UUID identifica a cada miembro.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
