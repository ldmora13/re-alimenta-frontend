import { useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Check,
  ImagePlus,
  Info,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage, formatDay } from '../../../shared/lib/format'
import { EmptyState, Note } from '../../../shared/components/ui'
import { useToast } from '../../../shared/components/ToastProvider'
import { useWorkspace } from '../../workspace/WorkspaceProvider'
import { createAddress, useAddresses } from '../../organizations/api'
import { uploadAttachment } from '../../attachments/api'
import { useCreateDonation, type NewDonationItem } from '../api'

interface ItemRow extends NewDonationItem {
  key: string
}

const categories = ['Preparados', 'Frescos', 'Panadería', 'Lácteos', 'No perecederos', 'Otros']
const conditions = ['Fresco', 'Refrigerado', 'Congelado', 'Envasado', 'Otro']

function emptyItem(): ItemRow {
  return {
    key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: '',
    quantity: 1,
    category: 'Preparados',
    condition: 'Refrigerado',
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function inDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function NewDonationPage() {
  const workspace = useWorkspace()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const createDonation = useCreateDonation()
  const addressesQuery = useAddresses(workspace.organizationId)

  const [description, setDescription] = useState('')
  const [availableFrom, setAvailableFrom] = useState(today())
  const [availableUntil, setAvailableUntil] = useState(inDays(7))
  const [pickupAddressId, setPickupAddressId] = useState('')
  const [items, setItems] = useState<ItemRow[]>([emptyItem()])
  const [newLabel, setNewLabel] = useState('Cocina principal')
  const [newLine, setNewLine] = useState('')
  const [evidence, setEvidence] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const addresses = addressesQuery.data?.data ?? []
  const selectedPickupId = pickupAddressId || addresses[0]?.id || ''

  if (!workspace.isDonor) {
    return (
      <EmptyState
        title="Solo las organizaciones donantes publican."
        description="Tu organización es receptora. Puedes explorar el catálogo y reservar donaciones disponibles."
        actions={
          <Link to="/donaciones" className="btn btn-primary">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  const totalQuantity = items.reduce(
    (total, item) => total + (Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0),
    0,
  )
  const validItems = items.filter((item) => item.name.trim() && item.quantity > 0)
  const hasAddress = addresses.length > 0 || (newLabel.trim() && newLine.trim())
  const ready =
    description.trim().length > 0 &&
    validItems.length === items.length &&
    items.length > 0 &&
    Boolean(availableFrom) &&
    Boolean(availableUntil) &&
    availableUntil >= availableFrom &&
    Boolean(hasAddress)

  const checklist = [
    { label: 'Describe la donación', done: description.trim().length > 0 },
    { label: 'Detalla al menos un producto', done: validItems.length > 0 },
    { label: 'Define la ventana de recojo', done: Boolean(availableFrom && availableUntil) },
    { label: 'Indica el punto de recolección', done: Boolean(hasAddress) },
  ]

  function updateItem(key: string, patch: Partial<NewDonationItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  function removeItem(key: string) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.key !== key)))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!workspace.organizationId) return
    if (!ready) {
      setError('Completa los datos obligatorios antes de publicar.')
      return
    }

    setBusy(true)
    try {
      let addressId = selectedPickupId
      if (!addressId) {
        const address = await createAddress({
          organization_id: workspace.organizationId,
          label: newLabel.trim(),
          address_line: newLine.trim(),
        })
        addressId = address.id
      }

      const donation = await createDonation.mutateAsync({
        donor_organization_id: workspace.organizationId,
        pickup_address_id: addressId,
        description: description.trim(),
        available_from: availableFrom,
        available_until: availableUntil,
        items: items.map(({ name, quantity, category, condition }) => ({
          name: name.trim(),
          quantity,
          category,
          condition,
        })),
      })

      if (evidence) {
        try {
          await uploadAttachment({
            organizationId: workspace.organizationId,
            resourceType: 'donation',
            resourceId: donation.id,
            file: evidence,
          })
        } catch (uploadError) {
          showToast(
            `Donación publicada, pero la foto no se adjuntó: ${errorMessage(uploadError)}`,
            'error',
          )
          navigate(`/donaciones/${donation.id}`)
          return
        }
      }

      showToast('¡Donación publicada! Ya está visible en el catálogo.')
      navigate(`/donaciones/${donation.id}`)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)]">
      <div className="grid gap-4">
        <div className="rounded-panel border border-line bg-surface p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-[21px] font-medium tracking-[-0.02em]">Información de la donación</h2>
            <span className="text-[11px] text-muted">Los campos con * son obligatorios</span>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="donation-description">
              Descripción *
            </label>
            <textarea
              id="donation-description"
              className="input"
              rows={3}
              required
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej. Excedentes de buffet del mediodía: arroz, pollo y verduras, empacados en porciones."
            />
            <span className="text-[11.5px] text-muted">
              La primera línea se usa como título en el catálogo.
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label className="field-label" htmlFor="donation-from">
                Disponible desde *
              </label>
              <input
                id="donation-from"
                className="input"
                type="date"
                required
                value={availableFrom}
                onChange={(event) => setAvailableFrom(event.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="donation-until">
                Disponible hasta *
              </label>
              <input
                id="donation-until"
                className="input"
                type="date"
                required
                min={availableFrom}
                value={availableUntil}
                onChange={(event) => setAvailableUntil(event.target.value)}
              />
            </div>
          </div>

          <div className="field mt-4">
            <label className="field-label" htmlFor="donation-pickup">
              Punto de recolección *
            </label>
            {addresses.length > 0 ? (
              <select
                id="donation-pickup"
                className="select"
                required
                value={selectedPickupId}
                onChange={(event) => setPickupAddressId(event.target.value)}
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label} · {address.address_line}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid gap-2.5 rounded-xl border border-dashed border-line-strong bg-surface-2 px-3.5 py-3">
                <div className="flex items-start gap-2 text-[11.5px] text-muted">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Aún no tienes direcciones. Crea la primera aquí.
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="input"
                    aria-label="Etiqueta de la dirección"
                    required
                    maxLength={100}
                    value={newLabel}
                    onChange={(event) => setNewLabel(event.target.value)}
                    placeholder="Etiqueta"
                  />
                  <input
                    className="input"
                    aria-label="Dirección de recolección"
                    required
                    maxLength={300}
                    value={newLine}
                    onChange={(event) => setNewLine(event.target.value)}
                    placeholder="Av. Larco 345, Miraflores"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-panel border border-line bg-surface p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-[21px] font-medium tracking-[-0.02em]">Productos</h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setItems((current) => [...current, emptyItem()])}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar producto
            </button>
          </div>

          <div className="hidden gap-2 px-1 pb-1 text-[10px] tracking-[0.08em] text-muted uppercase sm:grid sm:grid-cols-[1.8fr_.7fr_1fr_1fr_34px]">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Categoría</span>
            <span>Condición</span>
            <span />
          </div>

          <div className="grid gap-2.5">
            {items.map((item, index) => (
              <div
                key={item.key}
                className="grid gap-2 sm:grid-cols-[1.8fr_.7fr_1fr_1fr_34px] sm:items-center"
              >
                <input
                  className="input"
                  aria-label={`Nombre del producto ${index + 1}`}
                  required
                  maxLength={120}
                  value={item.name}
                  onChange={(event) => updateItem(item.key, { name: event.target.value })}
                  placeholder="Ej. Arroz con pollo"
                />
                <input
                  className="input"
                  aria-label={`Cantidad del producto ${index + 1}`}
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(item.key, {
                      quantity: Number.isFinite(event.target.valueAsNumber)
                        ? event.target.valueAsNumber
                        : 0,
                    })
                  }
                />
                <select
                  className="select"
                  aria-label={`Categoría del producto ${index + 1}`}
                  value={item.category}
                  onChange={(event) => updateItem(item.key, { category: event.target.value })}
                >
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  className="select"
                  aria-label={`Condición del producto ${index + 1}`}
                  value={item.condition}
                  onChange={(event) => updateItem(item.key, { condition: event.target.value })}
                >
                  {conditions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="icon-btn h-9 w-9 justify-self-start text-muted hover:text-red sm:justify-self-auto"
                  aria-label={`Quitar producto ${index + 1}`}
                  onClick={() => removeItem(item.key)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11.5px] text-muted">
            Indica cantidades reales y unidades (raciones, kg o cajas). Los productos se cargan
            después de crear la donación.
          </p>
        </div>

        <div className="rounded-panel border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-serif text-[21px] font-medium tracking-[-0.02em]">Foto de referencia</h2>
          <p className="mt-1 mb-3 text-[12px] text-muted">
            Opcional. Ayuda a las organizaciones a reconocer los alimentos. Se adjunta al registro
            de la donación.
          </p>

          {evidence ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
              <span className="min-w-0 truncate text-[12px]">{evidence.name}</span>
              <button
                type="button"
                className="text-muted transition hover:text-red"
                aria-label="Quitar foto"
                onClick={() => {
                  setEvidence(null)
                  if (fileInput.current) fileInput.current.value = ''
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center transition hover:bg-surface-3">
              <ImagePlus className="h-6 w-6 text-green" />
              <span className="mt-2 text-[12.5px] font-semibold">Adjuntar imagen</span>
              <span className="mt-0.5 text-[11px] text-muted">JPG o PNG</span>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setEvidence(event.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:sticky lg:top-24">
        <div className="card">
          <h2 className="font-serif text-[20px] font-medium tracking-[-0.02em]">Resumen</h2>
          <p className="mt-1 text-[12px] text-muted">Revisa antes de publicar.</p>

          <div className="mt-4 grid gap-2.5 text-[12px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Productos</span>
              <b>{items.length}</b>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Unidades totales</span>
              <b>{totalQuantity}</b>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Recojo</span>
              <b className="text-right">
                {formatDay(availableFrom)} – {formatDay(availableUntil)}
              </b>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Dirección</span>
              <b className="max-w-[160px] truncate text-right">
                {addresses.find((address) => address.id === selectedPickupId)?.label ??
                  newLabel ??
                  'Por crear'}
              </b>
            </div>
          </div>

          <div className="divider" />

          <div className="grid gap-2">
            {checklist.map((item) => (
              <div
                key={item.label}
                className={`flex items-start gap-2 text-[11.5px] ${
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

          {error ? (
            <div className="mt-3 rounded-xl border border-red/20 bg-red-100 px-3 py-2.5 text-[11.5px] leading-relaxed text-red">
              {error}
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary btn-block mt-4" disabled={busy || !ready}>
            {busy ? 'Publicando…' : 'Publicar donación'}
            {busy ? null : <ArrowRight className="h-4 w-4" />}
          </button>
          <Link to="/donaciones" className="btn btn-ghost btn-block mt-1">
            Cancelar
          </Link>
        </div>

        <Note>
          <b>Publicar no reserva.</b> La donación queda visible. Cuando una organización la reserve,
          podrás coordinar la entrega desde el módulo de Entregas.
        </Note>

        <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Se crea la donación en borrador, se cargan los productos y luego se publica. Si algo falla,
          no queda visible en el catálogo.
        </div>
      </div>
    </form>
  )
}
