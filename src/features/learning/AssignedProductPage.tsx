import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api-client'
import NewsDetailPage from './NewsDetailPage'
import FeedbackPage from './FeedbackPage'
import PredictionPage, { type EditorSession } from './PredictionPage'
import { Modal } from './components/Modal'
import { linkClass, Notice, PageTitle, Shell } from './components/PagePrimitives'
import { loadPage, formatTime, type PageData } from './api/page-data'
import { learningApi as api, mockLearningEnabled } from './api/service'
import { validateDraft, type Draft } from './model'

type Page = 'news' | 'prediction' | 'initial' | 'final'
export default function AssignedProductPage({ page }: { page: Page }) {
  const { newsId, sessionId } = useParams()
  const [params] = useSearchParams()
  const selected = params.get('targets') ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const queryKey = ['assigned-page', page, newsId ?? sessionId, selected]
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => loadPage(page, newsId, sessionId, selected.split(',').filter(Boolean), signal, page === 'initial' || page === 'final' ? queryClient.getQueryData<PageData>(queryKey) : undefined),
    retry: false,
    // Re-entering an editor must load the saved draft before initializing local inputs.
    gcTime: page === 'prediction' ? 0 : undefined,
    refetchInterval: query => !query.state.error && query.state.data?.poll ? 2000 : false,
    refetchIntervalInBackground: false,
  })
  const [handoff, setHandoff] = useState(false)
  if (query.isPending) return <Shell><Notice title="화면 정보를 불러오고 있어요">잠시만 기다려 주세요.</Notice></Shell>
  if (query.isError) return <Shell><Notice title="화면 정보를 표시하지 못했어요" error>{query.error instanceof ApiError ? query.error.message : '잠시 후 다시 시도해 주세요.'}</Notice>{query.error instanceof ApiError && query.error.status === 401 ? <Link to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} className={linkClass}>로그인하기</Link> : <Button onClick={() => void query.refetch()} loading={query.isFetching}>다시 불러오기</Button>}</Shell>
  const data = query.data
  if (page === 'prediction' && data.session && data.session.status !== 'drafting') return <Navigate to={`/learning/${data.session.id}/feedback`} replace />
  if ((page === 'initial' || page === 'final') && data.session?.status === 'drafting') return <Navigate to={`/learning/${data.session.id}/edit`} replace />
  const start = () => {
    if (data.session) navigate(data.session.status === 'drafting' ? `/learning/${data.session.id}/edit` : `/learning/${data.session.id}/feedback`)
    else if (mockLearningEnabled()) navigate(`/news/${data.news.id}/predict`)
    else setHandoff(true)
  }
  return <>
    {mockLearningEnabled() && <aside aria-label="개발용 API 연동 안내" className="bg-surface-subtle px-12 py-3 text-meta text-text-secondary">미완성 대상·세션·예측·회고 API는 개발용 목데이터입니다. 목 세션의 피드백·결과도 목데이터로 연결됩니다. 새로고침하면 목 저장이 초기화됩니다.</aside>}
    {page === 'news' && <NewsDetailPage data={data.news} state={data.session ? data.session.status === 'drafting' ? 'draft' : 'submitted' : 'new'} onRetry={() => void query.refetch()} onStartPrediction={start} />}
    {page === 'prediction' && (data.targets.length ? <ConnectedEditor key={newsId ?? sessionId} data={data} queryKey={queryKey} onTargetChange={() => setHandoff(true)} /> : <Shell><PageTitle label="WORKBOOK / PREDICTION" title="예측 대상을 먼저 선택해 주세요" description="관찰할 대상이 선택되면 예측을 작성할 수 있어요." /><Link to={`/news/${data.news.id}`} className={linkClass}>뉴스 상세로 돌아가기</Link></Shell>)}
    {(page === 'initial' || page === 'final') && (page === 'final' && data.session?.status !== 'completed' ? <Shell><Notice title="최종 회고를 먼저 남겨 주세요">회고를 저장한 뒤 최종 피드백을 확인할 수 있어요.</Notice><Link to={`/learning/${data.session?.id}/reflection`} className={linkClass}>회고 화면으로 이동</Link></Shell> : <FeedbackPage data={data.feedback} final={page === 'final'} state={data.feedbackState} onRetry={() => {}} canRetryGeneration={false} onRefresh={() => void query.refetch()} />)}
    {handoff && <Modal title="예측 대상 선택" onClose={() => setHandoff(false)}><p className="text-ui text-text-secondary">관찰할 대상을 선택한 뒤 예측을 작성할 수 있어요. 현재 선택과 작성 중인 내용은 유지됩니다.</p><Button onClick={() => setHandoff(false)}>돌아가기</Button></Modal>}
  </>
}
function ConnectedEditor({ data, queryKey, onTargetChange }: { data: PageData; queryKey: (string | undefined)[]; onTargetChange: () => void }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Draft>(() => structuredClone(data.draft))
  const [saved, setSaved] = useState<Draft>(() => structuredClone(data.draft))
  const [savedAt, setSavedAt] = useState(data.session?.savedAt ? formatTime(data.session.savedAt) : null)
  const sessionRef = useRef(data.session)
  const pending = useRef(false)
  const persist = async () => {
    const snapshot = structuredClone(draft)
    let session = sessionRef.current
    if (!session) { session = await api.create(data.news.id); sessionRef.current = session }
    if (session.status !== 'drafting') throw new ApiError(409)
    const selected = await api.select(session.id, data.targets)
    // Every target must save successfully before submitting. Preserve local inputs on partial failure.
    for (const target of data.targets) {
      const remote = selected.targets.find(t => t.isSelected && t.marketTargetId === (target.marketTargetId ?? target.id))
      if (!remote) throw new ApiError(502, 'contract')
      await api.save(session.id, remote.sessionTargetId, snapshot[target.id])
    }
    session = await api.session(session.id)
    sessionRef.current = session
    setSaved(snapshot); setSavedAt(session.savedAt ? formatTime(session.savedAt) : null)
    queryClient.setQueryData<PageData>(queryKey, { ...data, session, draft: structuredClone(snapshot) })
    void queryClient.invalidateQueries({ queryKey: ['assigned-page', 'news', data.news.id], refetchType: 'none' })
    return session.id
  }
  const perform = async (submit: boolean): Promise<string | void> => {
    if (pending.current) throw new ApiError(409)
    pending.current = true
    try {
      if (submit && sessionRef.current) {
        const current = await api.session(sessionRef.current.id)
        sessionRef.current = current
        if (current.status !== 'drafting') return `/learning/${current.id}/feedback`
      }
      if (submit && validateDraft(draft, data.targets)) throw new ApiError(400)
      const id = await persist()
      if (!submit) return
      try { await api.submit(id) } catch (error) {
        // A lost success response must not cause another save to a submitted session.
        const current = await api.session(id)
        if (current.status === 'drafting') throw error
        sessionRef.current = current
      }
      return `/learning/${id}/feedback`
    } finally { pending.current = false }
  }
  const session: EditorSession = { draft, setDraft, savedAt,
    dirty: JSON.stringify(draft) !== JSON.stringify(saved), discard: () => setDraft(structuredClone(saved)),
  }
  return <PredictionPage news={data.news} session={session} targets={data.targets} newsHref={`/news/${data.news.id}`} feedbackHref={`/news/${data.news.id}`} onSave={async () => { await perform(false) }} onSubmit={() => perform(true)} onRequestTargetChange={onTargetChange} />
}
