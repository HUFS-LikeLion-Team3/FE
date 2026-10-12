import { z } from 'zod'
import { request, setAccessToken } from '@/lib/api-client'

const authResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    displayName: z.string(),
    onboardingCompleted: z.boolean(),
  }),
})

export type AuthResponse = z.infer<typeof authResponseSchema>

/**
 * 카카오 인가코드를 서버에 전송하고 accessToken을 받아 저장합니다.
 * 명세: POST /api/v1/auth/kakao { authorizationCode }
 */
export async function loginWithKakao(code: string): Promise<AuthResponse> {
  const data = await request('/auth/kakao', authResponseSchema, {
    method: 'POST',
    body: { authorizationCode: code },
  })
  setAccessToken(data.accessToken)
  return data
}

/**
 * 카카오 OAuth 인가코드 요청 URL로 리다이렉트합니다.
 * VITE_KAKAO_CLIENT_ID 환경변수가 필요합니다.
 */
export function redirectToKakao() {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID
  const redirectUri = `${window.location.origin}/auth/kakao/callback`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId ?? '',
    redirect_uri: redirectUri,
  })
  window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
}
