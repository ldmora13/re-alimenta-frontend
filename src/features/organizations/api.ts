import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, qs } from '../../shared/lib/api'
import type {
  Address,
  Organization,
  OrganizationMember,
  Paginated,
} from '../../shared/types'

export interface CreateOrganizationInput {
  legal_name: string
  type: string
  tax_id: string
}

export function useOrganizations(enabled = true) {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => api<Paginated<Organization>>(`/organizations${qs({ limit: 100 })}`),
    enabled,
  })
}

export function useAddresses(organizationId?: string | null) {
  return useQuery({
    queryKey: ['addresses', organizationId],
    queryFn: () =>
      api<Paginated<Address>>(
        `/addresses${qs({ organization_id: organizationId, limit: 100, sort: 'created_at', order: 'asc' })}`,
      ),
    enabled: Boolean(organizationId),
  })
}

export function useMembers(organizationId?: string | null) {
  return useQuery({
    queryKey: ['members', organizationId],
    queryFn: () =>
      api<Paginated<OrganizationMember>>(
        `/organization-members${qs({ organization_id: organizationId, limit: 100 })}`,
      ),
    enabled: Boolean(organizationId),
  })
}

export function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  return api<Organization>('/organizations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function addOrganizationMember(input: {
  organization_id: string
  user_id: string
  role: string
}): Promise<OrganizationMember> {
  return api<OrganizationMember>('/organization-members', {
    method: 'POST',
    body: JSON.stringify({ ...input, status: 'active' }),
  })
}

export function deleteOrganizationMember(id: string): Promise<void> {
  return api<void>(`/organization-members/${id}`, { method: 'DELETE' })
}

export function updateOrganization(
  id: string,
  input: Partial<CreateOrganizationInput>,
): Promise<Organization> {
  return api<Organization>(`/organizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function createAddress(input: {
  organization_id: string
  label: string
  address_line: string
  latitude?: number
  longitude?: number
}): Promise<Address> {
  return api<Address>('/addresses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAddress(
  id: string,
  input: Partial<{
    label: string
    address_line: string
    latitude: number
    longitude: number
  }>,
): Promise<Address> {
  return api<Address>(`/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteAddress(id: string): Promise<void> {
  return api<void>(`/addresses/${id}`, { method: 'DELETE' })
}

export function useOrganizationMutations() {
  const queryClient = useQueryClient()

  const refreshWorkspace = () => {
    void queryClient.invalidateQueries({ queryKey: ['workspace'] })
  }

  const updateOrg = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateOrganizationInput> }) =>
      updateOrganization(id, input),
    onSuccess: refreshWorkspace,
  })

  const addAddress = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  const editAddress = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<{
        label: string
        address_line: string
        latitude: number
        longitude: number
      }>
    }) => updateAddress(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  const removeAddress = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  const addMember = useMutation({
    mutationFn: addOrganizationMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  const removeMember = useMutation({
    mutationFn: deleteOrganizationMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  return { updateOrg, addAddress, editAddress, removeAddress, addMember, removeMember }
}
