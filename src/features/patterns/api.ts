import { z } from 'zod'
import { request } from '@/lib/api-client'

const count = z.number().int().nonnegative()
const directionCounts = z.object({ up: count, down: count, neutral: count })
const category = z.object({
  category: z.string(), categoryName: z.string(), sessionCount: count, predictionCount: count, directionCounts,
})
const categories = z.object({ totalSessions: count, totalPredictions: count, categories: z.array(category) })
const daysByHorizon = { T1: 1, T5: 5, T20: 20 } as const
const horizon = z.object({
  horizon: z.enum(['T1', 'T5', 'T20']), tradingDays: count, predictionCount: count, directionCounts,
}).refine(item => daysByHorizon[item.horizon] === item.tradingDays)
const horizons = z.object({ totalPredictions: count, horizons: z.array(horizon).length(3) })
  .refine(data => new Set(data.horizons.map(item => item.horizon)).size === 3)

const examples = z.array(z.string()).max(3)
const variable = z.object({
  variable: z.string(), variableName: z.string(), mentionCount: count, exampleTexts: examples,
})
const reasons = z.object({
  analyzedPredictionCount: count, analyzedReflectionCount: count,
  consideredVariables: z.array(variable), missedVariables: z.array(variable),
})
const suggestions = z.object({
  insufficientData: z.boolean(),
  suggestions: z.array(z.object({
    suggestionId: z.string(), title: z.string(), description: z.string(), reason: z.string(),
    evidence: z.object({ type: z.enum(['considered_variable', 'missed_variable']), count, exampleTexts: examples }),
  })),
})

const base = '/users/me/patterns'
export const getPatternCategories = (signal?: AbortSignal) => request(`${base}/categories`, categories, { signal })
export const getPatternHorizons = (category?: string, signal?: AbortSignal) =>
  request(`${base}/horizons${category ? `?${new URLSearchParams({ category })}` : ''}`, horizons, { signal })
export const getPatternReasons = (signal?: AbortSignal) => request(`${base}/reasons`, reasons, { signal })
export const getPatternSuggestions = (signal?: AbortSignal) => request(`${base}/suggestions`, suggestions, { signal })
export type DirectionCounts = z.infer<typeof directionCounts>
export type VariablePattern = z.infer<typeof variable>
