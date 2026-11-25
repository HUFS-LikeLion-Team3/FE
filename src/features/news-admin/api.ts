import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { ApiError, request } from '@/lib/api-client'

const accessSchema = z.object({ allowed: z.literal(true) })

export const newsAdminAccessQuery = queryOptions({
  queryKey: ['news-admin', 'access'],
  queryFn: ({ signal }) => request('/admin/news/access', accessSchema, { signal }),
  retry: false,
  staleTime: 60_000,
})

export const newsStatuses = ['draft', 'published', 'archived'] as const
const newsStatusSchema = z.enum(newsStatuses)
export type NewsStatus = z.infer<typeof newsStatusSchema>
const adminNewsSchema = z.object({
  id: z.uuid(), title: z.string(), category: z.string(), contentType: z.enum(['live', 'replay']),
  status: newsStatusSchema, publishedAt: z.iso.datetime({ offset: true }),
})
export type AdminNews = z.infer<typeof adminNewsSchema>
const adminNewsPageSchema = z.object({ content: z.array(adminNewsSchema), page: z.number().int().nonnegative(), hasNext: z.boolean() })
export const adminNewsKey = ['news-admin', 'articles'] as const

export async function getAdminNews(page: number, status: NewsStatus | '', signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page) })
  if (status) params.set('status', status)
  const result = await request(`/admin/news?${params}`, adminNewsPageSchema, { signal })
  if (result.page !== page || result.content.some(article => status && article.status !== status)) {
    throw new ApiError(502, 'contract')
  }
  return result
}

export async function updateAdminNewsStatus(id: string, expectedStatus: NewsStatus, status: NewsStatus) {
  const result = await request(`/admin/news/${id}/status`, adminNewsSchema, {
    method: 'PUT', body: { expectedStatus, status },
  })
  if (result.id !== id || result.status !== status) throw new ApiError(502, 'contract')
  return result
}
