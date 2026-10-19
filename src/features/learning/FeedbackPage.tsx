import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from './components/Modal'
import { linkClass, Notice, PageTitle, Shell, SourceCard, SourcesOverview, TargetSwitcher } from './components/PagePrimitives'
import { directionLabel, horizons, type FeedbackState, type FeedbackView } from './model'

export default function FeedbackPage({ data, final = false, state = 'ready', onRetry, routeBase = '', onRefresh, canRetryGeneration = true }: { data: FeedbackView | null; final?: boolean; state?: FeedbackState; onRetry: () => void; routeBase?: string; onRefresh?: () => void; canRetryGeneration?: boolean }) {
  const [reflectionOpen, setReflectionOpen] = useState(false)
  const [active, setActive] = useState(data?.targets[0]?.id ?? '')
  if (!data || !data.targets.length) return <Shell><PageTitle label="AI REVIEW" description="저장한 학습 기록을 확인해 주세요." title={final ? '최종 AI 피드백' : '최초 AI 피드백'} /><Notice title="피드백이 아직 없어요">학습 기록에서 제출 상태를 확인해 주세요.</Notice><Link to="/learning" className={linkClass}>학습 기록 보기</Link></Shell>
  const { targets, draft, reflection, observation, sessionId } = data
  const target = targets.find(t => t.id === active) ?? targets[0]
  const items = data.items[target.id] ?? []
  const failed = state === 'transient-error' || state === 'validation-error' || state === 'failed'
  return <Shell><PageTitle label={`AI REVIEW / ${final ? 'FINAL' : 'INITIAL'}`} title={final ? '돌아본 생각, 다음 관점으로' : '내 판단의 범위를 넓혀보세요'} description={final ? '관찰한 변화와 남긴 회고를 함께 살펴봤어요. 다음 예측에서 확인할 질문을 남겨보세요.' : '내가 남긴 예측을 바탕으로 불확실한 점과 함께 살펴볼 요소를 정리했어요.'} />
    <div className="space-y-2 rounded-card bg-brand-subtle p-4"><p className="text-control font-medium">{final ? '회고 저장 완료 · 학습 완료' : '예측 제출 완료'}</p><p className="text-meta text-text-secondary">{final ? '최종' : '최초'} 피드백 · 생성 {data.generatedAt ?? (failed ? '미생성' : '대기 중')} · {data.inputCutoffAt ? `자료 공개 기준 ${data.inputCutoffAt}` : `${final ? '결과 종료' : '제출'} 시점까지 공개된 승인 자료만 참고했어요.`}</p></div>
    {state === 'loading' || state === 'pending' || state === 'generating' || failed ? <div className="space-y-6"><Notice title={state === 'pending' ? 'AI 피드백 생성 대기 중이에요' : state === 'generating' || state === 'loading' ? 'AI 피드백을 준비하고 있어요' : '피드백을 표시하지 못했어요'} error={failed}>{final ? '회고' : '예측'}는 저장 완료됐어요. {state === 'transient-error' ? '일시적인 연결 문제로 피드백을 생성하지 못했어요.' : state === 'validation-error' ? '자료 인용 또는 출력 형식을 확인하지 못했어요.' : state === 'failed' ? 'AI 피드백 생성에 실패했어요. 저장된 기록은 그대로 유지됩니다.' : '기다리는 동안 학습 기록을 확인할 수 있어요.'}</Notice>{state === 'transient-error' && canRetryGeneration && <Button onClick={onRetry}>다시 생성하기</Button>}{onRefresh && <Button variant="secondary" onClick={onRefresh}>상태 다시 확인</Button>}<Link to="/learning" className={linkClass}>학습 기록 보기</Link></div> : <>
      {!final && <section className="space-y-6"><h2 className="text-section">판단 흐름 요약</h2><p className="text-ui text-text-secondary">{data.flowSummary ?? '대상별로 기록한 단기·중기·장기 판단을 함께 살펴보세요. 이유를 기록한 항목은 원래의 판단을 참고하고, 이유가 없는 항목은 함께 살펴볼 요소를 확인해요.'}</p></section>}
      <TargetSwitcher targets={targets} active={active} onChange={setActive} />
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,5fr)] items-start gap-12">
        <aside className="min-w-0 space-y-6 rounded-card bg-surface-subtle p-6"><p className="font-mono text-label text-brand-primary">MY {final ? 'REFLECTION' : 'PREDICTION'}</p><h2 className="text-section">{final ? '저장한 회고' : '내가 남긴 판단'}</h2>
          {final && <><p className="whitespace-pre-wrap text-ui">{reflection || '저장된 회고가 없어요.'}</p><p className="text-meta text-text-muted">저장 {data.reflectionSavedAt ?? '시각 정보 없음'}</p><Button variant="secondary" className="w-full" onClick={() => setReflectionOpen(true)}>저장한 회고 보기</Button></>}
          <div className="space-y-4 border-t border-border-default pt-6">{horizons.map(h => <section key={h}><h3 className="text-control font-medium">{h}거래일 · {directionLabel(target, draft[target.id][h].direction)}</h3><p className="mt-2 whitespace-pre-wrap break-words text-meta text-text-secondary">{draft[target.id][h].reason.trim() ? draft[target.id][h].reason : '판단 이유를 기록하지 않았어요.'}</p></section>)}</div>
          {final && <details className="border-t border-border-default pt-4"><summary className="min-h-11 cursor-pointer text-control focus-visible:outline-2 focus-visible:outline-brand-primary">관찰 기록과 중간 메모</summary><div className="space-y-3 py-4 text-meta text-text-secondary">{data.midNotes?.[target.id]?.length ? data.midNotes[target.id].map((note, i) => <p key={i}>{note}</p>) : <p>1·5거래일 메모: 아직 기록한 메모가 없어요.</p>}{data.observationRecords ? data.observationRecords[target.id]?.map(record => <p key={record.horizon}>{record.horizon}거래일 · {record.text}</p>) : horizons.map(h => <p key={h}>{h}거래일 · {state === 'unavailable' ? '관측 불가 · 기준 자료를 확보하지 못했어요.' : '[관찰값 · 단위 · 기준 시각]'} </p>)}</div></details>}
        </aside>
        <div className="min-w-0 space-y-6">{state === 'limited' && <Notice title="근거가 충분하지 않은 부분이 있어요">확인 가능한 자료 범위의 피드백을 표시합니다. 자료가 없는 항목과 해석 한계를 함께 안내해요.</Notice>}
          {items.map((item, index) => <section key={`${target.id}-${item.title}`} className="space-y-6 border-b border-border-default pb-6"><p className="text-control text-brand-primary">0{index + 1} / {item.title}</p><h2 className="text-section">{item.title}</h2><p className="text-ui">{final && state === 'unavailable' && index === 0 ? '관측 자료를 확보하지 못한 항목의 흐름은 분석하지 않습니다. 숫자나 원인을 추정하지 않고 확인 가능한 자료의 범위만 안내합니다.' : item.body}</p>{item.sources.slice(0, 3).map(s => <SourceCard key={s.id} source={s} />)}</section>)}
          <SourcesOverview key={target.id} sources={items.flatMap(item => item.sources)} />
          <Notice title={final ? '해석 한계' : observation === 'completed' ? '학습 완료' : observation === 'reflection_pending' ? '관찰 종료 · 회고 대기' : observation === 'scheduled' ? '관찰 예정' : observation === 'observing' ? '관찰 중' : '기준값 확정 중'}>{final ? '관측 불가인 항목은 원인 판단에 사용하지 않으며, 자료가 부족한 항목은 확인 가능한 범위를 함께 안내합니다.' : observation === 'completed' ? '학습이 완료됐어요. 저장된 기록을 다시 살펴보세요.' : observation === 'reflection_pending' ? '관찰이 종료됐어요. 결과와 함께 최종 회고를 남겨보세요.' : observation === 'scheduled' ? '기준값이 확정됐어요. 예정된 기간별 관측 일정을 확인해 주세요.' : observation === 'observing' ? '기간별 시장 변화를 관찰하고 있어요. 결과 상태에서 관측 진행 상황을 확인할 수 있어요.' : 'T0가 확정되면 기간별 관측 일정을 확인할 수 있어요. 아직 결과 관찰은 시작되지 않았어요.'}</Notice>
          <Link to="/learning" className={`${linkClass} w-full bg-brand-primary text-surface-canvas hover:bg-brand-hover`}>학습 기록 보기</Link><Link to={final ? '/explore' : `${routeBase}/learning/${sessionId}/results`} className={`${linkClass} w-full border border-border-default`}>{final ? '뉴스 탐색으로 이동' : '결과 상태 보기'}</Link>
        </div>
      </div>
    </>}
    {reflectionOpen && <Modal title="저장한 회고" onClose={() => setReflectionOpen(false)}><p className="whitespace-pre-wrap text-ui">{reflection || '저장된 회고가 없어요.'}</p><p className="text-meta text-text-muted">저장 {data.reflectionSavedAt ?? '시각 정보 없음'}</p><Button onClick={() => setReflectionOpen(false)}>닫기</Button></Modal>}
  </Shell>
}
