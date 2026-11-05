import { useState } from 'react'
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  PlusCircle,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Truck,
  X,
} from 'lucide-react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { initials, orgTypeLabel, roleLabel } from '../../shared/lib/format'
import { Avatar, ErrorNotice, Loading, Logo } from '../../shared/components/ui'
import { useToast } from '../../shared/components/ToastProvider'
import { useAuth } from '../../features/auth/AuthProvider'
import { useDonations } from '../../features/donations/api'
import { useWorkspace } from '../../features/workspace/WorkspaceProvider'

interface PageMeta {
  title: string
  eyebrow: string
}

function pageMeta(pathname: string, orgName: string, role: string): PageMeta {
  if (pathname === '/panel') return { title: 'Panel', eyebrow: `${orgName} · ${role}` }
  if (pathname === '/donaciones/nueva') return { title: 'Nueva donación', eyebrow: `${orgName} · ${role}` }
  if (pathname === '/donaciones') return { title: 'Donaciones', eyebrow: `${orgName} · ${role}` }
  if (pathname.startsWith('/donaciones/')) return { title: 'Detalle de donación', eyebrow: 'Donaciones' }
  if (pathname === '/entregas') return { title: 'Entregas', eyebrow: `${orgName} · ${role}` }
  if (pathname.startsWith('/entregas/')) return { title: 'Seguimiento de entrega', eyebrow: 'Entregas' }
  if (pathname === '/configuracion') return { title: 'Configuración', eyebrow: `${orgName} · ${role}` }
  if (pathname === '/courier') return { title: 'Panel del repartidor', eyebrow: 'Reparto' }
  if (pathname.startsWith('/courier/')) return { title: 'Entrega asignada', eyebrow: 'Reparto' }
  if (pathname === '/admin/verificaciones') return { title: 'Verificación de organizaciones', eyebrow: 'Administración' }
  if (pathname === '/diseno') return { title: 'Sistema de diseño', eyebrow: 'Re-Alimenta' }
  return { title: 'Panel', eyebrow: orgName }
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const workspace = useWorkspace()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const isCourier = workspace.isCourier
  const showAdmin =
    (import.meta.env.VITE_PLATFORM_ADMIN_EMAILS as string | undefined)
      ?.split(',')
      .map((value) => value.trim().toLowerCase())
      .includes((user?.email ?? '').toLowerCase()) ?? false

  const { data: donationOverview } = useDonations(
    { limit: 1 },
    Boolean(workspace.organizationId) && !isCourier,
  )

  if (workspace.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading label="Preparando tu espacio de trabajo…" />
      </div>
    )
  }

  if (workspace.isError) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-md">
          <ErrorNotice error={new Error('No pudimos cargar tu organización.')} onRetry={workspace.reload} />
        </div>
      </div>
    )
  }

  if (!workspace.organization) {
    return <Navigate to="/onboarding" replace />
  }

  const organization = workspace.organization
  const meta = pageMeta(location.pathname, organization.legal_name, roleLabel(workspace.membership?.role))

  const navItems = isCourier
    ? [
        { to: '/courier', label: 'Panel', icon: LayoutDashboard, end: true },
        { to: '/entregas', label: 'Mis entregas', icon: Truck, end: false },
        { to: '/configuracion', label: 'Configuración', icon: Settings, end: false },
      ]
    : [
        { to: '/panel', label: 'Panel', icon: LayoutDashboard, end: true },
        { to: '/donaciones', label: 'Donaciones', icon: ShoppingBasket, end: false },
        ...(workspace.isDonor
          ? [{ to: '/donaciones/nueva', label: 'Nueva donación', icon: PlusCircle, end: true }]
          : []),
        { to: '/entregas', label: 'Entregas', icon: Truck, end: false },
        { to: '/configuracion', label: 'Configuración', icon: Settings, end: false },
      ]

  const sidebar = (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-3.5 pt-5 pb-4">
      <div className="flex items-center justify-between px-1.5">
        <Link to="/panel" onClick={() => setMenuOpen(false)}>
          <Logo />
        </Link>
        <button
          type="button"
          className="icon-btn lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        className="org-switch"
        onClick={() => {
          setMenuOpen(false)
          navigate('/configuracion')
        }}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-green-100 text-[11px] font-bold text-green-700">
          {initials(organization.legal_name)}
        </span>
        <span className="meta min-w-0 flex-1">
          <strong className="block truncate text-xs">{organization.legal_name}</strong>
          <small className="block text-[10.5px] text-muted">
            {orgTypeLabel(organization.type)} · {roleLabel(workspace.membership?.role)}
          </small>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>

      <nav className="flex flex-col gap-0.5">
        <div className="nav-label">Operación</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="h-[17px] w-[17px] opacity-80" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="side-foot mt-auto flex flex-col gap-2.5">
        {showAdmin ? (
          <NavLink
            to="/admin/verificaciones"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <ShieldCheck className="h-[17px] w-[17px] opacity-80" />
            Administración
          </NavLink>
        ) : null}

        {!isCourier ? (
          <div className="rounded-xl border border-[#cfe0d4] bg-green-50 p-3">
            <div className="font-serif text-[22px] leading-none text-green-700">
              {donationOverview?.total ?? '—'}
            </div>
            <div className="mt-1 text-[10.5px] text-green-700">donaciones registradas</div>
          </div>
        ) : null}

        <Link
          to="/diseno"
          onClick={() => setMenuOpen(false)}
          className="nav-item text-[11.5px] text-muted"
        >
          <Palette className="h-[15px] w-[15px] opacity-70" />
          Sistema de diseño
        </Link>

        <div className="flex items-center gap-2.5 border-t border-line px-2 pt-2.5">
          <Avatar name={workspace.displayName} size="sm" tone={isCourier ? 'blue' : 'green'} />
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-[11.5px]">{workspace.displayName}</strong>
            <small className="block truncate text-[10px] text-muted">
              {workspace.data?.profile?.phone ?? user?.email}
            </small>
          </div>
          <button
            type="button"
            className="text-muted transition hover:text-red"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={() => {
              void logout()
            }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative h-full w-[272px] border-r border-line bg-surface shadow-soft">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-cream/90 px-4 py-3.5 backdrop-blur-md sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="icon-btn lg:hidden"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="mb-0.5 truncate text-[10px] tracking-[0.1em] text-muted uppercase">
                {meta.eyebrow}
              </p>
              <h1 className="truncate font-serif text-[21px] leading-tight font-medium tracking-[-0.02em] sm:text-[25px]">
                {meta.title}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              className="icon-btn relative"
              aria-label="Notificaciones"
              onClick={() => showToast('No tienes notificaciones nuevas.')}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-amber" />
            </button>
            <Link to="/configuracion" className="hidden items-center gap-2 sm:flex">
              <Avatar name={workspace.displayName} size="sm" tone={isCourier ? 'blue' : 'green'} />
              <span className="max-w-32 truncate text-xs font-semibold">{workspace.displayName}</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-7 sm:pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
