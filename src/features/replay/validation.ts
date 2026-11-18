import { horizons } from '../learning/model'
import { replayPrompts, type ReplayData } from './model'
import type { SeriesDto } from '../learning/api/contracts'

export function validReplayData(data: ReplayData) {
  const ids = data.targets.map(target => target.id)
  return data.targets.length > 0 && data.targets.length <= 3 && new Set(ids).size === ids.length
    && (!data.receipt || (data.receipt.replayId === data.replayId && !Number.isNaN(Date.parse(data.receipt.savedAt)) && data.receipt.answers.length > 0 && data.receipt.answers.length <= 3 && new Set(data.receipt.answers.map(a => a.promptKey)).size === data.receipt.answers.length && data.receipt.answers.every(a => a.body.trim() && replayPrompts.some(p => p.key === a.promptKey))))
    && data.outcomes.learningSessionId === data.sessionId
    && data.outcomes.targets.length === data.targets.length
    && new Set(data.outcomes.targets.map(target => target.sessionTargetId)).size === data.outcomes.targets.length
    && data.outcomes.targets.every(outcome => data.targets.some(target => target.id === outcome.sessionTargetId && target.marketTargetId === outcome.marketTargetId)
      && outcome.observations.length === horizons.length && horizons.every(horizon => outcome.observations.some(row => row.horizon === horizon))
      && new Set(outcome.observations.map(row => row.horizon)).size === outcome.observations.length
      && (outcome.baseline.status !== 'ready' || (Number.isFinite(outcome.baseline.baselineValue) && outcome.baseline.baselineValue !== null && !!outcome.baseline.baselineSessionDate))
      && outcome.observations.every(row => row.status !== 'ready' || (row.observedValue !== null && Number.isFinite(row.observedValue) && !!row.observationSessionDate && row.unit === outcome.baseline.unit)))
}

export function validReplaySeries(data: ReplayData, targetId: string, series: SeriesDto) {
  const target = data.targets.find(t => t.id === targetId)
  const outcome = data.outcomes.targets.find(t => t.sessionTargetId === targetId)
  if (!target || !outcome || series.learningSessionId !== data.sessionId || series.sessionTargetId !== targetId || series.marketTargetId !== target.marketTargetId) return false
  const anchors = [
    ...(outcome.baseline.status === 'ready' && outcome.baseline.baselineValue !== null && outcome.baseline.baselineSessionDate ? [{ date: outcome.baseline.baselineSessionDate, value: outcome.baseline.baselineValue, unit: outcome.baseline.unit }] : []),
    ...outcome.observations.flatMap(row => row.status === 'ready' && row.observedValue !== null && row.observationSessionDate ? [{ date: row.observationSessionDate, value: row.observedValue, unit: row.unit }] : []),
  ]
  const first = anchors[0], last = anchors.map(a => a.date).sort().at(-1)
  if (!first || !last || new Set(series.series.map(point => point.tradingDate)).size !== series.series.length) return false
  if (series.series.some(point => !Number.isFinite(point.closeValue) || point.unit !== first.unit || point.tradingDate < first.date || point.tradingDate > last)) return false
  const values = new Map<string, number>()
  for (const anchor of anchors) {
    if (!Number.isFinite(anchor.value) || anchor.unit !== first.unit) return false
    const previous = values.get(anchor.date)
    if (previous !== undefined && Math.abs(previous - anchor.value) > 1e-8) return false
    values.set(anchor.date, anchor.value)
    const point = series.series.find(p => p.tradingDate === anchor.date)
    if (point && Math.abs(point.closeValue - anchor.value) > 1e-8) return false
  }
  return true
}
