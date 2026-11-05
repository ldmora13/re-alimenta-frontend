/* eslint-disable react-refresh/only-export-components */
import { useQuery } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { api, qs } from '../../shared/lib/api'
import { isAdminRole, isCourierRole } from '../../shared/lib/format'
import type {
  Organization,
  OrganizationMember,
  Paginated,
  Profile,
} from '../../shared/types'
import { useAuth } from '../auth/AuthProvider'

export interface WorkspaceData {
  profile: Profile | null
  membership: OrganizationMember | null
  organization: Organization | null
}

export async function fetchWorkspace(userId: string): Promise<WorkspaceData> {
  const [profiles, memberships] = await Promise.all([
    api<Paginated<Profile>>(`/profiles${qs({ limit: 5 })}`),
    api<Paginated<OrganizationMember>>(
      `/organization-members${qs({ user_id: userId, status: 'active', limit: 20 })}`,
    ),
  ])

  const membership = memberships.data[0] ?? null
  const organization = membership
    ? await api<Organization>(`/organizations/${membership.organization_id}`)
    : null

  return {
    profile: profiles.data[0] ?? null,
    membership,
    organization,
  }
}

interface WorkspaceContextValue {
  data: WorkspaceData | undefined
  isLoading: boolean
  isError: boolean
  reload: () => Promise<void>
  organization: Organization | null
  membership: OrganizationMember | null
  organizationId: string | null
  displayName: string
  isAdmin: boolean
  isCourier: boolean
  isDonor: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['workspace', userId],
    queryFn: () => fetchWorkspace(userId),
    enabled: Boolean(userId),
  })

  const { data, isLoading, isError, refetch } = query

  const value = useMemo<WorkspaceContextValue>(() => {
    const organization = data?.organization ?? null
    const membership = data?.membership ?? null
    const displayName =
      data?.profile?.full_name ??
      user?.user_metadata?.full_name ??
      user?.email ??
      'Usuario'

    return {
      data,
      isLoading,
      isError,
      reload: async () => {
        await refetch()
      },
      organization,
      membership,
      organizationId: organization?.id ?? null,
      displayName,
      isAdmin: isAdminRole(membership?.role),
      isCourier: isCourierRole(membership?.role),
      isDonor: (organization?.type ?? '').toLowerCase() === 'donor',
    }
  }, [data, isLoading, isError, refetch, user])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return context
}
