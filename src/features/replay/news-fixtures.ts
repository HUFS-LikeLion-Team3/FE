import { replayFixtures } from './fixtures'
import { replayNewsCategories, replayTargets, type ReplayNewsQuery } from './api'

// DEV 전용: fixtures.ts의 시안용 가상 자료를 뉴스 API 응답 모양으로 바꾼다. 실제 뉴스가 아니며 배포 빌드에 포함되지 않는다.
// id는 기존 시나리오 id를 그대로 써서 대상 선택·예측·피드백 데모와 이어지게 한다.
// 서버의 category·from·to·marketTargetId(AND 조건), 발행일 최신순, 페이지 처리를 흉내 낸다.
const news = replayFixtures.map(scenario => ({
  id: scenario.id,
  title: scenario.title,
  category: replayNewsCategories[scenario.category],
  briefing: scenario.facts.join('\n\n'),
  contentType: 'replay' as const,
  publishedAt: `${scenario.referenceMonth}-15T09:00:00+09:00`,
  marketTargetIds: scenario.targetIds
    .map(id => replayTargets.find(target => target.id === id)?.marketTargetId)
    .filter((id): id is string => !!id),
})).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id))

const toResponse = ({ id, title, category, briefing, contentType, publishedAt }: typeof news[number]) => ({ id, title, category, briefing, contentType, publishedAt })
const day = (value: string) => value.slice(0, 10)

export function replayNewsFixturePage(query: ReplayNewsQuery, page: number, size: number) {
  const matched = news.filter(item => (!query.category || item.category === query.category)
    && (!query.from || day(item.publishedAt) >= query.from)
    && (!query.to || day(item.publishedAt) <= query.to)
    && (!query.marketTargetId || item.marketTargetIds.includes(query.marketTargetId)))
  return {
    content: matched.slice(page * size, (page + 1) * size).map(toResponse),
    page, size, totalElements: matched.length, hasNext: (page + 1) * size < matched.length,
  }
}

export function replayNewsFixture(id: string) {
  const item = news.find(entry => entry.id === id)
  return item ? toResponse(item) : undefined
}
