import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { formatTime } from '@/features/learning/api/page-data'
import { Notice } from '@/features/learning/components/PagePrimitives'
import { categoryLabel } from '@/features/news/category'
import { ApiError } from '@/lib/api-client'
import { adminNewsKey, getAdminNews, newsStatuses, updateAdminNewsStatus, type AdminNews, type NewsStatus } from './api'

const statusLabel: Record<NewsStatus, string> = { draft: '초안', published: '공개', archived: '보관' }
const selectClass = 'min-h-12 rounded-control border border-border-control bg-surface-canvas px-3 text-control focus-visible:outline-2 focus-visible:outline-brand-primary'

export default function NewsAdminList() {
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<NewsStatus | ''>('')
  const query = useQuery({
    queryKey: [...adminNewsKey, filter, page],
    queryFn: ({ signal }) => getAdminNews(page, filter, signal),
    retry: false,
  })

  return <section aria-label="등록된 기사" className="space-y-4">
    <label className="flex items-center gap-3 text-control">발행 상태
      <select className={selectClass} value={filter} onChange={event => {
        setFilter(event.target.value as NewsStatus | '')
        setPage(0)
      }}>
        <option value="">전체</option>
        {newsStatuses.map(status => <option key={status} value={status}>{statusLabel[status]}</option>)}
      </select>
    </label>
    {query.isPending ? <p role="status">기사 목록을 불러오고 있어요.</p> : query.isError ? (
      <Notice title="기사 목록을 불러오지 못했어요" error>
        <p>{query.error.message}</p>
        <Button variant="secondary" className="mt-3" onClick={() => void query.refetch()}>다시 불러오기</Button>
      </Notice>
    ) : <>
      {query.data.content.length ? <ul className="divide-y divide-border-default rounded-card border border-border-default">
        {query.data.content.map(article => <NewsStatusRow key={article.id} article={article} />)}
      </ul> : <Notice title="이 페이지에 표시할 기사가 없어요">발행 상태를 바꾸거나 다른 페이지를 확인해 주세요.</Notice>}
      <div className="flex items-center gap-4" aria-label="기사 목록 페이지">
        <Button variant="secondary" disabled={page === 0} onClick={() => setPage(current => current - 1)}>이전</Button>
        <span className="text-control">{page + 1} 페이지</span>
        <Button variant="secondary" disabled={!query.data.hasNext} onClick={() => setPage(current => current + 1)}>다음</Button>
      </div>
    </>}
  </section>
}

function NewsStatusRow({ article }: { article: AdminNews }) {
  const client = useQueryClient()
  const [selection, setSelection] = useState<{ baseline: NewsStatus; status: NewsStatus } | null>(null)
  const selected = selection?.baseline === article.status ? selection.status : article.status
  const mutation = useMutation({
    mutationFn: () => updateAdminNewsStatus(article.id, article.status, selected),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: adminNewsKey }),
        client.invalidateQueries({ queryKey: ['news'] }),
        client.invalidateQueries({ queryKey: ['replay'] }),
        client.invalidateQueries({ queryKey: ['assigned-page', 'news', article.id] }),
      ])
      setSelection(null)
    },
    onError: error => {
      if (error instanceof ApiError && error.status === 409) void client.invalidateQueries({ queryKey: adminNewsKey })
    },
  })

  return <li className="space-y-3 p-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h2 className="break-words text-control font-medium">{article.title}</h2>
        <p className="text-meta text-text-secondary">
          {categoryLabel(article.category)} · {article.contentType === 'live' ? 'Live' : 'Replay'} · {formatTime(article.publishedAt)}
        </p>
        <p className="text-meta">현재 상태 · {statusLabel[article.status]}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label={`${article.title} 상태 변경`} className={selectClass} value={selected} disabled={mutation.isPending}
          onChange={event => {
            mutation.reset()
            setSelection({ baseline: article.status, status: event.target.value as NewsStatus })
          }}>
          {newsStatuses.map(status => <option key={status} value={status}>{statusLabel[status]}</option>)}
        </select>
        <Button variant="secondary" loading={mutation.isPending} disabled={selected === article.status}
          onClick={() => mutation.mutate()}>상태 저장</Button>
      </div>
    </div>
    {mutation.isError && <p role="alert" className="text-meta text-text-secondary">
      {mutation.error instanceof ApiError && mutation.error.status === 409
        ? '다른 관리자가 상태를 바꿨거나 학습 기록이 있는 기사예요. 현재 상태를 확인해 주세요.'
        : mutation.error.message}
    </p>}
    {mutation.isSuccess && <p role="status" className="text-meta text-text-secondary">상태를 저장했어요.</p>}
  </li>
}
