import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginWithKakao } from './api'

/**
 * 카카오 OAuth 콜백 페이지.
 * /auth/kakao/callback?code=... 로 리다이렉트되면 인가코드를 서버에 전송하고
 * 성공 시 홈으로, 실패 시 로그인 페이지로 이동합니다.
 */
export default function KakaoCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      navigate('/login?error=kakao_denied', { replace: true })
      return
    }

    loginWithKakao(code)
      .then((data) => {
        // 신규 가입자는 온보딩, 기존 회원은 홈으로 이동
        const next = data.user.onboardingCompleted ? '/' : '/onboarding'
        navigate(next, { replace: true })
      })
      .catch(() => navigate('/login?error=auth_failed', { replace: true }))
  }, [params, navigate])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p role="status" className="text-control text-text-secondary">
        로그인 중…
      </p>
    </main>
  )
}
