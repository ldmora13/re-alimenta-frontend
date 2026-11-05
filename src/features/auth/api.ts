import { api } from '../../shared/lib/api'
import type { Session } from '../../shared/types'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  full_name: string
  phone?: string
}

export function loginRequest(input: LoginInput): Promise<Session> {
  return api<Session>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: false },
  )
}

export function registerRequest(input: RegisterInput): Promise<Session> {
  return api<Session>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: false },
  )
}

export function logoutRequest(): Promise<void> {
  return api<void>('/auth/logout', { method: 'POST' })
}
