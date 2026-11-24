import type { FeedbackItem, Target } from './model'
import { exportComposition, type LearningNews } from './learning-note-data'

const research = 'https://www.chicagofed.org/publications/economic-perspectives/2023/5'
const monetaryPolicy = 'https://www.federalreserve.gov/monetarypolicy/monetary-policy-what-are-its-goals-how-does-it-work.htm'
const sourceClass = 'inline-flex min-h-11 items-center text-meta text-text-muted underline underline-offset-4 hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary'

export default function FeedbackLearningNote({ target, items, news }: { target: Target; items: FeedbackItem[]; news?: LearningNews }) {
  const text = items.map(item => item.body).join(' ')
  const equity = ['stock_index', 'equity_index', 'stock'].includes(target.targetType ?? '') || ['NASDAQ', '나스닥', 'KOSPI', '코스피', 'S&P'].some(name => target.name.toUpperCase().includes(name.toUpperCase()))
  const exportNews = !!news && /수출/.test(news.title)
  const composition = exportComposition(news)
  if (exportNews) return composition ? <section className="space-y-4 border-t border-border-default pt-6" aria-label="수출 구성비 학습">
    <h2 className="text-section">뉴스 수치로 알아보기 · 반도체 수출 비중</h2>
    <div className="space-y-2 rounded-card bg-surface-subtle p-4"><p className="text-ui">뉴스에 제공된 같은 기준 시점의 총수출액 <strong>{composition.overall.toLocaleString('ko-KR')} {composition.unit}</strong> 중 반도체 수출액은 <strong>{composition.part.toLocaleString('ko-KR')} {composition.unit}</strong>이에요.</p><p className="font-mono text-meta text-text-secondary">{composition.part} ÷ {composition.overall} × 100 ≈ {composition.percent}%</p><p className="text-ui">총수출에서 반도체가 차지하는 구성비는 약 <strong>{composition.percent}%</strong>예요. 이 값은 수출 증가 기여율이나 NASDAQ 100의 변동률이 아니에요.</p></div>
    <p className="text-meta text-text-secondary">계산 기준: 뉴스의 제공 수치. 잠정치나 반올림한 금액이라면 비중도 근삿값이에요. 한국 반도체 수출 증가가 미국 기술주 이익으로 이어지는지는 별도의 근거가 필요해요.</p>
  </section> : null
  // A repeated term in generated prose is insufficient to choose a lesson.
  const monetaryNews = !!news && /금리|연준|FOMC|통화정책|중앙은행/.test(news.title)
  if (!monetaryNews) return null
  if (target.kind === 'rate') return <section className="space-y-4 border-t border-border-default pt-6" aria-label="금리 개념 학습">
    <h2 className="text-section">숫자로 더 알아보기 · 금리 변화 읽기</h2>

    <div className="space-y-2 rounded-card bg-surface-subtle p-4"><h3 className="text-control font-medium">금리 변화 읽기 · 가상 계산 예시</h3><p className="text-ui">5.00%에서 5.10%로 오르면 <strong>0.10%포인트, 즉 10bp 상승</strong>입니다. 금리 수준인 5.10%와 변화량인 10bp를 구분해서 읽어보세요.</p></div>

    <a className={sourceClass} href={monetaryPolicy} target="_blank" rel="noopener noreferrer">개념 출처 · 연준 통화정책 설명 ↗<span className="sr-only"> (새 탭)</span></a>
  </section>
  if (!equity || !/할인율|현재가치/.test(text)) return null
  return <section className="space-y-4 border-t border-border-default pt-6" aria-label="할인율 개념 학습">
    <h2 className="text-section">계산으로 더 알아보기 · 할인율과 현재가치</h2>

    <div className="space-y-2 rounded-card bg-surface-subtle p-4"><h3 className="text-control font-medium">미래의 100원을 오늘의 가치로 바꾸면 · 가상 계산 예시</h3><p className="text-ui">1년 뒤 받을 100원을 할인율 5%로 계산하면 오늘 가치는 약 <strong>95.24원</strong>입니다. 할인율이 6%로 높아지면 약 <strong>94.34원</strong>으로 낮아집니다.</p><p className="font-mono text-meta text-text-secondary">현재가치 = 미래 금액 ÷ (1 + 할인율)</p></div>
    <p className="text-meta text-text-secondary">위 계산은 미래에 받을 금액과 다른 조건이 같을 때의 예시입니다. 실제 주가의 변동률을 계산하거나 예측한 값은 아니에요.</p>
    <a className={sourceClass} href={research} target="_blank" rel="noopener noreferrer">개념 출처 · 시카고 연준 연구 ↗<span className="sr-only"> (새 탭)</span></a>
  </section>
}
