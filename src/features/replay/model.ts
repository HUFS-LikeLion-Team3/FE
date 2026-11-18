import type { Draft, Target } from '../learning/model'
import type { OutcomesDto, SeriesDto } from '../learning/api/contracts'

// FE view contract only. Replay HTTP paths and payloads are not agreed yet.
export const replayPrompts = [
  { key: 'learned', label: '배운 점' },
  { key: 'missed_variable', label: '놓친 변수' },
  { key: 'next_check', label: '다음 확인' },
] as const
export type ReplayPrompt = typeof replayPrompts[number]['key']
export type ReplayAnswer = { promptKey: ReplayPrompt; body: string }
export type ReplaySaveRequest = { replayId: string; clientRequestId: string; answers: ReplayAnswer[] }
export type ReplayReceipt = ReplaySaveRequest & { savedAt: string }
export type ReplayData = {
  replayId: string
  sessionId: string
  title: string
  resultsRevealedAt: string | null
  targets: Target[]
  draft: Draft
  outcomes: OutcomesDto
  series: Record<string, SeriesDto | undefined>
  receipt: ReplayReceipt | null
  feedbackHref: string | null
}
export type ReplayState = 'ready' | 'loading' | 'error' | 'locked' | 'unsupported' | 'empty'
export type ReplaySave = (request: ReplaySaveRequest) => Promise<ReplayReceipt>

export function matchesReplayReceipt(receipt: ReplayReceipt, request: ReplaySaveRequest) {
  return receipt.replayId === request.replayId && receipt.clientRequestId === request.clientRequestId
    && !Number.isNaN(Date.parse(receipt.savedAt))
    && receipt.answers.length === request.answers.length
    && request.answers.every(answer => receipt.answers.some(saved => saved.promptKey === answer.promptKey && saved.body === answer.body))
}
