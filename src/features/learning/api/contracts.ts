import { z } from 'zod'

const id = z.string().uuid()
const timestamp = z.string()
const httpUrl = z.string().url().refine(value => /^https?:\/\//.test(value))
export const sessionSchema = z.object({
  id, newsId: id, sessionType: z.enum(['live', 'replay']),
  status: z.enum(['drafting', 'baseline_pending', 'observing', 'reflection_pending', 'completed']),
  savedAt: timestamp.nullable().optional(), submittedAt: timestamp.nullable().optional(),
  completedAt: timestamp.nullable().optional(), createdAt: timestamp, updatedAt: timestamp.optional(),
})
export const sessionsSchema = z.object({ content: z.array(sessionSchema) })
export const newsSchema = z.object({ id, title: z.string(), category: z.string(), briefing: z.string(), publishedAt: timestamp })
export const factsSchema = z.object({ facts: z.array(z.object({ id, label: z.string(), valueText: z.string(), unit: z.string().nullable(), asOfAt: timestamp.nullable(), sortOrder: z.number() })) })
export const sourcesSchema = z.object({ sources: z.array(z.object({ id, title: z.string(), publisher: z.string(), url: httpUrl, publishedAt: timestamp, isPrimary: z.boolean() })) })
export const marketSchema = z.object({
  id, displayName: z.string(), marketCategory: z.string(), targetType: z.string(), unit: z.string(),
  directionLabels: z.object({ up: z.string(), down: z.string(), neutral: z.string() }),
  referenceMarket: z.object({ status: z.enum(['ready', 'pending', 'unavailable']), value: z.number().nullable(), unit: z.string(), asOfAt: timestamp.nullable(), changeValue: z.number().nullable(), changePercent: z.number().nullable(), dataSourceName: z.string().nullable(), dataSourceUrl: httpUrl.nullable(), unavailableReason: z.string().nullable() }).optional(),
})
export const candidatesSchema = z.object({ candidates: z.array(marketSchema.omit({ id: true }).extend({ marketTargetId: id, sortOrder: z.number(), rationale: z.string().nullable().transform(value => value ?? undefined) })) })
export const targetsSchema = z.object({ learningSessionId: id, targets: z.array(z.object({ sessionTargetId: id, marketTargetId: id, isSelected: z.boolean(), sortOrder: z.number().nullable() })) })
export const predictionSchema = z.object({ horizon: z.union([z.literal(1), z.literal(5), z.literal(20)]), direction: z.enum(['up', 'down', 'neutral']).nullable(), reason: z.string().nullable() })
export const predictionsSchema = z.object({ sessionTargetId: id, predictions: z.array(predictionSchema), updatedAt: timestamp.optional() })
export const submitSchema = z.object({ sessionId: id, status: z.enum(['baseline_pending', 'observing', 'reflection_pending', 'completed']), submittedAt: timestamp })
export const feedbackSummarySchema = z.object({
  id, learningSessionId: id, feedbackStage: z.enum(['initial', 'final']),
  status: z.enum(['pending', 'generating', 'ready', 'failed']), isLatest: z.boolean(), version: z.number(),
  failureCode: z.string().nullable(), generatedAt: timestamp.nullable(),
  flowSummary: z.string().nullable(), insufficientEvidence: z.boolean(), inputCutoffAt: timestamp,
})
export const feedbackListSchema = z.array(feedbackSummarySchema)
export const feedbackSchema = feedbackSummarySchema.extend({
  targetFeedbacks: z.array(z.object({ sessionTargetId: id, items: z.array(z.object({ id, type: z.string(), content: z.string(), referenceIds: z.array(id), sortOrder: z.number() })) })),
  references: z.array(z.object({ id, sourceDocumentId: id, chunkId: id, title: z.string(), publisher: z.string(), publishedAt: timestamp, url: httpUrl, citationLabel: z.string(), citationExcerpt: z.string(), usageContext: z.string(), contentHash: z.string() })),
})
const outcomeStatus = z.enum(['pending', 'ready', 'unavailable'])
export const baselineSchema = z.object({
  status: outcomeStatus, baselineValue: z.number().nullable(), baselineAt: timestamp.nullable(),
  baselineSessionDate: z.string().nullable(), unit: z.string(), dataSourceName: z.string().nullable(),
  dataSourceUrl: httpUrl.nullable(), unavailableReason: z.string().nullable(),
  expectedBaselineDate: z.string().nullable(), baselineDeadlineDate: z.string().nullable(),
})
export const observationSchema = z.object({
  horizon: predictionSchema.shape.horizon, status: outcomeStatus, exceptionStatus: z.string(),
  observedValue: z.number().nullable(), observedAt: timestamp.nullable(), unit: z.string(),
  unavailableReason: z.string().nullable(), expectedObservationDate: z.string().nullable(),
  observationSessionDate: z.string().nullable(), observationDeadlineDate: z.string().nullable(),
  observationDelaySessions: z.number(), changeValue: z.number().nullable(), changePercent: z.number().nullable(),
  dataSourceName: z.string().nullable(), dataSourceUrl: httpUrl.nullable(), usableForAiEvidence: z.boolean(),
})
export const outcomesSchema = z.object({ learningSessionId: id, targets: z.array(z.object({
  sessionTargetId: id, marketTargetId: id, baseline: baselineSchema, observations: z.array(observationSchema),
})) })
export const noteSchema = z.object({ id, learningSessionId: id.optional(), sessionTargetId: id.nullable(),
  reflectionType: z.enum(['day_1', 'day_5', 'final', 'replay_final']), promptKey: z.string(), body: z.string(),
  createdAt: timestamp, submissionId: id.optional(), clientRequestId: id.optional(),
})
export const notesSchema = z.array(noteSchema)
export const seriesSchema = z.object({ learningSessionId: id, sessionTargetId: id, marketTargetId: id,
  series: z.array(z.object({ tradingDate: z.string(), closeValue: z.number(), unit: z.string(), dataSourceName: z.string(), dataSourceUrl: httpUrl.nullable() })),
})
export const eventsSchema = z.array(z.object({ id, sessionTargetId: id, horizon: z.number().nullable(),
  eventType: z.string(), occurredAt: timestamp, detail: z.string().nullable(), dataSourceName: z.string().nullable(), dataSourceUrl: httpUrl.nullable(), createdAt: timestamp,
}))
export const finalReflectionSchema = z.object({ submissionId: id, clientRequestId: id,
  notes: notesSchema, sessionStatus: z.literal('completed'), completedAt: timestamp,
})
export type ReflectionRequest = { clientRequestId: string; reflectionType: 'day_1' | 'day_5' | 'final'; sessionTargetId?: string; promptKey?: string; body?: string; answers?: { promptKey: 'learned' | 'missed_variable' | 'next_check'; body: string }[] }
export type SeriesDto = z.infer<typeof seriesSchema>
export type ObservationDto = z.infer<typeof observationSchema>
export type SessionDto = z.infer<typeof sessionSchema>
export type MarketDto = z.infer<typeof marketSchema>
export type SessionTargetDto = z.infer<typeof targetsSchema>['targets'][number]
export type FeedbackDto = z.infer<typeof feedbackSchema>
export type OutcomesDto = z.infer<typeof outcomesSchema>
export type NoteDto = z.infer<typeof notesSchema>[number]
