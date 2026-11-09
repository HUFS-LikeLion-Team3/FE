import type { FeedbackItem, Target } from './model'

const research = 'https://www.chicagofed.org/publications/economic-perspectives/2023/5'
const monetaryPolicy = 'https://www.federalreserve.gov/monetarypolicy/monetary-policy-what-are-its-goals-how-does-it-work.htm'
const sourceClass = 'inline-flex min-h-11 items-center text-meta text-text-muted underline underline-offset-4 hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary'

export default function FeedbackLearningNote({ target, items }: { target: Target; items: FeedbackItem[] }) {
  const text = items.map(item => item.body).join(' ')
  const equity = ['stock_index', 'equity_index', 'stock'].includes(target.targetType ?? '') || ['NASDAQ', '나스닥', 'KOSPI', '코스피', 'S&P'].some(name => target.name.toUpperCase().includes(name.toUpperCase()))
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
