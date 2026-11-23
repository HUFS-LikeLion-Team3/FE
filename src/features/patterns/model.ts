import { horizons, type Horizon } from '../learning/model'

export { horizons }
type Market = 'korea' | 'us' | 'rate' | 'fx'
export type PreviewState = 'ready' | 'repeated' | 'insufficient' | 'empty' | 'loading' | 'error'
export type ReasonRecord = {
  newsId: string; title: string; target: string; horizon: Horizon; reason: string; variables: string[]
}
export type OutcomeRecord = {
  newsId: string; title: string; target: string; market: Market; horizon: Horizon
  direction: 'up' | 'down' | 'neutral'; change: number; reflection: string
}

export const markets: { key: Market; label: string; width: string }[] = [
  { key: 'korea', label: '국내 주식', width: 'w-36' },
  { key: 'us', label: '미국 주식', width: 'w-36' },
  { key: 'rate', label: '금리', width: 'w-28' },
  { key: 'fx', label: '환율', width: 'w-28' },
]

export function distinctReasonNews(records: ReasonRecord[]) {
  return distinctNews(records.filter(record => record.reason.trim()))
}

export function distinctOutcomeNews(records: OutcomeRecord[], market: Market, horizon: Horizon) {
  return distinctNews(records.filter(record => record.market === market && record.horizon === horizon))
}

function distinctNews<T extends { newsId: string }>(records: T[]) {
  return [...new Map(records.map(record => [record.newsId, record])).values()]
}

export function directionLabel(record: OutcomeRecord) {
  if (record.direction === 'neutral') return '큰 방향성 없음'
  return record.direction === 'up' ? '상승' : '하락'
}

export function changeLabel(record: OutcomeRecord) {
  const change = record.change.toLocaleString('ko-KR', { maximumFractionDigits: 2, signDisplay: 'exceptZero' })
  return `${change}${record.market === 'rate' ? '%p' : '%'}`
}
