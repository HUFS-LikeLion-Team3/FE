export const horizons = [1, 5, 20] as const
export type Horizon = typeof horizons[number]
export type Direction = 'up' | 'down' | 'neutral'
export type Target = { id: string; name: string; kind: 'index' | 'fx' | 'rate' }
export type Prediction = { direction: Direction | null; reason: string }
export type Draft = Record<string, Record<Horizon, Prediction>>
export type Source = { id: string; title: string; publisher: string; date: string; quote: string; url: string }
export type FeedbackItem = { title: string; body: string; sources: Source[] }
export type FeedbackState = 'ready' | 'loading' | 'transient-error' | 'validation-error' | 'limited' | 'unavailable'

export function directionLabel(target: Target, direction: Direction | null) {
  if (!direction) return '아직 선택하지 않았어요'
  if (direction === 'neutral') return '큰 방향성 없음'
  if (target.kind === 'fx') return direction === 'up' ? '환율 상승(원화 약세)' : '환율 하락(원화 강세)'
  if (target.kind === 'rate') return direction === 'up' ? '금리 상승' : '금리 하락'
  return direction === 'up' ? '상승 예상' : '하락 예상'
}

export function validateDraft(draft: Draft, targets: Target[]) {
  if (!targets.length || targets.length > 3) return '관찰할 대상을 1~3개 선택해 주세요.'
  if (targets.some(t => horizons.some(h => !draft[t.id]?.[h]?.direction))) return '모든 대상의 1·5·20거래일 방향을 선택해 주세요.'
  if (!targets.some(t => horizons.some(h => draft[t.id][h].reason.trim()))) return '판단 이유를 하나 이상 작성해 주세요.'
  return null
}

// UI view models; the API adapter will map the agreed server contract here.
export type ObservationState = 'baseline_pending' | 'scheduled' | 'observing'
export type NewsView = {
  id: string; category: string; title: string; publisher: string; publishedAt: string
  originalUrl: string; briefing: { title: string; body: string }[]; context: string
  sources: Source[]; targets: Target[]
  term: { name: string; description: string; url: string; sourceLabel: string }
}
export type FeedbackView = {
  targets: Target[]; draft: Draft; items: Record<string, FeedbackItem[]>
  reflection: string; observation: ObservationState; sessionId: string
}
