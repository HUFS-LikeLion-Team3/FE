import { safeLoginReturnPath } from '@/lib/navigation'
import { z } from 'zod'
import { request } from '@/lib/api-client'

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: z.object({
    id: z.string().uuid(),
    displayName: z.string(),
    onboardingCompleted: z.boolean(),
  }),
})

export type AuthResponse = z.infer<typeof authResponseSchema>

// OAuth CSRF 방어용 state를 보관하는 sessionStorage 키
const stateKey = 'finsight.oauthState'

/** 암호학적으로 안전한 랜덤 state 문자열을 생성합니다. */
function createState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 콜백에서 돌아온 state가 요청 시 저장한 값과 일치하는지 검증합니다.
 * 검증 후에는 재사용을 막기 위해 저장된 state를 제거합니다.
 */
export function verifyState(returnedState: string | null): boolean {
  const saved = sessionStorage.getItem(stateKey)
  sessionStorage.removeItem(stateKey)
  return !!saved && !!returnedState && saved === returnedState
}

/**
 * 카카오 인가코드를 서버에 전송하고 로그인 응답을 받습니다.
 * 명세: POST /api/v1/auth/kakao { authorizationCode }
 */
export async function loginWithKakao(code: string): Promise<AuthResponse> {
  return request('/auth/kakao', authResponseSchema, {
    method: 'POST',
    body: { authorizationCode: code },
  })
}

/**
 * 카카오 OAuth 인가코드 요청 URL로 리다이렉트합니다.
 * 요청 전 CSRF 방어용 state를 생성해 sessionStorage에 보관합니다.
 * VITE_KAKAO_CLIENT_ID 환경변수가 필요합니다.
 */
export function redirectToKakao() {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID
  const redirectUri = `${window.location.origin}/auth/kakao/callback`
  const returnTo = new URLSearchParams(window.location.search).get('returnTo')
  if (returnTo) sessionStorage.setItem('finsight.returnTo', safeLoginReturnPath(returnTo))
  else sessionStorage.removeItem('finsight.returnTo')
  const state = createState()
  sessionStorage.setItem(stateKey, state)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId ?? '',
    redirect_uri: redirectUri,
    state,
  })
  window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
}
