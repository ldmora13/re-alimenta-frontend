import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  HeartHandshake,
  Info,
  MapPin,
} from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../../shared/lib/format'
import { Loading, Logo, Note } from '../../../shared/components/ui'
import { useToast } from '../../../shared/components/ToastProvider'
import { useAuth } from '../../auth/AuthProvider'
import {
  addOrganizationMember,
  createAddress,
  createOrganization,
} from '../../organizations/api'
import { useWorkspace } from '../../workspace/WorkspaceProvider'

type Step = 'organization' | 'address'

const organizationTypes = [
  {
    value: 'donor',
    title: 'Empresa donante',
    description: 'Restaurante o empresa de alimentos con excedentes.',
    icon: Building2,
  },
  {
    value: 'recipient',
    title: 'Empresa social receptora',
    description: 'Organización que recibe alimentos para sus programas.',
    icon: HeartHandshake,
  },
]

export function OnboardingPage() {
  const { user } = useAuth()
  const workspace = useWorkspace()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [step, setStep] = useState<Step>('organization')
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [legalName, setLegalName] = useState('')
  const [type, setType] = useState('recipient')
  const [taxId, setTaxId] = useState('')
  const [city, setCity] = useState('')

  const [addressLabel, setAddressLabel] = useState('Sede principal')
  const [addressLine, setAddressLine] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  if (workspace.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading label="Cargando tu registro…" />
      </div>
    )
  }

  if (workspace.organization && step !== 'address') {
    return <Navigate to="/panel" replace />
  }

  async function handleOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    setError(null)
    setBusy(true)
    try {
      const organization = await createOrganization({
        legal_name: legalName.trim(),
        type,
        tax_id: taxId.trim(),
      })
      await addOrganizationMember({
        organization_id: organization.id,
        user_id: user.id,
        role: 'admin',
      })
      setOrganizationId(organization.id)
      setStep('address')
      showToast('Organización creada. Agrega tu primera dirección.')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  async function handleAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organizationId) return

    setError(null)
    setBusy(true)
    try {
      const label = city.trim() ? `${addressLabel.trim()} · ${city.trim()}` : addressLabel.trim()
      await createAddress({
        organization_id: organizationId,
        label,
        address_line: addressLine.trim(),
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      })
      await workspace.reload()
      showToast('¡Todo listo! Tu organización ya está en Re-Alimenta.')
      navigate('/panel', { replace: true })    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  async function finishWithoutAddress() {
    await workspace.reload()
    navigate('/panel', { replace: true })
  }

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="hidden flex-col border-r border-line bg-surface px-7 py-8 lg:flex">
        <Logo />
        <div className="mt-10 text-[9.5px] tracking-[0.14em] text-muted uppercase">Tu registro</div>

        <div className="mt-2 grid">
          <div className="flex gap-3 py-3">
            <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border border-green bg-green text-white">
              <Check className="h-3.5 w-3.5" />
            </span>
            <div>
              <div className="text-[12.5px] font-semibold">Cuenta creada</div>
              <div className="text-[11px] text-muted">
                {workspace.displayName} · {user?.email}
              </div>
            </div>
          </div>

          <div className="flex gap-3 py-3">
            <span
              className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${
                step === 'address'
                  ? 'border-green bg-green text-white'
                  : 'border-green text-green shadow-[0_0_0_4px_#f0f6f1]'
              }`}
            >
              {step === 'address' ? <Check className="h-3.5 w-3.5" /> : '2'}
            </span>
            <div>
              <div className="text-[12.5px] font-semibold">Organización</div>
              <div className="text-[11px] text-muted">Datos legales y tipo</div>
            </div>
          </div>

          <div className="flex gap-3 py-3">
            <span
              className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${
                step === 'address'
                  ? 'border-green text-green shadow-[0_0_0_4px_#f0f6f1]'
                  : 'border-line-strong text-muted'
              }`}
            >
              3
            </span>
            <div>
              <div className="text-[12.5px] font-semibold">Primera dirección</div>
              <div className="text-[11px] text-muted">Punto de recolección o recepción</div>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <Note>
            <b>Verificación pendiente.</b> Toda organización nace en revisión. Podrás operar
            mientras completas tus datos.
          </Note>
        </div>
      </aside>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        <div className="w-full max-w-[660px]">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {step === 'organization' ? 'Paso 2 de 3' : 'Paso 3 de 3'}
          </span>

          {step === 'organization' ? (
            <>
              <h1 className="mt-3 font-serif text-[32px] leading-tight font-medium tracking-[-0.02em]">
                Cuéntanos sobre tu organización.
              </h1>
              <p className="mt-2 mb-6 text-[13px] leading-relaxed text-muted">
                Estos datos aparecen en tu perfil y permiten validar la relación con donaciones y
                entregas.
              </p>

              <form onSubmit={handleOrganization} className="grid gap-4">
                <div className="field">
                  <label className="field-label" htmlFor="onb-name">
                    Nombre legal
                  </label>
                  <input
                    id="onb-name"
                    className="input"
                    required
                    maxLength={200}
                    value={legalName}
                    onChange={(event) => setLegalName(event.target.value)}
                    placeholder="Razón social"
                  />
                </div>

                <div className="field">
                  <span className="field-label">Tipo de organización</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {organizationTypes.map((option) => {
                      const selected = type === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`type-card ${selected ? 'sel' : ''}`}
                          onClick={() => setType(option.value)}
                          aria-pressed={selected}
                        >
                          <span
                            className={`grid h-9.5 w-9.5 shrink-0 place-items-center rounded-xl ${
                              option.value === 'donor'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <option.icon className="h-4.5 w-4.5" />
                          </span>
                          <span>
                            <span className="block text-[13px] font-semibold">{option.title}</span>
                            <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="field">
                    <label className="field-label" htmlFor="onb-tax">
                      RUC / Tax ID
                    </label>
                    <input
                      id="onb-tax"
                      className="input"
                      required
                      maxLength={50}
                      value={taxId}
                      onChange={(event) => setTaxId(event.target.value)}
                      placeholder="20512345678"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="onb-city">
                      Ciudad
                    </label>
                    <input
                      id="onb-city"
                      className="input"
                      maxLength={40}
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="Lima"
                    />
                    <span className="text-[11.5px] text-muted">
                      Se agrega a la etiqueta de tu primera dirección.
                    </span>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl border border-red/20 bg-red-100 px-3.5 py-2.5 text-[12px] text-red">
                    {error}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                  <span className="text-xs text-muted">Podrás editar esto después.</span>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? 'Creando organización…' : 'Continuar'}
                    {busy ? null : <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h1 className="mt-3 font-serif text-[32px] leading-tight font-medium tracking-[-0.02em]">
                Agrega tu primera dirección.
              </h1>
              <p className="mt-2 mb-6 text-[13px] leading-relaxed text-muted">
                Será el punto de recolección o recepción que verán tus contrapartes al coordinar una
                entrega.
              </p>

              <form onSubmit={handleAddress} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="field">
                    <label className="field-label" htmlFor="onb-address-label">
                      Etiqueta
                    </label>
                    <input
                      id="onb-address-label"
                      className="input"
                      required
                      maxLength={100}
                      value={addressLabel}
                      onChange={(event) => setAddressLabel(event.target.value)}
                      placeholder="Cocina principal"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="onb-address-line">
                      Dirección
                    </label>
                    <input
                      id="onb-address-line"
                      className="input"
                      required
                      maxLength={300}
                      value={addressLine}
                      onChange={(event) => setAddressLine(event.target.value)}
                      placeholder="Av. Larco 345, Miraflores"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="field">
                    <label className="field-label" htmlFor="onb-lat">
                      Latitud <span className="font-normal text-muted">(opcional)</span>
                    </label>
                    <input
                      id="onb-lat"
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
                    <label className="field-label" htmlFor="onb-lng">
                      Longitud <span className="font-normal text-muted">(opcional)</span>
                    </label>
                    <input
                      id="onb-lng"
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

                <Note tone="blue">
                  <b>La dirección exacta es privada.</b> Solo se comparte con la organización
                  involucrada en la entrega. El mapa del catálogo muestra una zona aproximada.
                </Note>

                {error ? (
                  <div className="rounded-xl border border-red/20 bg-red-100 px-3.5 py-2.5 text-[12px] text-red">
                    {error}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void finishWithoutAddress()}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Completar después
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? 'Guardando…' : 'Finalizar registro'}
                    {busy ? null : <Check className="h-4 w-4" />}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
            {step === 'organization' ? <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            <span>
              {step === 'organization'
                ? 'Al continuar se ejecutan POST /api/organizations y POST /api/organization-members con tu usuario como admin.'
                : 'La dirección se guarda con POST /api/addresses y podrás gestionarla desde Configuración.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
