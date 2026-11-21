import { useQuery } from '@tanstack/react-query'
import { learningApi } from '@/features/learning/api/service'

export function NewsPublisher({ newsId }: { newsId: string }) {
  const sources = useQuery({
    queryKey: ['news', 'sources', newsId],
    queryFn: ({ signal }) => learningApi.sources(newsId, signal),
    retry: 1,
    staleTime: 300_000,
  })
  const publisher = sources.data?.sources.find(source => source.isPrimary)?.publisher
  return <span>{publisher ?? (sources.isPending ? '출처 확인 중' : sources.isError ? '발행처 조회 실패' : '발행처 정보 없음')}</span>
}
