import { z } from 'zod'
import { parseResponse } from '@/lib/api-client'
import type { Target } from '../learning/model'

// FE display model only. No Replay HTTP endpoint has been agreed.
export const replayCategoryKeys = ['rate_policy', 'price', 'employment', 'fx_export', 'energy', 'semiconductor'] as const
export type ReplayCategoryKey = typeof replayCategoryKeys[number]
export const replayCategories = [
  { key: 'rate_policy', label: '금리·통화정책' }, { key: 'price', label: '물가' },
  { key: 'employment', label: '고용·경기' }, { key: 'fx_export', label: '환율·수출' },
  { key: 'energy', label: '에너지·원자재' }, { key: 'semiconductor', label: '반도체 업황' },
] satisfies { key: ReplayCategoryKey; label: string }[]
export const replayTargetIds = ['dollar', 'yield', 'nasdaq'] as const
export const replayTargets: Target[] = [
  { id: 'dollar', marketTargetId: 'dollar-market', name: '달러 인덱스', kind: 'index' },
  { id: 'yield', marketTargetId: 'yield-market', name: '미국 10년물', kind: 'rate' },
  { id: 'nasdaq', marketTargetId: 'nasdaq-market', name: 'NASDAQ 100', kind: 'index' },
]
export const replayScenarioSchema = z.object({
  id: z.string().min(1), category: z.enum(replayCategoryKeys), title: z.string().min(1),
  referenceMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  keywords: z.string(), summary: z.string(),
  facts: z.array(z.string()).min(1), announcement: z.string().nullable(),
  sourceNote: z.string(), targetIds: z.array(z.enum(replayTargetIds)).min(1).max(3),
})
export type ReplayScenario = z.infer<typeof replayScenarioSchema>
export const replayAvailable = import.meta.env.DEV
export async function getReplayScenarios(signal?: AbortSignal): Promise<ReplayScenario[]> {
  if (import.meta.env.DEV) {
    const { replayFixtures } = await import('./fixtures')
    signal?.throwIfAborted()
    return parseResponse(z.array(replayScenarioSchema), replayFixtures)
  }
  throw new Error('Replay API가 아직 연결되지 않았어요.')
}

export function formatReferenceMonth(value: string) {
  const [year, month] = value.split('-')
  return year + '년 ' + Number(month) + '월'
}
