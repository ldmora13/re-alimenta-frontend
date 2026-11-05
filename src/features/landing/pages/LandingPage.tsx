import {
  ArrowRight,
  Building2,
  Check,
  Clock,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../../../shared/components/ui'
import { useAuth } from '../../auth/AuthProvider'

const steps = [
  {
    number: '01',
    title: 'Publica el excedente',
    description: 'Describe productos, cantidades, fechas y el punto de recolección.',
  },
  {
    number: '02',
    title: 'Una organización lo reserva',
    description: 'Consulta el catálogo, revisa el detalle y confirma la recepción.',
  },
  {
    number: '03',
    title: 'Asigna un repartidor',
    description: 'Coordina la entrega y comparte la ruta con quien la ejecuta.',
  },
  {
    number: '04',
    title: 'Entrega con evidencia',
    description: 'Registra cada hito y confirma la entrega con fotos o comprobantes.',
  },
]

const actors = [
  {
    icon: Building2,
    title: 'Empresas donantes',
    description: 'Restaurantes y empresas de alimentos con excedentes aptos para consumo.',
    items: ['Publican y editan donaciones', 'Asignan repartidores', 'Siguen el estado de cada entrega'],
    tone: 'bg-green-100 text-green-700',
  },
  {
    icon: HeartHandshake,
    title: 'Empresas sociales',
    description: 'Organizaciones que reciben alimentos para sus programas y comunidades.',
    items: ['Exploran donaciones disponibles', 'Reservan y confirman la recepción', 'Ven el historial de lo recibido'],
    tone: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Truck,
    title: 'Repartidores',
    description: 'Personas que trasladan la donación desde el origen hasta el destino.',
    items: ['Ven solo las entregas asignadas', 'Actualizan el avance del traslado', 'Adjuntan evidencia al entregar'],
    tone: 'bg-blue-100 text-blue',
  },
]

const impactNumbers = [
  ['1,248', 'comidas entregadas'],
  ['320 kg', 'alimentos recuperados'],
  ['12', 'organizaciones activas'],
  ['96%', 'entregas confirmadas'],
]

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const primaryTo = isAuthenticated ? '/panel' : '/registro'
  const secondaryTo = isAuthenticated ? '/panel' : '/login'

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center justify-between gap-6 border-b border-line px-5 py-4 sm:px-10 lg:px-14">
        <Logo />
        <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink-2 lg:flex">
          <a href="#como-funciona" className="transition hover:text-green">
            Cómo funciona
          </a>
          <a href="#actores" className="transition hover:text-green">
            Para donantes
          </a>
          <a href="#actores" className="transition hover:text-green">
            Para receptoras
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to={secondaryTo} className="btn btn-ghost btn-sm hidden sm:inline-flex">
            Iniciar sesión
          </Link>
          <Link to={primaryTo} className="btn btn-primary btn-sm">
            Registrar organización
          </Link>
        </div>
      </header>

      <section className="grid items-center gap-12 px-5 py-12 sm:px-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-14 lg:px-14 lg:py-16">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Rescate de alimentos · Lima
          </span>
          <h1 className="mt-5 font-serif text-[46px] leading-[1.02] font-medium tracking-[-0.03em] sm:text-[62px] lg:text-[76px]">
            Que la comida
            <br />
            no se{' '}
            <em className="relative isolate text-green not-italic">
              <span className="relative z-10 italic">pierda.</span>
              <span className="absolute right-0 bottom-1 left-0 -z-10 h-[7px] rounded bg-amber/50" />
            </em>
          </h1>
          <p className="mt-5 max-w-[470px] text-[15px] leading-relaxed text-ink-2 sm:text-base">
            Conectamos restaurantes con excedentes y organizaciones sociales que los necesitan.
            Publica, reserva y coordina la entrega en un solo lugar.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={primaryTo} className="btn btn-primary">
              Registrar mi organización
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to={secondaryTo} className="btn btn-secondary">
              {isAuthenticated ? 'Ir a mi panel' : 'Ya tengo cuenta'}
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-3 text-[12.5px] text-muted">
            <div className="flex">
              {[
                ['CV', 'bg-green-100 text-green-700'],
                ['FS', 'bg-amber-100 text-amber-700'],
                ['LP', 'bg-blue-100 text-blue'],
                ['+9', 'bg-green-100 text-green-700'],
              ].map(([label, classes], index) => (
                <span
                  key={label}
                  className={`grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-surface text-[10.5px] font-bold ${classes} ${index === 0 ? '' : '-ml-2'}`}
                >
                  {label}
                </span>
              ))}
            </div>
            <span>
              <b className="text-ink">12 organizaciones</b> ya están rescatando comida en Lima
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="arch">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80"
              alt="Verduras frescas en un mercado"
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(event) => event.currentTarget.remove()}
            />
          </div>
          <div className="stamp hidden sm:grid">
            1,248
            <small>
              comidas
              <br />
              rescatadas
            </small>
          </div>
          <div className="absolute -bottom-4 -left-2 z-10 w-[250px] rounded-2xl border border-line-strong bg-surface px-4 py-3.5 shadow-soft sm:-left-6 sm:bottom-8">
            <div className="flex items-start gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
                <Leaf className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[12.5px] leading-snug font-semibold">
                  Excedentes de buffet del mediodía
                </div>
                <div className="text-[11px] text-muted">25 raciones · Miraflores</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Publicada
              </span>
              <span className="text-[11px] text-muted">hace 12 min</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-5 grid overflow-hidden rounded-2xl border border-line bg-surface-2/40 sm:mx-10 sm:grid-cols-3 lg:mx-14">
        {[
          ['1/3', 'de los alimentos producidos se pierde antes de llegar al plato.'],
          ['68%', 'de las organizaciones sociales necesita más alimentos cada semana.'],
          ['18 min', 'es el tiempo promedio para coordinar una entrega en Re-Alimenta.'],
        ].map(([number, text], index) => (
          <div
            key={number}
            className={`px-6 py-6 ${index < 2 ? 'border-b border-line sm:border-r sm:border-b-0' : ''}`}
          >
            <div className="font-serif text-[32px] tracking-[-0.02em] text-green">{number}</div>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section id="como-funciona" className="px-5 py-16 sm:px-10 lg:px-14 lg:py-20">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <h2 className="max-w-[520px] font-serif text-[34px] leading-[1.08] font-medium tracking-[-0.025em] sm:text-[40px]">
            Del excedente a la mesa, sin fricción.
          </h2>
          <p className="max-w-[360px] text-[13px] leading-relaxed text-muted">
            Un solo flujo para publicar, reservar, asignar y entregar. Cada paso queda registrado.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="rounded-[18px] border border-line bg-surface p-5.5">
              <div className="font-serif text-[28px] tracking-[-0.02em] text-amber-700">{step.number}</div>
              <h3 className="mt-3.5 text-sm font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="actores" className="px-5 pb-16 sm:px-10 lg:px-14 lg:pb-20">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <h2 className="max-w-[520px] font-serif text-[34px] leading-[1.08] font-medium tracking-[-0.025em] sm:text-[40px]">
            Un mismo lugar para tres roles.
          </h2>
          <p className="max-w-[360px] text-[13px] leading-relaxed text-muted">
            Cada actor ve solo lo que necesita, con acciones claras según su responsabilidad.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {actors.map((actor) => (
            <div key={actor.title} className="rounded-[18px] border border-line bg-surface p-6">
              <span className={`grid h-11 w-11 place-items-center rounded-[14px] ${actor.tone}`}>
                <actor.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4.5 font-serif text-[22px] font-medium">{actor.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{actor.description}</p>
              <ul className="mt-3.5 grid gap-2 text-[12px] text-ink-2">
                {actor.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-5 grid gap-10 rounded-[26px] bg-ink px-6 py-10 text-[#f6f1e6] sm:mx-10 sm:px-10 lg:mx-14 lg:grid-cols-[1.1fr_.9fr] lg:px-12 lg:py-12">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-[#f2c879] uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Impacto compartido
          </span>
          <h2 className="mt-4 max-w-[460px] font-serif text-[30px] leading-[1.12] font-medium tracking-[-0.02em] sm:text-[36px]">
            Cada entrega es una comida que vuelve a la mesa.
          </h2>
          <p className="mt-3 max-w-[420px] text-[13px] leading-relaxed text-[#b9c4bb]">
            Re-Alimenta no solo conecta: deja un registro claro de qué se donó, quién lo recibió y
            cuándo llegó.
          </p>
          <Link to={primaryTo} className="btn btn-amber mt-6">
            Empezar a rescatar comida
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-6 flex flex-wrap gap-4 text-[11px] text-[#9faba2]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#7fd3a0]" />
              Trazabilidad por evento
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#f2c879]" />
              Coordinación en minutos
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 self-center">
          {impactNumbers.map(([number, label]) => (
            <div key={label}>
              <div className="font-serif text-[34px] leading-none text-[#f2c879] sm:text-[38px]">{number}</div>
              <div className="mt-1.5 text-[10.5px] tracking-[0.08em] text-[#9faba2] uppercase">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-6 px-5 py-12 sm:px-10 lg:flex-row lg:items-center lg:px-14 lg:py-14">
        <h2 className="max-w-[520px] font-serif text-[28px] leading-[1.15] font-medium tracking-[-0.02em] sm:text-[34px]">
          Tu excedente puede ser la cena de alguien.
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link to={primaryTo} className="btn btn-primary">
            Crear cuenta
          </Link>
          <Link to={secondaryTo} className="btn btn-secondary">
            Iniciar sesión
          </Link>
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-2 border-t border-line px-5 py-6 text-[11.5px] text-muted sm:flex-row sm:px-10 lg:px-14">
        <span>© 2026 Re-Alimenta · Lima, Perú</span>
        <span>Privacidad · Términos · Contacto</span>
      </footer>
    </div>
  )
}
