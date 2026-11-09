import type { OutcomesDto, SeriesDto } from './api/contracts'

type Outcome = OutcomesDto['targets'][number]
// Only tolerate floating-point serialization noise, not a different market value.
const sameValue = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-8

export function isConsistentMarketSeries(data: SeriesDto, outcome: Outcome) {
  if (data.sessionTargetId !== outcome.sessionTargetId || data.marketTargetId !== outcome.marketTargetId) return false
  const points = new Map(data.series.map(point => [point.tradingDate, point]))
  if (points.size !== data.series.length) return false
  const baseline = outcome.baseline
  const anchors = [
    ...(baseline.status === 'ready' && baseline.baselineValue !== null && baseline.baselineSessionDate ? [{ date: baseline.baselineSessionDate, value: baseline.baselineValue, unit: baseline.unit }] : []),
    ...outcome.observations.flatMap(row => row.status === 'ready' && row.observedValue !== null && row.observationSessionDate ? [{ date: row.observationSessionDate, value: row.observedValue, unit: row.unit }] : []),
  ]
  const unit = anchors[0]?.unit ?? data.series[0]?.unit
  if (data.series.some(point => !Number.isFinite(point.closeValue) || point.unit !== unit)) return false
  const byDate = new Map<string, typeof anchors[number]>()
  for (const anchor of anchors) {
    if (!Number.isFinite(anchor.value) || anchor.unit !== unit) return false
    const prior = byDate.get(anchor.date)
    if (prior && !sameValue(prior.value, anchor.value)) return false
    byDate.set(anchor.date, anchor)
    const point = points.get(anchor.date)
    if (point && (point.unit !== anchor.unit || !sameValue(point.closeValue, anchor.value))) return false
  }
  return true
}
