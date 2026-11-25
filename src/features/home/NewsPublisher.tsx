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
  if (!publisher && sources.isPending) return <PublisherSkeleton />
  return <span>{publisher ?? (sources.isError ? '발행처 조회 실패' : '발행처 정보 없음')}</span>
}

/** 발행처 확인 중 글자가 먼저 보였다가 바뀌는 깜빡임 대신, 글자 높이의 짧은 자리 표시를 둔다. */
export function PublisherSkeleton() {
  return <span role="status" aria-label="발행처 확인 중" className="inline-block h-[0.9em] w-16 rounded-control bg-surface-subtle align-middle motion-safe:animate-pulse" />
}
