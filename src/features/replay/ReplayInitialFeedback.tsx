import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import FeedbackBody from '../learning/FeedbackBody'
import { Notice, PageTitle, Shell, TargetSwitcher, linkClass } from '../learning/components/PagePrimitives'
import { directionLabel, horizons } from '../learning/model'
import { replayTargets, type ReplayScenario } from './api'
import { previewResultHref, readReplaySession, saveReplaySession } from './preview-session'

function Source({ scenario }: { scenario: ReplayScenario }) {
  return <div className="space-y-2 rounded-control bg-surface-subtle p-4"><p className="text-control font-medium">{scenario.sourceNote}</p><p className="text-meta text-text-muted">가상 발표 당시 공개 자료 · 시안용 예시</p><blockquote className="text-meta text-text-secondary">{scenario.facts[0]}</blockquote><p className="text-meta text-text-muted">실제 뉴스 원문이나 AI 생성 응답이 아닌 디자인 검토용 자료예요.</p></div>
}
export default function ReplayInitialFeedback({ scenario }: { scenario: ReplayScenario }) {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [params, setParams] = useSearchParams()
  const [session] = useState(() => readReplaySession(scenario.id))
  const [active, setActive] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const failedOnce = useRef(false)
  if (!session?.submittedAt) return <Navigate to={`/replay/${scenario.id}/predict${search}`} replace />
  const targets = replayTargets.filter(target => session.targetIds.some(id => id === target.id))
  const target = targets.find(item => item.id === active) ?? targets[0]
  const waiting = params.get('state') === 'feedback-pending'
  const failed = params.get('state') === 'feedback-error'
  const reasonCount = horizons.filter(horizon => session.draft[target.id][horizon].reason.trim()).length
  const review = reasonCount ? `이 대상에는 ${reasonCount}개 기간의 판단 이유를 남겼어요. 기록한 이유를 당시 발표 사실과 연결해 읽고, 발표 전에 이미 예상한 내용과 추가로 확인할 가설을 구분해 보세요.` : '이 대상에는 판단 이유를 기록하지 않았어요. 선택한 방향과 그 이유를 함께 평가하기 어려워요. 다음에는 발표 사실과 내 가설을 연결해 한 문장 이상 남겨보세요.'
  const items = [
    { title: 'AI의 방향 판단', body: target.kind === 'rate' ? '정책금리와 장기금리를 같은 지표로 읽지 않도록 구분해 주세요. 장기금리의 방향을 판단하려면 당시 물가·성장 기대와 향후 정책 경로를 함께 살펴봐야 해요.' : '방향을 판단할 때는 발표 사실과 발표 전의 기대 차이를 함께 살펴봐야 해요. 같은 발표라도 시장이 미리 예상한 경로에 따라 해석이 달라질 수 있어요.' },
    { title: '내 예측 근거 평가', body: review },
    { title: '반대 시나리오', body: '시장이 예상한 정보가 이미 가격에 반영돼 있었다면 발표 후 반응이 다를 수 있어요. 같은 시점의 다른 발표와 위험 선호도 함께 확인할 조건으로 남겨보세요.' },
  ]
  const reveal = async () => {
    if (inFlight.current || waiting || failed) return
    inFlight.current = true; setBusy(true); setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 350))
      if (params.get('state') === 'reveal-error' && !failedOnce.current) { failedOnce.current = true; throw new Error('결과를 공개하지 못했어요. 예측은 유지했어요. 다시 시도해 주세요.') }
      const next = saveReplaySession({ ...session, feedbackReadAt: session.feedbackReadAt ?? new Date().toISOString(), resultsRevealedAt: session.resultsRevealedAt ?? new Date().toISOString() })
      navigate(previewResultHref(next))
    } catch (cause) { setError(cause instanceof Error ? cause.message : '결과를 공개하지 못했어요.') }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <Shell section="/explore"><PageTitle label="REPLAY / INITIAL FEEDBACK" title="당시 뉴스가 지표에 미치는 영향을 살펴보세요" description="예측 제출 완료 · 당시 자료 공개 기준 [가상 발표 공개 시각] · 시안용 예시" />
    <Notice title={session.resultsRevealedAt ? '예측 제출 완료 · 이미 공개한 결과를 다시 볼 수 있어요' : '예측 제출 완료 · 실제 결과는 아직 공개하지 않았어요'} className="bg-brand-subtle">당시 학습 기준 시점까지 공개된 자료로만 피드백을 읽어요. 아래의 실제 결과 보기를 선택하면 과거 관측값을 공개해요.</Notice>
    <section className="space-y-4"><h2 className="text-section">판단 흐름 요약</h2><p className="text-ui">{targets.map(item => item.name).join(' · ')}을 선택했고, 1·5·20거래일의 방향을 남겼어요. 선택한 대상의 판단 이유를 당시 공개된 사실과 연결해 살펴봐요.</p></section>
    <section className="space-y-4"><h2 className="text-section">뉴스 핵심 해설</h2><FeedbackBody content={scenario.facts.join('\n\n')} /></section>
    <TargetSwitcher targets={targets} active={target.id} onChange={setActive} />
    {waiting || failed ? <Notice title={waiting ? '최초 피드백을 준비하고 있어요' : '최초 피드백을 불러오지 못했어요'} error={failed}>예측은 저장되어 있어요. 결과는 피드백을 확인한 뒤 공개할 수 있어요.<Button variant="text" onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.delete('state'); return next })}>피드백 다시 확인</Button></Notice> : <section className="space-y-3 rounded-card border border-border-default p-5"><h2 className="text-control font-medium">핵심 평가</h2><FeedbackBody content={review} /><a href="#replay-prediction-review" className="inline-flex min-h-11 items-center text-meta text-brand-primary underline underline-offset-4">이유와 근거 자세히 읽기 ↓</a></section>}
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,5fr)] lg:gap-12">
      <aside className="min-w-0 space-y-6 rounded-card bg-surface-subtle p-6"><p className="font-mono text-label">MY PREDICTION</p><h2 className="text-section">내가 남긴 판단</h2>{horizons.map(horizon => <section key={horizon} className="space-y-2"><h3 className="text-control font-medium">{horizon}거래일 · {directionLabel(target, session.draft[target.id][horizon].direction)}</h3><p className="whitespace-pre-wrap break-words text-meta text-text-secondary">{session.draft[target.id][horizon].reason.trim() || '판단 이유를 기록하지 않았어요.'}</p></section>)}</aside>
      <div className="min-w-0 space-y-6">
        {!waiting && !failed && <>{items.map((item, index) => <section key={`${target.id}:${item.title}`} id={index === 1 ? 'replay-prediction-review' : undefined} tabIndex={index === 1 ? -1 : undefined} className="scroll-mt-6 space-y-5 rounded-card border border-border-default p-6"><div className="flex items-center gap-3"><span className="rounded-control bg-brand-subtle p-2 font-mono text-meta text-brand-primary">{String(index + 1).padStart(2, '0')}</span><h2 className="text-xl font-semibold">{item.title}</h2></div><FeedbackBody content={item.body} /><details><summary className="min-h-11 cursor-pointer py-2 text-meta text-text-muted focus-visible:outline-2 focus-visible:outline-brand-primary">근거 1개 보기</summary><Source scenario={scenario} /></details></section>)}<details><summary className="min-h-12 cursor-pointer py-3 text-center text-meta text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary">전체 근거 자료 · 1개 전체 보기</summary><Source scenario={scenario} /></details></>}
        {error && <Notice title="결과를 공개하지 못했어요" error>{error}</Notice>}
        <Button className="w-full" disabled={waiting || failed} loading={busy} onClick={() => void reveal()}>{error ? '실제 결과 다시 불러오기' : '실제 결과 보기'}</Button>
        <Link to="/replay" aria-disabled={busy} onClick={event => { if (inFlight.current) event.preventDefault() }} className={`${linkClass} w-full`}>나중에 결과 보기</Link>
      </div>
    </div>
  </Shell>
}
