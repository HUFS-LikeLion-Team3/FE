import { useQuery } from '@tanstack/react-query'
import { Link, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Notice, PageTitle, Shell, linkClass } from '../learning/components/PagePrimitives'
import { getReplayScenarios } from './api'
import ReplayLibrary from './ReplayLibrary'
import ReplayScenarioDetail from './ReplayScenarioDetail'
import ReplayPrediction from './ReplayPrediction'
import ReplayInitialFeedback from './ReplayInitialFeedback'

const replayScenarios = ['ready', 'loading', 'error', 'empty', 'save-error', 'submit-error', 'feedback-pending', 'feedback-error', 'reveal-error'] as const
function ReplayRoute({ step }: { step: 'detail' | 'targets' | 'predict' | 'feedback' }) {
  const { scenarioId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const query = useQuery({ queryKey: ['replay', 'scenarios'], queryFn: ({ signal }) => getReplayScenarios(signal), retry: false })
  const loading = params.get('state') === 'loading' || query.isPending
  const failed = params.get('state') === 'error' || query.isError
  const scenario = params.get('state') === 'empty' ? undefined : query.data?.find(item => item.id === scenarioId)
  if (!scenario || loading || failed) return <Shell section="/explore"><Notice title={loading ? '당시 뉴스를 불러오고 있어요' : '이 지난 뉴스를 확인할 수 없어요'} error={failed}>{loading ? '잠시 기다려 주세요.' : '지난 뉴스 목록에서 다른 자료를 선택해 주세요.'}</Notice>{failed && <Button onClick={() => { setParams(previous => { const next = new URLSearchParams(previous); next.delete('state'); return next }); void query.refetch() }}>다시 불러오기</Button>}<Link to="/replay" className={linkClass}>지난 뉴스 목록으로</Link></Shell>
  return step === 'predict' ? <ReplayPrediction key={scenario.id} scenario={scenario} />
    : step === 'feedback' ? <ReplayInitialFeedback key={scenario.id} scenario={scenario} />
    : <ReplayScenarioDetail key={`${scenario.id}:${step}`} scenario={scenario} selecting={step === 'targets'} />
}
function LibraryRoute() {
  const [params, setParams] = useSearchParams()
  const query = useQuery({ queryKey: ['replay', 'scenarios'], queryFn: ({ signal }) => getReplayScenarios(signal), retry: false })
  const state = params.get('state')
  if (state === 'loading' || query.isPending) return <Shell section="/explore"><Notice title="지난 뉴스를 불러오고 있어요">발표 당시의 학습 자료를 확인하고 있어요.</Notice><Button disabled loading>불러오는 중</Button></Shell>
  if (state === 'error' || query.isError) return <Shell section="/explore"><Notice title="지난 뉴스를 불러오지 못했어요" error>잠시 후 다시 시도해 주세요.</Notice><Button onClick={() => { setParams(previous => { const next = new URLSearchParams(previous); next.delete('state'); return next }); void query.refetch() }}>다시 불러오기</Button></Shell>
  return <ReplayLibrary scenarios={state === 'empty' ? [] : query.data ?? []} />
}
export default function ReplayWorkspace() {
  const [params, setParams] = useSearchParams()
  const state = replayScenarios.includes(params.get('state') as typeof replayScenarios[number]) ? params.get('state')! : 'ready'
  return <>
    <aside className="border-b border-border-default bg-surface-subtle px-12 py-3 text-meta"><div className="mx-auto flex max-w-[1200px] items-center gap-4"><strong>Replay 개발 미리보기</strong><span>가상 학습 자료 · 실제 뉴스·AI 응답 아님 · 저장은 이 탭에만 유지</span><label className="ml-auto">상태 <select aria-label="Replay 미리보기 상태" value={state} onChange={event => setParams(previous => { const next = new URLSearchParams(previous); next.set('state', event.target.value); return next })} className="min-h-11 rounded-control border border-border-default bg-surface-canvas px-3">{replayScenarios.map(item => <option key={item}>{item}</option>)}</select></label></div></aside>
    <Routes>
      <Route path="/" element={<LibraryRoute />} />
      <Route path=":scenarioId" element={<ReplayRoute step="detail" />} />
      <Route path=":scenarioId/targets" element={<ReplayRoute step="targets" />} />
      <Route path=":scenarioId/predict" element={<ReplayRoute step="predict" />} />
      <Route path=":scenarioId/feedback" element={<ReplayRoute step="feedback" />} />
      <Route path="*" element={<Shell section="/explore"><PageTitle label="REPLAY" title="지난 뉴스 경로를 확인해 주세요" description="목록에서 학습할 자료를 선택해 주세요." /><Link to="/replay" className={linkClass}>지난 뉴스 목록으로</Link></Shell>} />
    </Routes>
  </>
}
