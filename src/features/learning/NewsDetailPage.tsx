import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from './components/Modal'
import { linkClass, Notice, Shell, SourceCard } from './components/PagePrimitives'
import type { NewsView } from './model'

export default function NewsDetailPage({ data, onStartPrediction, onRetry, state = 'new' }: { data: NewsView | null; onRetry: () => void; onStartPrediction: () => void; state?: 'new' | 'draft' | 'submitted' | 'baseline_pending' | 'observing' | 'reflection_pending' | 'completed' | 'loading' | 'unavailable' }) {
  const news = data
  const [termOpen, setTermOpen] = useState(false)
  return <Shell><div className="text-center"><Link to="/explore" className={linkClass}>← 뉴스 탐색으로 돌아가기</Link></div>
    {!news || state === 'loading' || state === 'unavailable' ? <Notice title={state === 'loading' ? '뉴스를 불러오고 있어요' : '뉴스를 표시하지 못했어요'}>뉴스 탐색에서 다른 뉴스를 확인할 수 있어요.{state !== 'loading' && <Button className="mt-4" onClick={onRetry}>다시 불러오기</Button>}</Notice> : <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,3fr)] items-start gap-12">
      <article className="min-w-0 space-y-6"><p className="text-control text-brand-primary">{news.category}</p><h1 className="text-page">{news.title}</h1><p className="text-meta text-text-muted">{news.publisher} · {news.publishedAt}</p>
        <section className="space-y-6 border-y border-border-default py-6"><h2 className="text-section">학습용 뉴스 브리핑</h2>{news.briefing.map((item, i) => <div key={item.title} className="space-y-6"><h3 className="text-control text-brand-primary">0{i + 1} / {item.title}</h3><p className="text-news-body">{item.body}</p></div>)}</section>
        {news.context && <section className="space-y-6"><h2 className="text-section">배경 맥락</h2><p className="text-news-body">{news.context}</p></section>}
        {news.term && <section className="space-y-6"><h2 className="text-section">용어 살펴보기</h2><Button variant="secondary" className="w-full" onClick={() => setTermOpen(true)}>{news.term.name} 뜻 보기</Button></section>}
        {!!news.facts?.length && <section className="space-y-4"><h2 className="text-section">주요 사실과 수치</h2>{news.facts.map(fact => <div key={fact.id}><h3 className="text-control">{fact.label}</h3><p className="text-ui">{fact.value} {fact.unit}</p>{fact.asOf && <p className="text-meta text-text-muted">기준 시각 · {fact.asOf}</p>}</div>)}</section>}
        <section className="space-y-6"><h2 className="text-section">근거 자료</h2>{news.sources.map(source => <SourceCard key={source.id} source={source} />)}</section>
        {news.originalUrl && <a className={`${linkClass} w-full`} href={news.originalUrl} target="_blank" rel="noopener noreferrer">{news.originalLabel ?? '뉴스 원문 보기 ↗'}<span className="sr-only"> (새 탭)</span></a>}
      </article>
      <aside className="space-y-6 rounded-card bg-surface-subtle p-6"><p className="font-mono text-label text-brand-primary">YOUR WORKBOOK</p><h2 className="text-section">시장의 변화를<br />직접 예상해 보세요</h2><h3 className="text-control font-medium">이 뉴스와 함께 관찰할 지표</h3><ul className="text-ui text-text-secondary">{news.targets.map(t => <li key={t.id}>{t.name}</li>)}</ul><p className="text-meta text-text-secondary">대상별 1·5·20거래일 방향을 기록합니다. 이유는 개별 선택이며, 제출할 때 전체에서 하나 이상 작성해 주세요.</p><Button className="w-full" onClick={onStartPrediction}>{state === 'draft' ? '작성 이어가기' : state === 'completed' ? '완료한 기록 보기' : state === 'reflection_pending' ? '회고하러 가기' : state === 'observing' || state === 'baseline_pending' ? '결과 보기' : state === 'submitted' ? '제출한 기록 보기' : '예측 시작하기'}</Button><p className="text-meta text-text-muted">AI 방향성 해설은 예측을 제출한 뒤 제공해요.</p></aside>
    </div>}
    {termOpen && news?.term && <Modal title={news.term.name} onClose={() => setTermOpen(false)}><p className="text-ui">{news.term.description}</p><a className={linkClass} href={news.term.url} target="_blank" rel="noopener noreferrer">{news.term.sourceLabel} ↗</a><Button className="w-full" onClick={() => setTermOpen(false)}>닫기</Button></Modal>}
  </Shell>
}
