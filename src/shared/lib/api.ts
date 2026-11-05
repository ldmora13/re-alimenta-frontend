import type { Session } from '../types'

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
export const API_BASE = RAW_BASE && RAW_BASE.length > 0 ? RAW_BASE.replace(/\/$/, '') : '/api'

const SESSION_KEY = 're-alimenta.session'
const SESSION_EVENT = 're-alimenta:session'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly payload?: unknown

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export function onSessionChange(handler: () => void): () => void {
  const listener = () => handler()
  window.addEventListener(SESSION_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(SESSION_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

let refreshPromise: Promise<Session | null> | null = null

async function refreshSession(): Promise<Session | null> {
  const current = getSession()
  if (!current?.refresh_token) return null

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    })
      .then(async (response) => {
        if (!response.ok) {
          clearSession()
          return null
        }
        const next = (await response.json()) as Session
        saveSession(next)
        return next
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

interface RequestOptions {
  auth?: boolean
  retry?: boolean
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
  if (init.body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  const session = getSession()
  if (options.auth !== false && session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (response.status === 401 && options.auth !== false && options.retry !== false) {
    const next = await refreshSession()
    if (next) {
      return api<T>(path, init, { ...options, retry: false })
    }
  }

  if (!response.ok) {
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    const body = payload as { message?: string | string[]; code?: string } | null
    const message = Array.isArray(body?.message)
      ? body.message.join('. ')
      : (body?.message ?? `La solicitud falló (${response.status})`)
    throw new ApiError(message, response.status, body?.code, payload)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

type QueryValue = string | number | boolean | null | undefined

export function qs(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const result = search.toString()
  return result ? `?${result}` : ''
}
