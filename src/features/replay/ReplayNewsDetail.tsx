import { parseBriefing } from '@/features/news/briefing'
import { useId, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '../learning/components/Modal'
import { linkClass, Notice, PageTitle, Shell } from '../learning/components/PagePrimitives'
import { formatReplayMonth, replayCategoryLabel, type ReplayNews } from './api'

/** Replay 세션 생성이 연결되기 전의 시작 영역. 배포에서는 항상 이 영역을 보여준다. */
export function ReplayStartUnavailable() {
  const helpId = useId()
  return <>
    <Button className="w-full" disabled aria-describedby={helpId}>예측 시작하기</Button>
    <p id={helpId} className="text-meta text-text-muted">Replay 예측은 준비 중이에요</p>
  </>
}

/**
 * 결과 공개 전 지난 뉴스 상세. 사실 브리핑(briefing)만 보여주고 원문 링크·과거 수치·관찰 대상 시세는 보여주지 않는다.
 * 이 화면에 들어와도 학습 세션을 만들지 않는다.
 */
export default function ReplayNewsDetail({ news, fixtures, start }: { news: ReplayNews; fixtures: boolean; start?: ReactNode }) {
  const { search } = useLocation()
  const [sourceOpen, setSourceOpen] = useState(false)
  return <Shell section="/explore"><PageTitle label="REPLAY / FACT BRIEFING" title={news.title} description={`${formatReplayMonth(news.referenceAt)} · ${replayCategoryLabel(news.category)}${fixtures ? ' · 시안용 학습 자료' : ''}`} />
    <Link to={`/replay${search}`} className={linkClass}>← 지난 뉴스 목록으로</Link>
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-8 lg:gap-12">
      <div className="min-w-0 space-y-6 lg:col-span-5">
        <section className="space-y-6 rounded-card border border-border-default bg-surface-canvas p-4 sm:p-6">
          <h2 className="text-section">발표 당시의 사실부터 읽어보세요</h2>
          <p className="text-ui text-text-secondary">발표 당시 확인할 수 있었던 사실을 읽고, 이후의 시장 변화는 스스로 예측해 보세요.</p>
          {parseBriefing(news.briefing, '발표 내용').map((item, i) => <section key={i} className="space-y-3"><h3 className="text-control font-medium text-brand-primary">{item.title}</h3><p className="whitespace-pre-line break-words text-ui text-text-secondary">{item.body}</p></section>)}
        </section>
        <Notice title="자료의 기준 시점">브리핑과 최초 피드백은 당시 학습 기준 시점까지 공개된 자료만 사용해요. 과거 결과는 예측과 피드백을 확인한 뒤 열어볼 수 있어요.</Notice>
        <Button variant="secondary" className="w-full" onClick={() => setSourceOpen(true)}>뉴스 원문 안내</Button>
      </div>
      <aside className="min-w-0 space-y-6 lg:col-span-3"><Notice title="과거의 결과는 예측 뒤에 공개해요">대상별 1·5·20거래일 방향과 이유를 먼저 기록합니다. AI 피드백 확인 후 직접 결과를 열어볼 수 있어요.</Notice>
        <h2 className="text-section">함께 관찰할 대상</h2><p className="text-ui text-text-secondary">관찰 대상은 학습을 시작할 때 1~3개를 선택해요.</p>
        {start ?? <ReplayStartUnavailable />}
        <p className="text-meta text-text-muted">기간별 실시간 대기는 없어요. 과거에 확정된 결과를 한 번에 살펴봅니다.</p>
      </aside>
    </div>
    {sourceOpen && <Modal title="원문에 과거 결과가 포함될 수 있어요" onClose={() => setSourceOpen(false)}><p className="text-ui">원문을 열면 발표 이후의 결과가 드러날 수 있어요. 원문 링크는 결과를 공개한 뒤 확인할 수 있도록 준비하고 있어요.</p><Button onClick={() => setSourceOpen(false)}>당시 뉴스 계속 읽기</Button></Modal>}
  </Shell>
}
