import { useEffect } from 'react'
import { matchPath, useLocation } from 'react-router-dom'

// 화면별 브라우저 탭 제목. 위에서부터 먼저 맞는 경로를 쓴다.
const titles: [pattern: string, title: string][] = [
  ['/', '홈'],
  ['/login', '로그인'],
  ['/auth/kakao/callback', '로그인'],
  ['/terms', '서비스 이용약관'],
  ['/privacy', '개인정보 처리방침'],
  ['/onboarding', '관심 설정'],
  ['/settings/interests', '관심 설정'],
  ['/explore', '뉴스 탐색'],
  ['/news/:newsId', '뉴스 상세'],
  ['/news/:newsId/predict', '예측 작성'],
  ['/learning', '학습 기록'],
  ['/learning/:sessionId', '학습 완료 기록'],
  ['/learning/:sessionId/edit', '예측 작성'],
  ['/learning/:sessionId/feedback', '최초 AI 피드백'],
  ['/learning/:sessionId/results', '관측 결과'],
  ['/learning/:sessionId/reflection', '최종 회고'],
  ['/learning/:sessionId/final-feedback', '최종 AI 피드백'],
  ['/replay/*', '지난 뉴스'],
  ['/admin/news', '뉴스 관리'],
]

export function RouteTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const title = titles.find(([pattern]) => matchPath(pattern, pathname))?.[1]
    document.title = title ? `${title} | FinSight` : 'FinSight'
  }, [pathname])
  return null
}
