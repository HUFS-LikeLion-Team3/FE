import { horizons, markets, type OutcomeRecord, type PreviewState, type ReasonRecord } from './model'

const reasons: ReasonRecord[] = [
  { newsId: 'policy-rate', title: '연준 기준금리 결정', target: '미국 10년물 국채금리', horizon: 5, reason: '금리 자체보다 향후 정책 경로에 대한 기대가 달라질 수 있다고 봤어요.', variables: ['policy'] },
  { newsId: 'inflation', title: '미국 소비자물가 발표', target: '나스닥', horizon: 5, reason: '물가 둔화가 이어지면 금리 인하 기대가 커질 수 있다고 봤어요.', variables: ['policy'] },
  { newsId: 'jobs', title: '미국 고용 지표 발표', target: 'S&P 500', horizon: 1, reason: '고용이 강하면 소비가 버티지만 정책 완화는 늦춰질 수 있어요.', variables: ['policy', 'demand'] },
  { newsId: 'earnings', title: '반도체 기업 분기 실적 발표', target: '나스닥', horizon: 20, reason: '이번 분기 실적과 다음 분기 수요 전망을 구분해 판단했어요.', variables: ['demand'] },
  { newsId: 'exports', title: '한국 수출 동향 발표', target: '코스피', horizon: 5, reason: '수출 증가가 반도체 수요 개선과 함께 이어지는지 확인하고 싶었어요.', variables: ['demand'] },
  { newsId: 'policy-outlook', title: '통화정책 전망 발표', target: '원·달러 환율', horizon: 20, reason: '양국의 정책 경로 차이가 환율에 영향을 줄 수 있다고 봤어요.', variables: ['policy'] },
]

const reflections = [
  '정책 발표 전 시장에 반영돼 있던 기대도 확인할 필요가 있었어요.',
  '발표 당일의 변화와 일주일 뒤의 흐름을 구분해 보는 게 도움이 됐어요.',
  '같은 기간 발표된 다른 지표도 함께 확인해야 했어요.',
  '실적 개선과 이후 수요 전망을 따로 살펴보고 싶어요.',
  '한 번의 변화로 반복되는 경향을 판단하기 어려웠어요.',
]
const targets = ['코스피', '나스닥', '미국 10년물 국채금리', '원·달러 환율']

export function patternFixture(state: PreviewState) {
  const sampleSize = state === 'empty' ? 0 : state === 'insufficient' ? 2 : state === 'repeated' ? 5 : 3
  const outcomes: OutcomeRecord[] = markets.flatMap((market, marketIndex) => horizons.flatMap(horizon =>
    reasons.slice(0, sampleSize).map((record, index) => ({
      newsId: record.newsId, title: record.title, target: targets[marketIndex], market: market.key, horizon,
      direction: index % 3 === 0 ? 'up' : index % 3 === 1 ? 'down' : 'neutral',
      change: (market.key === 'rate' ? [0.12, -0.09, 0.03, 0.08, -0.04] : [1.42, -0.84, 0.23, 0.76, -0.45])[index],
      reflection: reflections[index],
    }))))
  return { reasons: state === 'empty' || state === 'insufficient' ? reasons.slice(0, sampleSize) : reasons, outcomes }
}
