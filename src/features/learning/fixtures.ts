import { horizons, type Draft, type FeedbackItem, type Source, type Target } from './model'

// Screen examples only. These are not API DTOs or real market observations.
export const targets: Target[] = [
  { id: 'dollar', name: '달러 인덱스', kind: 'index' },
  { id: 'nasdaq', name: 'NASDAQ 100', kind: 'index' },
  { id: 'yield', name: '미국 10년물 국채금리', kind: 'rate' },
]
export const fxTarget: Target = { id: 'krw-usd', name: '원/달러 환율', kind: 'fx' }
export const selectedTargets = targets.slice(0, 2)
export const fixtureTargets: Record<string, Target[]> = { one: targets.slice(0, 1), two: selectedTargets, three: targets, fx: [fxTarget] }
export const news = {
  id: 'policy-rate', category: '미국 · 금리', title: '정책금리 동결 발표: 발표문에서 확인할 사실',
  publisher: '[발행처]', publishedAt: '[원문 최초 발행 시각과 시간대]',
  originalUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
  briefing: [
    { title: '결정된 내용', body: '정책금리 결정의 사실과 수치를 확인합니다. 수치에는 단위와 기준 시점을 함께 표시합니다. [출처 1]' },
    { title: '발표의 조건', body: '발표문이 설명하는 경제 상황과 판단 조건을 정리합니다. 앞으로의 방향을 단정하지 않습니다. [출처 1]' },
    { title: '비교할 기준', body: '관련 지표의 집계 기간과 발표 시점을 구분해 읽습니다. [출처 2]' },
  ],
  context: '정책금리를 이해하려면 물가와 고용 등 여러 경제 지표를 함께 살펴볼 수 있습니다. 각 자료의 기준 시점과 발표 시점을 구분해 읽어보세요. [출처]',
}
export const source: Source = {
  id: 'policy', title: '[01] 정책 발표문과 관련 공식 지표', publisher: '[발행 기관]', date: '[발행일]',
  quote: '해당 항목에 사용한 짧은 인용 발췌와 자료 범위를 표시합니다.', url: news.originalUrl,
}
export function emptyDraft(items: Target[]): Draft {
  return Object.fromEntries(items.map(t => [t.id, Object.fromEntries(horizons.map(h => [h, { direction: null, reason: '' }]))])) as Draft
}
export const recordedDraft: Draft = {
  dollar: { 1: { direction: 'up', reason: '정책 기대의 변화가 단기 달러 수요에 영향을 줄 수 있다고 봤어요.' }, 5: { direction: 'neutral', reason: '' }, 20: { direction: 'down', reason: '' } },
  yield: { 1: { direction: 'up', reason: '경제 지표의 발표 시점을 함께 확인했어요.' }, 5: { direction: 'neutral', reason: '' }, 20: { direction: 'down', reason: '' } },
  'krw-usd': { 1: { direction: 'up', reason: '환율과 금리의 기준 시점을 함께 확인했어요.' }, 5: { direction: 'neutral', reason: '' }, 20: { direction: 'down', reason: '' } },
  nasdaq: { 1: { direction: 'down', reason: '' }, 5: { direction: 'up', reason: '' }, 20: { direction: 'up', reason: '' } },
}
export const reflection = '발표 내용뿐 아니라 미리 형성된 기대도 함께 확인해야겠다고 느꼈어요.'
export function feedbackItems(target: Target, final: boolean): FeedbackItem[] {
  const items = final ? [
    ['관찰된 흐름', `${target.name}의 기간별 관측값과 변화량을 정리합니다. 다른 방향이 관찰된 기간도 하나의 뉴스가 직접 만든 결과로 단정하지 않습니다.`],
    ['함께 확인된 요소', '같은 기간 공개된 경제 발표와 시장 여건을 관련 승인 자료와 함께 살펴볼 수 있어요.'],
    ['회고 보완점', '발표 내용과 미리 형성된 기대를 구분하려는 관점을 남겼어요. 각각의 자료가 언제 공개됐는지도 함께 확인해 보세요.'],
    ['다음 가설 점검', '다음 뉴스에서는 내 예상과 다른 흐름이 나타날 조건을 먼저 적고, 확인할 지표의 발표 일정을 함께 기록해 보세요.'],
  ] : [
    ['불확실한 점', `${target.name}와 관련된 발표 내용과 당시 시장 기대의 차이는 추가 자료로 확인해야 합니다. 기간마다 같은 조건이 유지되는지도 살펴보세요.`],
    ['반대 시나리오', '다른 경제 발표나 기대 변화가 같은 기간에 함께 관찰될 가능성도 살펴볼 수 있어요.'],
    ['함께 살펴볼 요소', '관련 지표의 기준 시점과 발표 일정을 확인해 보세요. 자료의 수치와 해석을 구분해 읽어보세요.'],
  ]
  return items.map(([title, body], i) => ({ title, body, sources: [{ ...source, id: `${target.id}-${i}`, title: `[0${i + 1}] 정책 발표문과 관련 공식 지표` }] }))
}

export const newsView = { ...news, targets, sources: [source], term: {
  name: '기준금리', description: '중앙은행이 통화정책을 운용할 때 기준으로 삼는 정책금리입니다. 국가별 운영 방식과 발표 시점을 함께 확인하세요.',
  url: 'https://www.bok.or.kr/portal/main/contents.do?menuNo=200285', sourceLabel: '한국은행 공식 설명',
} }
