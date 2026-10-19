import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import NewsDetailPage from './NewsDetailPage'
import FeedbackPage from './FeedbackPage'
import LearningFlowEditor from './LearningFlowEditor'
import { linkClass, Notice, Shell } from './components/PagePrimitives'
import { loadPage, type PageData } from './api/page-data'
import { mockLearningEnabled } from './api/service'
import { QueryState } from './components/QueryState'
import { sessionDestination } from './session-routes'

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
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Re-entering an editor must load the saved draft before initializing local inputs.
    gcTime: page === 'prediction' ? 0 : undefined,
    refetchInterval: query => !query.state.error && query.state.data?.poll ? 2000 : false,
    refetchIntervalInBackground: false,
  })
  if (!query.data) return <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
  const data = query.data
  if (page === 'prediction' && data.session && data.session.status !== 'drafting') return <Navigate to={sessionDestination(data.session)} replace />
  if ((page === 'initial' || page === 'final') && data.session?.status === 'drafting') return <Navigate to={`/learning/${data.session.id}/edit`} replace />
  const start = () => {
    if (data.session) navigate(sessionDestination(data.session))
    else navigate(`/news/${data.news.id}/predict`)
  }
  return <>
    {query.isError && <Notice title="최신 상태를 불러오지 못했어요" error>{query.error.message} 작성 중인 내용은 유지했어요.</Notice>}
    {import.meta.env.DEV && mockLearningEnabled() && <aside aria-label="개발용 API 연동 안내" className="bg-surface-subtle px-12 py-3 text-meta text-text-secondary">개발용 목 모드입니다. 예측·관측·회고·피드백은 모의 데이터이며 실제 서버에 저장되지 않습니다. 새로고침하면 초기화됩니다.</aside>}
    {page === 'news' && <NewsDetailPage data={data.news} state={data.session ? data.session.status === 'drafting' ? 'draft' : data.session.status : 'new'} onRetry={() => void query.refetch()} onStartPrediction={start} />}
    {page === 'prediction' && <LearningFlowEditor key={`${newsId ?? sessionId}:${selected}`} data={data} queryKey={queryKey} />}
    {(page === 'initial' || page === 'final') && (page === 'final' && data.session?.status !== 'completed' ? <Shell><Notice title="최종 회고를 먼저 남겨 주세요">회고를 저장한 뒤 최종 피드백을 확인할 수 있어요.</Notice><Link to={`/learning/${data.session?.id}/results`} className={linkClass}>회고 화면으로 이동</Link></Shell> : <FeedbackPage data={data.feedback} final={page === 'final'} state={data.feedbackState} onRetry={() => {}} canRetryGeneration={false} onRefresh={() => void query.refetch()} />)}

  </>
}