import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api-client'
import FeedbackPage from '../learning/FeedbackPage'
import LearningFlowEditor from '../learning/LearningFlowEditor'
import { loadFeedbackNotes } from '../learning/api/page-data'
import { replayLearningApi as api } from '../learning/api/service'
import { linkClass, Notice, Shell } from '../learning/components/PagePrimitives'
import { QueryState } from '../learning/components/QueryState'
import { replayResultsHref, sessionDestination } from '../learning/session-routes'
import { hasRevealedResults, loadReplayEditor, loadReplayFeedback } from './session-api'

export function ReplayEditorRoute() {
  const { newsId = '' } = useParams()
  const queryKey = ['replay-editor', newsId]
  const query = useQuery({ queryKey, queryFn: ({ signal }) => loadReplayEditor(newsId, signal), retry: false, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false })
  if (!query.data) return <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
  const { session, news, targets } = query.data
  if (session && session.status !== 'drafting') return <Navigate to={sessionDestination(session)} replace />
  if (!news.targets.length && !targets.length) return <Shell section="/explore"><Notice title="관찰 대상을 확인할 수 없어요">이 뉴스에는 아직 선택할 수 있는 관찰 대상이 없어요.</Notice><Link to={`/replay/${newsId}`} className={linkClass}>당시 뉴스로 돌아가기</Link></Shell>
  return <LearningFlowEditor key={newsId} data={query.data} queryKey={queryKey} replay />
}

export function ReplayFeedbackRoute({ final = false }: { final?: boolean }) {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const client = useQueryClient()
  const stage = final ? 'final' : 'initial'
  const queryKey = ['replay-feedback', sessionId, stage]
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => loadReplayFeedback(sessionId, stage, signal, client.getQueryData<Awaited<ReturnType<typeof loadReplayFeedback>>>(queryKey)?.saved),
    retry: false,
    refetchInterval: current => !current.state.error && current.state.data?.poll ? 2500 : false,
  })
  const context = query.data?.feedback
  const notes = useQuery({
    queryKey: ['replay-final-notes', sessionId],
    enabled: final && !!context,
    retry: false,
    queryFn: ({ signal }) => loadFeedbackNotes(sessionId, context!.targets, signal, true),
  })
  const reveal = useMutation({
    mutationFn: async () => {
      const result = await api.reveal(sessionId)
      if (result.sessionId !== sessionId) throw new ApiError(502, 'contract')
      return result
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['replay-feedback', sessionId] })
      void client.invalidateQueries({ queryKey: ['replay-results', sessionId] })
      navigate(replayResultsHref(sessionId))
    },
    onError: () => { void query.refetch() },
  })
  if (!query.data || query.isError) return <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
  const { session, feedback, feedbackState } = query.data
  const revealed = hasRevealedResults(session.resultsRevealedAt)
  if (session.status === 'drafting' || (final && (session.status !== 'completed' || !revealed))) return <Navigate to={sessionDestination(session)} replace />
  const action = final || revealed
    ? <Link to={replayResultsHref(sessionId)} className={`${linkClass} w-full`}>과거 결과와 통합 회고 보기</Link>
    : <div className="space-y-3">
      {reveal.isError && <Notice title="결과를 공개하지 못했어요" error>{reveal.error instanceof ApiError && reveal.error.status === 409 ? '최초 피드백 상태를 다시 확인해 주세요.' : '잠시 후 다시 시도해 주세요.'}</Notice>}
      <Button className="w-full" loading={reveal.isPending} disabled={feedbackState !== 'ready' && feedbackState !== 'limited'} onClick={() => reveal.mutate()}>실제 결과 보기</Button>
    </div>
  const finalFeedback = final && feedback ? {
    ...feedback, ...notes.data, notesState: notes.isError ? 'error' as const : notes.isPending ? 'loading' as const : undefined,
  } : feedback
  const refresh = () => { void query.refetch(); if (final && context) void notes.refetch() }
  return <FeedbackPage key={`${sessionId}:${stage}`} data={finalFeedback} final={final} state={feedbackState} replayAction={action} onRetry={refresh} onRefresh={refresh} canRetryGeneration={false} />
}
