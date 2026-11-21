import { safeInternalPath } from '@/lib/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginWithKakao, verifyState } from './api'

/**
 * 카카오 OAuth 콜백 페이지.
 * /auth/kakao/callback?code=...&state=... 로 리다이렉트되면
 * 1) state를 검증해 CSRF를 막고,
 * 2) 인가코드를 서버에 전송하고,
 * 3) onboardingCompleted 여부에 따라 홈 또는 온보딩으로 이동합니다.
 * 실패 시 로그인 페이지로 이동합니다.
 */
export default function KakaoCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const called = useRef(false)
  const client = useQueryClient()

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = params.get('code')
    const error = params.get('error')
    const state = params.get('state')

    if (error || !code) {
      navigate('/login?error=kakao_denied', { replace: true })
      return
    }

    // CSRF 방어: 요청 시 저장한 state와 콜백 state가 일치해야 로그인 진행
    if (!verifyState(state)) {
      navigate('/login?error=invalid_state', { replace: true })
      return
    }

    loginWithKakao(code)
      .then((data) => {
        // 신규 가입자는 온보딩, 기존 회원은 홈으로 이동
        client.clear()
        const returnTo = sessionStorage.getItem('finsight.returnTo')
        const next = data.user.onboardingCompleted ? safeInternalPath(returnTo) : '/onboarding'
        if (data.user.onboardingCompleted) sessionStorage.removeItem('finsight.returnTo')
        navigate(next, { replace: true })
      })
      .catch(() => navigate('/login?error=auth_failed', { replace: true }))
  }, [params, navigate, client])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p role="status" className="text-control text-text-secondary">
        로그인 중…
      </p>
    </main>
  )
}
