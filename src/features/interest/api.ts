import { z } from 'zod'
import { request } from '@/lib/api-client'

const interestItemSchema = z.object({
  interestType: z.enum(['market', 'topic']),
  interestKey: z.string(),
})

const interestsResponseSchema = z.object({
  interests: z.array(
    interestItemSchema.extend({ id: z.string().uuid().optional() }),
  ),
})

const onboardingResponseSchema = z.object({
  onboardingCompletedAt: z.string(),
})

export type InterestItem = z.infer<typeof interestItemSchema>

/**
 * 내 관심사 조회
 * GET /api/v1/users/me/interests
 */
export async function getInterests(): Promise<InterestItem[]> {
  const data = await request('/users/me/interests', interestsResponseSchema)
  return data.interests.map(({ interestType, interestKey }) => ({
    interestType,
    interestKey,
  }))
}

/**
 * 관심사 저장 및 수정 (전체 교체)
 * PUT /api/v1/users/me/interests
 */
export async function saveInterests(
  interests: InterestItem[],
): Promise<InterestItem[]> {
  const data = await request('/users/me/interests', interestsResponseSchema, {
    method: 'PUT',
    body: { interests },
  })
  return data.interests.map(({ interestType, interestKey }) => ({
    interestType,
    interestKey,
  }))
}

/**
 * 온보딩 완료 처리
 * PATCH /api/v1/users/me/onboarding
 */
export async function completeOnboarding(): Promise<string> {
  const data = await request(
    '/users/me/onboarding',
    onboardingResponseSchema,
    { method: 'PATCH' },
  )
  return data.onboardingCompletedAt
}
