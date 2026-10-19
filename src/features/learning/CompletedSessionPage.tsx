import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { PageTitle, Shell, Notice, linkClass } from './components/PagePrimitives'
import { QueryState } from './components/QueryState'
import { Modal } from './components/Modal'
import { loadWorkbook } from './api/workbook'
import { formatTime } from './api/page-data'
import { directionLabel, horizons } from './model'
import { sessionDestination } from './session-routes'

const labels = { learned: '배운 점', missed_variable: '놓친 변수', next_check: '다음에 확인할 점' }
export default function CompletedSessionPage() {
  const { sessionId = '' } = useParams()
  const [record, setRecord] = useState<'prediction' | 'reflection' | null>(null)
  const query = useQuery({ queryKey: ['workbook', sessionId], queryFn: ({ signal }) => loadWorkbook(sessionId, signal), retry: false, refetchOnWindowFocus: false })
  if (!query.data) return <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
  if (query.data.redirectTo !== null) {
    if (query.isFetching || query.isError) return <QueryState loading={query.isFetching} error={query.error} retry={() => void query.refetch()} />
    return <Navigate to={query.data.redirectTo} replace />
  }
  const data = query.data
  if (data.session.status !== 'completed') return <Navigate to={sessionDestination(data.session)} replace />
  const initial = data.feedbacks.find(f => f.feedbackStage === 'initial' && f.isLatest)
  const final = data.feedbacks.find(f => f.feedbackStage === 'final' && f.isLatest)
  const feedbackStatus = (status: string | undefined) => status === 'ready' ? '생성 완료' : status === 'failed' ? '생성 실패' : status === 'generating' ? '생성 중' : '생성 대기'
  const observedDates = data.outcomes.targets.flatMap(t => t.observations).filter(o => o.status === 'ready' && o.observedAt).map(o => o.observedAt!).sort()
  const stages = [
    { title: '예측', status: '제출 완료', time: data.session.submittedAt, description: `대상 ${data.targets.length}개 · ${data.targets.length * 3}개 방향 기록`, action: () => setRecord('prediction') },
    { title: '최초 피드백', status: feedbackStatus(initial?.status), time: initial?.generatedAt, description: '제출한 판단의 범위 살펴보기', href: `/learning/${sessionId}/feedback` },
    { title: '관측', status: '관측 종료', time: observedDates.at(-1), description: 'T1 · T5 · T20 기록과 관측 불가 사유', href: `/learning/${sessionId}/results` },
    { title: '회고', status: '제출 완료', time: data.session.completedAt, description: '배운 점을 기록한 답변', action: () => setRecord('reflection') },
    { title: '최종 피드백', status: feedbackStatus(final?.status), time: final?.generatedAt, description: '다음 학습의 확인점', href: `/learning/${sessionId}/final-feedback` },
  ]
  return <Shell>{query.isError && <Notice title="최신 상태를 불러오지 못했어요" error>{query.error.message} 마지막으로 조회한 기록을 유지했어요.</Notice>}<PageTitle label="MY WORKBOOK / COMPLETED" title="한 번의 학습이 기록이 되었어요" description={`${data.news.title} · ${data.targets.map(t => t.name).join(' / ')}`} /><Notice title="학습 완료" className="bg-brand-subtle">최종 회고 저장 {formatTime(data.session.completedAt)} · 예측의 정확도를 뜻하는 상태가 아니라 회고를 남긴 기록입니다.</Notice><h2 className="text-section">이번 세션 돌아보기</h2>
    <ol className="grid grid-cols-5 gap-6">{stages.map((stage, index) => <li key={stage.title} className="relative flex min-w-0 flex-col gap-4 rounded-card bg-surface-subtle p-5"><>{index < 4 && <span aria-hidden="true" className="absolute -right-5 top-1/2 text-brand-primary">→</span>}</><p className="font-mono text-label text-brand-primary">0{index + 1} / {stage.status}</p><h3 className="text-section">{stage.title}</h3><p className="text-meta text-text-muted">{formatTime(stage.time)}</p><p className="flex-1 text-meta text-text-secondary">{stage.description}</p>{stage.href ? <Link to={stage.href} className={`${linkClass} border border-border-default bg-surface-canvas`}>기록 보기</Link> : <Button variant="secondary" onClick={stage.action}>기록 보기</Button>}</li>)}</ol>
    <Link to="/learning" className={`${linkClass} w-full`}>학습 기록 목록으로</Link><Button variant="text" loading={query.isFetching} onClick={() => void query.refetch()}>최신 상태 불러오기</Button>
    {record && <Modal title={record === 'prediction' ? '제출한 예측' : '저장한 최종 회고'} onClose={() => setRecord(null)}>{record === 'prediction' ? data.targets.map(target => <section key={target.id} className="space-y-4"><h3 className="text-section">{target.name}</h3>{horizons.map(h => <div key={h}><p className="text-control">{h}거래일 · {directionLabel(target, data.draft[target.id]?.[h]?.direction ?? null)}</p><p className="whitespace-pre-wrap text-meta text-text-secondary">{data.draft[target.id]?.[h]?.reason || '판단 이유 미작성'}</p></div>)}</section>) : data.notes.filter(n => n.reflectionType === 'final' && n.sessionTargetId === null).map(note => <section key={note.id} className="space-y-2"><h3 className="text-section">{labels[note.promptKey as keyof typeof labels] ?? '회고'}</h3><p className="whitespace-pre-wrap text-ui">{note.body}</p><p className="text-meta text-text-muted">{formatTime(note.createdAt)} · 읽기 전용</p></section>)}<Button variant="secondary" className="w-full" onClick={() => setRecord(null)}>닫기</Button></Modal>}
  </Shell>
}
