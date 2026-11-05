import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, qs } from '../../shared/lib/api'
import type { Attachment, Paginated } from '../../shared/types'

export function useAttachments(resourceType: string, resourceId?: string) {
  return useQuery({
    queryKey: ['attachments', resourceType, resourceId],
    queryFn: () =>
      api<Paginated<Attachment>>(
        `/attachments${qs({
          resource_type: resourceType,
          resource_id: resourceId,
          limit: 100,
          sort: 'created_at',
        })}`,
      ),
    enabled: Boolean(resourceId),
  })
}

export function attachmentUrl(id: string): Promise<{ url: string; expires_in: number }> {
  return api<{ url: string; expires_in: number }>(`/attachments/${id}/url`)
}

export async function uploadAttachment(input: {
  organizationId: string
  resourceType: string
  resourceId: string
  file: File
}): Promise<Attachment> {
  const form = new FormData()
  form.append('organization_id', input.organizationId)
  form.append('resource_type', input.resourceType)
  form.append('resource_id', input.resourceId)
  form.append('file', input.file)
  return api<Attachment>('/attachments', { method: 'POST', body: form })
}

export function useUploadAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadAttachment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attachments'] })
    },
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/attachments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attachments'] })
    },
  })
}
