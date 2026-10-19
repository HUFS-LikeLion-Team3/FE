// Screen examples only. These are not API DTOs or real market observations.
import type { LearningSession, NewsItem } from './api'

export const mockNewsList: NewsItem[] = [
  {
    id: 'policy-rate-001',
    title: '정책금리 동결 발표, 발표문에서 확인할 사실',
    category: 'rate',
    briefing: '결정된 내용과 발표문에 명시된 조건을 살펴보고, 함께 관찰할 시장 지표를 골라보세요.',
    contentType: 'live',
    replayStatus: 'not_eligible',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'employment-001',
    title: '고용 지표 발표: 수치와 비교 기준 살펴보기',
    category: 'employment',
    briefing: '발표된 고용 수치와 기준 시점, 직전 발표와의 비교를 읽습니다.',
    contentType: 'live',
    replayStatus: 'not_eligible',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'energy-001',
    title: '에너지 수급 발표: 공급과 수요의 변화',
    category: 'energy',
    briefing: '공식 발표에 담긴 수급 정보와 확인할 조건을 정리했습니다.',
    contentType: 'live',
    replayStatus: 'not_eligible',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'semiconductor-001',
    title: '반도체 수출 발표: 집계 범위와 기준 시점',
    category: 'semiconductor',
    briefing: '수출 지표의 집계 방식과 비교 기간을 살펴봅니다.',
    contentType: 'live',
    replayStatus: 'not_eligible',
    publishedAt: new Date().toISOString(),
  },
]

export const mockInProgressSession: LearningSession = {
  id: 'session-observing-001',
  newsId: 'policy-rate-001',
  sessionType: 'live',
  status: 'observing',
  submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  completedAt: null,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
}
