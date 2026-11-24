import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { request } from '@/lib/api-client'

const accessSchema = z.object({ allowed: z.literal(true) })

export const newsAdminAccessQuery = queryOptions({
  queryKey: ['news-admin', 'access'],
  queryFn: ({ signal }) => request('/admin/news/access', accessSchema, { signal }),
  retry: false,
  staleTime: 60_000,
})
