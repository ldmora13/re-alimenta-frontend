import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, qs } from '../../shared/lib/api'
import type {
  Donation,
  DonationItem,
  Paginated,
} from '../../shared/types'

export interface DonationFilters {
  status?: string
  donor?: string
  recipient?: string
  search?: string
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export function donationsQueryString(filters: DonationFilters = {}): string {
  return qs({
    status: filters.status,
    donor_organization_id: filters.donor,
    recipient_organization_id: filters.recipient,
    search: filters.search,
    page: filters.page,
    limit: filters.limit ?? 20,
    sort: filters.sort,
    order: filters.order,
  })
}

export function fetchDonations(filters: DonationFilters = {}): Promise<Paginated<Donation>> {
  return api<Paginated<Donation>>(`/donations${donationsQueryString(filters)}`)
}

export function useDonations(filters: DonationFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['donations', filters],
    queryFn: () => fetchDonations(filters),
    enabled,
  })
}

export function useDonation(id?: string) {
  return useQuery({
    queryKey: ['donation', id],
    queryFn: () => api<Donation>(`/donations/${id}`),
    enabled: Boolean(id),
  })
}

export function useDonationItems(donationId?: string) {
  return useQuery({
    queryKey: ['donation-items', donationId ?? 'all'],
    queryFn: () =>
      api<Paginated<DonationItem>>(
        `/donation-items${qs({ donation_id: donationId, limit: 100, sort: 'name', order: 'asc' })}`,
      ),
  })
}

export interface NewDonationItem {
  name: string
  quantity: number
  category: string
  condition: string
}

export interface NewDonationInput {
  donor_organization_id: string
  pickup_address_id: string
  description: string
  available_from: string
  available_until: string
  items: NewDonationItem[]
}

export async function createDonation(input: NewDonationInput): Promise<Donation> {
  const { items, ...donation } = input
  const created = await api<Donation>('/donations', {
    method: 'POST',
    body: JSON.stringify({ ...donation, status: 'draft' }),
  })

  for (const item of items) {
    await api<DonationItem>('/donation-items', {
      method: 'POST',
      body: JSON.stringify({ ...item, donation_id: created.id }),
    })
  }

  return api<Donation>(`/donations/${created.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'published' }),
  })
}

export function useCreateDonation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDonation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['donations'] })
      void queryClient.invalidateQueries({ queryKey: ['donation-items'] })
    },
  })
}

export function reserveDonation(
  id: string,
  organizationId: string,
  deliveryAddressId?: string,
): Promise<Donation> {
  return api<Donation>(`/donations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'reserved',
      recipient_organization_id: organizationId,
      ...(deliveryAddressId ? { delivery_address_id: deliveryAddressId } : {}),
    }),
  })
}

export function updateDonationStatus(id: string, status: string): Promise<Donation> {
  return api<Donation>(`/donations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function useReserveDonation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      organizationId,
      deliveryAddressId,
    }: {
      id: string
      organizationId: string
      deliveryAddressId?: string
    }) => reserveDonation(id, organizationId, deliveryAddressId),
    onSuccess: (donation) => {
      void queryClient.invalidateQueries({ queryKey: ['donation', donation.id] })
      void queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}

export function useUpdateDonationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateDonationStatus(id, status),
    onSuccess: (donation) => {
      void queryClient.invalidateQueries({ queryKey: ['donation', donation.id] })
      void queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}
