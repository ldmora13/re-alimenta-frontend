import { Building2, Leaf, Package, Truck } from 'lucide-react'
import {
  Badge,
  Note,
  Progress,
  StatCard,
  StatusBadge,
} from '../../../shared/components/ui'
import { Timeline } from '../../../shared/components/Timeline'

const colorTokens = [
  ['Cream', 'bg-cream', '#F3EDDF', 'border border-line'],
  ['Surface', 'bg-surface', '#FFFCF5', 'border border-line'],
  ['Ink', 'bg-ink', '#161C18', ''],
  ['Green', 'bg-green', '#1E5B43', ''],
  ['Green 100', 'bg-green-100', '#E3EFE7', ''],
  ['Amber', 'bg-amber', '#D99A2B', ''],
  ['Blue', 'bg-blue', '#2A5F8F', ''],
  ['Red', 'bg-red', '#B4482F', ''],
]

const statuses = [
  'draft',
  'published',
  'reserved',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
]

export function DesignSystemPage() {
  return (
    <div className="grid gap-6">
      <div>
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          Documentación viva
        </span>
        <h2 className="mt-2 max-w-[640px] font-serif text-[30px] leading-tight font-medium tracking-[-0.02em]">
          Los cimientos visuales de Re-Alimenta.
        </h2>
        <p className="mt-2 max-w-[620px] text-[13px] leading-relaxed text-muted">
          Tokens, tipografía y componentes compartidos que usan todas las pantallas de la
          aplicación. La paleta parte de materiales reciclados, papel y verde orgánico.
        </p>
      </div>

      <section className="card">
        <h3 className="section-title">Color</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {colorTokens.map(([name, cls, hex, border]) => (
            <div key={name}>
              <div className={`h-16 rounded-xl ${cls} ${border}`} />
              <div className="mt-1.5 text-[11.5px] font-semibold">{name}</div>
              <div className="font-mono text-[10.5px] text-muted">{hex}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Tipografía</h3>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="grid gap-4">
            <div>
              <div className="text-[10px] tracking-[0.1em] text-muted uppercase">
                Fraunces · Display
              </div>
              <p className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.03em]">
                Que la comida no se pierda.
              </p>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.1em] text-muted uppercase">
                Fraunces · Título
              </div>
              <p className="font-serif text-[22px] leading-tight font-medium tracking-[-0.02em]">
                Donaciones para ti
              </p>
            </div>
          </div>
          <div className="grid content-start gap-3">
            <div>
              <div className="text-[10px] tracking-[0.1em] text-muted uppercase">Inter · Cuerpo</div>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
                Conectamos restaurantes con excedentes y organizaciones sociales que los necesitan.
              </p>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.1em] text-muted uppercase">Inter · Etiqueta</div>
              <p className="mt-1 text-[10.5px] font-semibold tracking-[0.12em] text-green uppercase">
                Rescate de alimentos · Lima
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2 font-mono text-[11px] text-muted">
              font-serif / font-sans · tracking -0.02em en títulos
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h3 className="section-title">Botones</h3>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button type="button" className="btn btn-primary">
              Publicar donación
            </button>
            <button type="button" className="btn btn-secondary">
              Ver detalle
            </button>
            <button type="button" className="btn btn-amber">
              Acción destacada
            </button>
            <button type="button" className="btn btn-ghost">
              Cancelar
            </button>
            <button type="button" className="btn btn-danger">
              Eliminar
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              Pequeño
            </button>
            <button type="button" className="btn btn-secondary btn-xs">
              Extra pequeño
            </button>
            <button type="button" className="btn btn-primary" disabled>
              Deshabilitado
            </button>
          </div>
          <p className="mt-4 text-[11.5px] text-muted">
            Altura 44 px, radio completo, foco visible con anillo verde de 3 px.
          </p>
        </section>

        <section className="card">
          <h3 className="section-title">Estados</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {statuses.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="green">Verificada</Badge>
            <Badge tone="amber">Urgente</Badge>
            <Badge tone="blue">Nueva</Badge>
            <Badge tone="red">Rechazada</Badge>
            <Badge tone="neutral">Borrador</Badge>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h3 className="section-title">Formularios</h3>
          <div className="mt-4 grid gap-3.5">
            <div className="field">
              <label className="field-label" htmlFor="ds-input">
                Nombre legal
              </label>
              <input id="ds-input" className="input" placeholder="Razón social" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="ds-select">
                Tipo de organización
              </label>
              <select id="ds-select" className="select" defaultValue="recipient">
                <option value="donor">Empresa donante</option>
                <option value="recipient">Empresa social receptora</option>
              </select>
            </div>
            <label className="check">
              <input type="checkbox" defaultChecked />
              Acepto los términos y la política de privacidad.
            </label>
          </div>
        </section>

        <section className="card">
          <h3 className="section-title">Avisos y progreso</h3>
          <div className="mt-4 grid gap-3">
            <Note>
              <b>Verificación pendiente.</b> Puedes operar mientras completas tus datos.
            </Note>
            <Note tone="green">
              <b>Recepción confirmada.</b> El ciclo de la donación quedó cerrado.
            </Note>
            <Note tone="blue">
              <b>Dirección privada.</b> Solo se comparte con la organización involucrada.
            </Note>
            <Progress value={68} />
            <Progress value={32} tone="amber" />
          </div>
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Leaf} label="Comidas" value="1,248" hint="rescatadas en Lima" />
        <StatCard icon={Package} label="Donaciones" value={32} hint="publicadas este mes" />
        <StatCard icon={Truck} label="Entregas" value={18} hint="completadas" />
        <StatCard icon={Building2} label="Organizaciones" value={12} hint="activas" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h3 className="section-title">Tarjetas</h3>
          <div className="mt-4 grid gap-3">
            <div className="dcard urgent">
              <div className="mb-2 text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">
                Preparados
              </div>
              <h4 className="font-serif text-[19px] leading-tight font-medium">
                Excedentes de buffet del mediodía
              </h4>
              <p className="mt-1 text-[12px] text-muted">25 raciones · Miraflores</p>
              <div className="mt-3 flex gap-1.5">
                <span className="chip">25 raciones</span>
                <span className="chip">Refrigerado</span>
              </div>
            </div>
            <div className="card-flat">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold">Próximo paso</span>
                <Badge tone="amber">Pendiente</Badge>
              </div>
              <p className="mt-2 text-[11.5px] text-muted">
                Confirma que recogiste la donación en el punto de origen.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="section-title">Trazabilidad</h3>
          <div className="mt-4">
            <Timeline
              items={[
                {
                  title: 'Donación publicada',
                  subtitle: 'Organización donante',
                  time: 'hace 2 h',
                  state: 'done',
                },
                {
                  title: 'Reservada por una organización',
                  subtitle: 'La entrega se coordina desde Entregas',
                  time: 'hace 1 h',
                  state: 'done',
                },
                {
                  title: 'En tránsito al destino',
                  subtitle: 'Repartidor asignado',
                  time: 'hace 12 min',
                  state: 'active',
                },
                {
                  title: 'Confirmar entrega',
                  subtitle: 'Pendiente',
                  state: 'todo',
                },
              ]}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
