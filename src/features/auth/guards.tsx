import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  return <Outlet />
}

export function GuestOnly() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/panel" replace />
  return <Outlet />
}
