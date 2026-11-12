import { z } from 'zod'
import { parseResponse } from '@/lib/api-client'

/**
 * 지난 뉴스 Replay 데이터 계약.
 * Replay 전용 API는 아직 확정되지 않았다. 아래 스키마와 함수 시그니처는 연결 시 교체할 자리이며,
 * 서버 경로를 가정하지 않는다.
 *
 * P1 기획 조건: 결과 공개 전에는 과거 실제 수치·결과 그래프·사후 보도를 노출하지 않는다.
 * 그래서 이 스키마에는 결과값·시계열·원문 URL 필드를 두지 않는다.
 * zod는 정의하지 않은 키를 제거하므로 서버 응답에 그런 필드가 섞여도 화면에 전달되지 않는다.
 */
export const replayCategoryKeys = ['rate_policy', 'price', 'employment', 'fx_export', 'energy', 'semiconductor'] as const
export type ReplayCategoryKey = typeof replayCategoryKeys[number]

export const replayCategories: { key: ReplayCategoryKey; label: string }[] = [
  { key: 'rate_policy', label: '금리·통화정책' },
  { key: 'price', label: '물가' },
  { key: 'employment', label: '고용·경기' },
  { key: 'fx_export', label: '환율·수출' },
  { key: 'energy', label: '에너지·원자재' },
  { key: 'semiconductor', label: '반도체 업황' },
]

export const replayScenarioSchema = z.object({
  id: z.string(),
  category: z.enum(replayCategoryKeys),
  title: z.string(),
  /** 'YYYY-MM' */
  referenceMonth: z.string(),
  /** 사실 브리핑 항목. 결과가 드러나는 내용은 넣지 않는다. */
  facts: z.array(z.string()),
  /** 출처 안내 문구. 링크가 아니라 텍스트만 표시한다. */
  sourceNote: z.string(),
})
export type ReplayScenario = z.infer<typeof replayScenarioSchema>

/**
 * 개발 환경에서만 목 데이터를 사용한다. 배포 빌드에서는 이 분기가 제거되어 fixtures가 번들에 포함되지 않는다.
 * 화면은 `replayAvailable`이 false이면 이 함수를 호출하지 않고 준비 중 안내만 보여준다.
 */
export const replayAvailable = import.meta.env.DEV

export async function getReplayScenarios(signal?: AbortSignal): Promise<ReplayScenario[]> {
  if (import.meta.env.DEV) {
    const { replayFixtures } = await import('./fixtures')
    signal?.throwIfAborted()
    return parseResponse(z.array(replayScenarioSchema), replayFixtures)
  }
  // TODO: Replay API 명세 확정 후 requestLearningData로 교체한다.
  throw new Error('Replay API가 아직 연결되지 않았어요.')
}
