import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import FeedbackPage from './FeedbackPage'
import NewsDetailPage from './NewsDetailPage'
import PredictionPage from './PredictionPage'
import { Modal } from './components/Modal'
import { linkClass, Notice, Shell } from './components/PagePrimitives'
import { news, newsView, feedbackItems, recordedDraft, reflection } from './fixtures'
import { type FeedbackState, type ObservationState } from './model'
import { SessionProvider } from './SessionProvider'
import { useSession } from './session-context'

const base = '/dev/pages'
const scenarios = ['ready', 'loading', 'transient-error', 'validation-error', 'limited', 'unavailable', 'save-error', 'submit-error'] as const
function PreviewNavigation() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  return <aside aria-label="개발용 UI 미리보기" className="border-b border-border-default bg-surface-subtle px-12 py-3 text-meta text-text-secondary"><div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4"><Link to="/dev/pages" className="underline">담당 화면 목록</Link><span>목업 데이터 · 새로고침 시 초기화 · 대상 선택 단계 제외</span>{location.pathname !== '/dev/pages' && <label className="ml-auto flex items-center gap-2">미리보기 상태<select aria-label="미리보기 상태" className="min-h-11 rounded-control border border-border-control bg-surface-canvas px-3" value={params.get('scenario') ?? 'ready'} onChange={event => setParams(previous => { const next = new URLSearchParams(previous); next.set('scenario', event.target.value); return next }, { replace: true })}>{scenarios.map(s => <option key={s}>{s}</option>)}</select></label>}{location.pathname.includes('/feedback') && <label>관찰 상태<select aria-label="관찰 상태" value={params.get('observation') ?? 'baseline_pending'} onChange={event => setParams(previous => { const next = new URLSearchParams(previous); next.set('observation', event.target.value); return next }, { replace: true })}>{['baseline_pending', 'scheduled', 'observing'].map(value => <option key={value}>{value}</option>)}</select></label>}</div></aside>
}
function PreviewIndex() {
  return <Shell><h1 className="text-page">담당 화면 UI 미리보기</h1><p className="text-ui text-text-secondary">서버 연결 없이 화면과 입력 흐름을 확인합니다. 저장·제출은 현재 탭의 메모리에만 반영됩니다.</p><nav aria-label="담당 화면" className="grid grid-cols-2 gap-4">{[[`/dev/pages/news/${news.id}`, 'P0-03 · 뉴스 상세'], [`/dev/pages/news/${news.id}/predict`, 'P0-04 · 예측 입력·모달'], ['/dev/pages/learning/preview-session/feedback', 'P0-05 · 최초 AI 피드백'], ['/dev/pages/learning/preview-session/final-feedback', 'P0-08-2 · 최종 AI 피드백'], ['/dev/ui', '공용 컴포넌트']].map(([to, title]) => <Link key={to} to={to} className={`${linkClass} border border-border-default`}>{title}</Link>)}</nav><section className="space-y-4"><h2 className="text-section">대상 데이터별 검토</h2><p className="text-meta text-text-secondary">각 링크는 새 목업 세션으로 열립니다. 대상 선택 UI를 대신하는 개발 데이터입니다.</p><div className="flex gap-3">{[['one', '대상 1개'], ['three', '대상 3개 · 금리'], ['fx', '원/달러 환율']].map(([fixture, title]) => <a key={fixture} href={`/dev/pages/news/${news.id}/predict?fixture=${fixture}`} className={`${linkClass} border border-border-default`}>{title}</a>)}</div></section></Shell>
}
function AssignedRoute({ page }: { page: 'news' | 'prediction' | 'initial' | 'final' }) {
  const { newsId, sessionId } = useParams()
  const session = useSession()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [selectionNotice, setSelectionNotice] = useState(false)
  const scenario = params.get('scenario') ?? 'ready'
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (retryTimer.current) clearTimeout(retryTimer.current) }, [])
  const retry = () => {
    setParams(previous => { const next = new URLSearchParams(previous); next.set('scenario', 'loading'); return next }, { replace: true })
    retryTimer.current = setTimeout(() => setParams(previous => { const next = new URLSearchParams(previous); next.set('scenario', 'ready'); return next }, { replace: true }), 500)
  }
  const simulate = async (action: 'save' | 'submit') => {
    await new Promise(resolve => setTimeout(resolve, 350))
    if (scenario === `${action}-error`) throw new Error('Preview failure')
    session[action]()
  }
  const observation = ['scheduled', 'observing'].includes(params.get('observation') ?? '') ? params.get('observation') as ObservationState : 'baseline_pending'
  const closeNotice = () => setSelectionNotice(false)
  if ((newsId && newsId !== news.id) || (sessionId && sessionId !== 'preview-session')) return <Shell><Notice title="미리보기 데이터가 없는 화면이에요">화면 목록에서 예제 데이터를 선택해 주세요.</Notice><Link to="/dev/pages" className={linkClass}>담당 화면 목록</Link></Shell>
  const state = (['loading', 'transient-error', 'validation-error', 'limited', 'unavailable'].includes(scenario) ? scenario : 'ready') as FeedbackState
  return <>
    {page === 'news' && <NewsDetailPage data={newsView} onRetry={retry} state={scenario === 'loading' ? 'loading' : scenario === 'unavailable' ? 'unavailable' : session.submitted ? 'submitted' : session.savedAt ? 'draft' : 'new'} onStartPrediction={() => navigate(session.submitted ? '/dev/pages/learning/preview-session/feedback' : `/dev/pages/news/${news.id}/predict`)} />}
    {page === 'prediction' && (session.submitted ? <Navigate to="/dev/pages/learning/preview-session/feedback" replace /> : <PredictionPage news={newsView} newsHref={`${base}/news/${news.id}`} feedbackHref={`${base}/learning/preview-session/feedback`} session={session} targets={session.targets} onSave={() => simulate('save')} onSubmit={() => simulate('submit')} onRequestTargetChange={() => setSelectionNotice(true)} />)}
    {(page === 'initial' || page === 'final') && <FeedbackPage data={{ targets: session.targets, draft: session.submitted ?? recordedDraft, items: Object.fromEntries(session.targets.map(target => [target.id, feedbackItems(target, page === 'final')])), reflection, observation, sessionId: 'preview-session' }} routeBase={base} final={page === 'final'} state={state} onRetry={retry} />}
    {selectionNotice && <Modal title="대상 선택 연결점" onClose={closeNotice}><p className="text-ui text-text-secondary">대상 선택은 이번 담당 범위에서 제외했습니다. 현재 선택과 작성 내용을 유지한 상태로 선택 화면에 연결할 예정입니다.</p><Button className="w-full" onClick={closeNotice}>작성 계속하기</Button></Modal>}
  </>
}
function HandoffBoundary({ title }: { title: string }) {
  return <Shell><h1 className="text-page">{title}</h1><Notice title="다른 담당 화면의 연결 경로입니다">이번 작업에서는 이 화면을 구현하지 않습니다.</Notice><Link to="/dev/pages" className={linkClass}>담당 화면 목록으로 돌아가기</Link></Shell>
}
export default function AssignedPreviewApp() {
  return <SessionProvider><PreviewNavigation /><Routes>
    <Route path="/" element={<PreviewIndex />} />
    <Route path="news/:newsId" element={<AssignedRoute page="news" />} />
    <Route path="news/:newsId/predict" element={<AssignedRoute page="prediction" />} />
    <Route path="learning/:sessionId/edit" element={<AssignedRoute page="prediction" />} />
    <Route path="learning/:sessionId/feedback" element={<AssignedRoute page="initial" />} />
    <Route path="learning/:sessionId/final-feedback" element={<AssignedRoute page="final" />} />
    <Route path="learning/:sessionId/results" element={<HandoffBoundary title="결과·회고" />} />
    <Route path="learning/:sessionId/reflection" element={<HandoffBoundary title="최종 회고" />} />
    <Route path="*" element={<Navigate to="/dev/pages" replace />} />
  </Routes></SessionProvider>
}
