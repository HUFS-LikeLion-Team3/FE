import { z } from 'zod'
import type { Draft } from '../learning/model'
import { replayTargetIds, type ReplayScenario } from './api'

const prediction = z.object({ direction: z.enum(['up', 'down', 'neutral']).nullable(), reason: z.string().max(3000) })
const sessionSchema = z.object({
  id: z.string().uuid(), scenarioId: z.string().min(1), referenceMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), title: z.string().min(1),
  targetIds: z.array(z.enum(replayTargetIds)).max(3),
  draft: z.record(z.string(), z.object({ 1: prediction, 5: prediction, 20: prediction })),
  savedAt: z.string().datetime().nullable(), submittedAt: z.string().datetime().nullable(),
  feedbackReadAt: z.string().datetime().nullable(), resultsRevealedAt: z.string().datetime().nullable(),
}).refine(value => new Set(value.targetIds).size === value.targetIds.length && value.targetIds.every(id => !!value.draft[id])
  && (!value.submittedAt || (value.targetIds.length > 0 && value.targetIds.every(id => [1, 5, 20].every(h => !!value.draft[id][h as 1 | 5 | 20].direction)) && value.targetIds.some(id => [1, 5, 20].some(h => value.draft[id][h as 1 | 5 | 20].reason.trim()))))
  && (!value.resultsRevealedAt || (!!value.submittedAt && !!value.feedbackReadAt)))
export type ReplayPreviewSession = z.infer<typeof sessionSchema>
const key = (id: string) => `finsight.dev.replay-flow.${id}`
export function readReplaySession(scenarioId: string): ReplayPreviewSession | null {
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(sessionStorage.getItem(key(scenarioId)) ?? 'null'))
    return parsed.success && parsed.data.scenarioId === scenarioId ? parsed.data : null
  } catch { return null }
}
export function newReplaySession(scenario: ReplayScenario): ReplayPreviewSession {
  return { id: crypto.randomUUID(), scenarioId: scenario.id, referenceMonth: scenario.referenceMonth, title: scenario.title, targetIds: [],
    draft: Object.fromEntries(scenario.targetIds.map(id => [id, { 1: { direction: null, reason: '' }, 5: { direction: null, reason: '' }, 20: { direction: null, reason: '' } }])) as Draft,
    savedAt: null, submittedAt: null, feedbackReadAt: null, resultsRevealedAt: null }
}
export function saveReplaySession(session: ReplayPreviewSession) {
  const parsed = sessionSchema.parse(session)
  sessionStorage.setItem(key(session.scenarioId), JSON.stringify(parsed))
  return parsed
}
export function previewResultHref(session: ReplayPreviewSession) {
  return `/dev/replay/preview/results?from=${encodeURIComponent(session.scenarioId)}&session=${encodeURIComponent(session.id)}`
}
