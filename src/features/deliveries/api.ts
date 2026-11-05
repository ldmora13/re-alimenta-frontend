import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, qs } from '../../shared/lib/api'
import type {
  Delivery,
  DeliveryEvent,
  Paginated,
} from '../../shared/types'

export interface DeliveryFilters {
  status?: string
  courierId?: string
  donationId?: string
  page?: number
  limit?: number
}

export function useDeliveries(filters: DeliveryFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['deliveries', filters],
    queryFn: () =>
      api<Paginated<Delivery>>(
        `/deliveries${qs({
          status: filters.status,
          courier_id: filters.courierId,
          donation_id: filters.donationId,
          page: filters.page,
          limit: filters.limit ?? 100,
          sort: 'scheduled_at',
          order: 'asc',
        })}`,
      ),
    enabled,
  })
}

export function useDelivery(id?: string) {
  return useQuery({
    queryKey: ['delivery', id],
    queryFn: () => api<Delivery>(`/deliveries/${id}`),
    enabled: Boolean(id),
  })
}

export function useDeliveryEvents(deliveryId?: string) {
  return useQuery({
    queryKey: ['delivery-events', deliveryId],
    queryFn: () =>
      api<Paginated<DeliveryEvent>>(
        `/delivery-events${qs({ delivery_id: deliveryId, limit: 100, sort: 'occurred_at', order: 'asc' })}`,
      ),
    enabled: Boolean(deliveryId),
  })
}

export function updateDelivery(
  id: string,
  input: Partial<{ status: string; courier_id: string; scheduled_at: string }>,
): Promise<Delivery> {
  return api<Delivery>(`/deliveries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function createDeliveryEvent(input: {
  delivery_id: string
  event_type: string
  status?: string
}): Promise<DeliveryEvent> {
  return api<DeliveryEvent>('/delivery-events', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function useAdvanceDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      deliveryId,
      status,
      eventType,
    }: {
      deliveryId: string
      status: string
      eventType: string
    }) => {
      await updateDelivery(deliveryId, { status })
      return createDeliveryEvent({
        delivery_id: deliveryId,
        event_type: eventType,
        status,
      })
    },
    onSuccess: (_event, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['delivery', variables.deliveryId] })
      void queryClient.invalidateQueries({ queryKey: ['delivery-events', variables.deliveryId] })
      void queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      void queryClient.invalidateQueries({ queryKey: ['donation'] })
      void queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}
