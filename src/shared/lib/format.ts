const dayFormatter = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
})

const fullDayFormatter = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function initials(name?: string | null): string {
  if (!name) return 'RA'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function shortCode(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
}

export function formatDay(value?: string | null): string {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return dayFormatter.format(date)
}

export function formatFullDay(value?: string | null): string {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const formatted = fullDayFormatter.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return dateTimeFormatter.format(date)
}

export function formatRange(from?: string | null, until?: string | null): string {
  if (!from && !until) return 'Fecha por coordinar'
  if (from && until) return `${formatDay(from)} – ${formatDay(until)}`
  return formatDay(from ?? until)
}

export function relativeTime(value?: string | null): string {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} d`
}

export function quantityLabel(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function orgTypeLabel(type?: string | null): string {
  if (!type) return 'Organización'
  const normalized = type.toLowerCase()
  if (normalized === 'donor' || normalized === 'donante') return 'Donante'
  if (normalized === 'recipient' || normalized === 'receptora') return 'Receptora'
  return type
}

export function roleLabel(role?: string | null): string {
  if (!role) return 'Miembro'
  const normalized = role.toLowerCase()
  if (normalized === 'owner') return 'Propietario'
  if (normalized === 'admin') return 'Administración'
  if (normalized === 'courier' || normalized === 'repartidor' || normalized === 'driver') {
    return 'Repartidor'
  }
  if (normalized === 'member' || normalized === 'miembro') return 'Miembro'
  return role
}

export function isCourierRole(role?: string | null): boolean {
  const normalized = role?.toLowerCase()
  return normalized === 'courier' || normalized === 'repartidor' || normalized === 'driver'
}

export function isAdminRole(role?: string | null): boolean {
  const normalized = role?.toLowerCase()
  return normalized === 'admin' || normalized === 'owner'
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}

export function donationTitle(description?: string | null): string {
  if (!description) return 'Donación de alimentos'
  const firstLine = description.split(/[.\n]/)[0]?.trim()
  if (!firstLine) return 'Donación de alimentos'
  return firstLine.length > 70 ? `${firstLine.slice(0, 67)}…` : firstLine
}
