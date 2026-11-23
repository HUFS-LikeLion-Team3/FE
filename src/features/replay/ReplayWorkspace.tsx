import { PageLoading } from '@/features/learning/components/PageLoading'
import { useQuery } from '@tanstack/react-query'
import { Link, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Notice, PageTitle, Shell, linkClass } from '../learning/components/PagePrimitives'
import { getReplayScenarios, replayUsesFixtures, type ReplayNews } from './api'
import { ReplayDetailRoute, ReplayLibraryRoute, type ReplayPreviewState } from './ReplayNewsRoutes'
import { ReplayStartUnavailable } from './ReplayNewsDetail'
import ReplayTargetSelection from './ReplayTargetSelection'
import ReplayPrediction from './ReplayPrediction'
import ReplayInitialFeedback from './ReplayInitialFeedback'
import { readReplaySession } from './preview-session'

const replayScenarios = ['ready', 'loading', 'error', 'empty', 'save-error', 'submit-error', 'feedback-pending', 'feedback-error', 'reveal-error'] as const
const previewStates: readonly string[] = ['loading', 'error', 'empty'] satisfies ReplayPreviewState[]

function useDemoScenarios() {
  return useQuery({ queryKey: ['replay', 'scenarios'], queryFn: ({ signal }) => getReplayScenarios(signal), retry: false })
}

// 대상 선택·예측·최초 피드백: 세션 생성 API 연결 전까지 시안용 시나리오로만 동작하는 개발 데모.
function ReplayRoute({ step }: { step: 'targets' | 'predict' | 'feedback' }) {
  const { newsId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const query = useDemoScenarios()
  const loading = params.get('state') === 'loading' || query.isPending
  const failed = params.get('state') === 'error' || query.isError
  const scenario = params.get('state') === 'empty' ? undefined : query.data?.find(item => item.id === newsId)
  if (loading) return <PageLoading />
  if (!scenario || failed) return <Shell section="/explore"><Notice title="이 지난 뉴스를 확인할 수 없어요" error={failed}>지난 뉴스 목록에서 다른 자료를 선택해 주세요.</Notice>{failed && <Button onClick={() => { setParams(previous => { const next = new URLSearchParams(previous); next.delete('state'); return next }); void query.refetch() }}>다시 불러오기</Button>}<Link to="/replay" className={linkClass}>지난 뉴스 목록으로</Link></Shell>
  return step === 'predict' ? <ReplayPrediction key={scenario.id} scenario={scenario} />
    : step === 'feedback' ? <ReplayInitialFeedback key={scenario.id} scenario={scenario} />
    : <ReplayTargetSelection key={scenario.id} scenario={scenario} />
}

// 상세의 시작 버튼: 같은 id의 시안용 시나리오가 있을 때만 데모로 이어간다. 실제 API 뉴스는 세션 생성이 연결되지 않아 비활성이다.
function DemoStart({ news }: { news: ReplayNews }) {
  const { search } = useLocation()
  const query = useDemoScenarios()
  const scenario = replayUsesFixtures ? query.data?.find(item => item.id === news.id) : undefined
  if (!scenario) return <ReplayStartUnavailable />
  const session = readReplaySession(scenario.id)
  const step = session?.submittedAt ? 'feedback' : session?.targetIds.length ? 'predict' : 'targets'
  const label = step === 'feedback' ? '최초 피드백 이어서 보기' : step === 'predict' ? '이어서 예측 작성하기' : '대상 선택하고 시작하기'
  return <>
    <Link to={`/replay/${scenario.id}/${step}${search}`} className={`${linkClass} w-full bg-brand-primary text-surface-canvas hover:bg-brand-hover`}>{label}</Link>
    <p className="text-meta text-text-muted">개발 미리보기 · 예측은 이 탭에만 저장돼요</p>
  </>
}

export default function ReplayWorkspace() {
  const [params, setParams] = useSearchParams()
  const state = replayScenarios.includes(params.get('state') as typeof replayScenarios[number]) ? params.get('state')! : 'ready'
  const preview = previewStates.includes(state) ? state as ReplayPreviewState : undefined
  return <>
    <aside className="border-b border-border-default bg-surface-subtle px-12 py-3 text-meta"><div className="mx-auto flex max-w-content items-center gap-4"><strong>Replay 개발 미리보기</strong><span>{replayUsesFixtures ? '가상 학습 자료 · 실제 뉴스·AI 응답 아님 · 저장은 이 탭에만 유지' : '목록·상세는 실제 API · 예측 단계는 연결 전'}</span><label className="ml-auto">상태 <select aria-label="Replay 미리보기 상태" value={state} onChange={event => setParams(previous => { const next = new URLSearchParams(previous); next.set('state', event.target.value); return next })} className="min-h-11 rounded-control border border-border-default bg-surface-canvas px-3">{replayScenarios.map(item => <option key={item}>{item}</option>)}</select></label></div></aside>
    <Routes>
      <Route path="/" element={<ReplayLibraryRoute preview={preview} />} />
      <Route path=":newsId" element={<ReplayDetailRoute preview={preview} renderStart={news => <DemoStart news={news} />} />} />
      <Route path=":newsId/targets" element={<ReplayRoute step="targets" />} />
      <Route path=":newsId/predict" element={<ReplayRoute step="predict" />} />
      <Route path=":newsId/feedback" element={<ReplayRoute step="feedback" />} />
      <Route path="*" element={<Shell section="/explore"><PageTitle label="REPLAY" title="지난 뉴스 경로를 확인해 주세요" description="목록에서 학습할 자료를 선택해 주세요." /><Link to="/replay" className={linkClass}>지난 뉴스 목록으로</Link></Shell>} />
    </Routes>
  </>
}
