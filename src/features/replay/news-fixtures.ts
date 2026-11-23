import { replayFixtures } from './fixtures'
import { replayNewsCategories, replayTargets, type ReplayNewsQuery } from './api'

// DEV 전용: fixtures.ts의 시안용 가상 자료를 뉴스 API 응답 모양으로 바꾼다. 실제 뉴스가 아니며 배포 빌드에 포함되지 않는다.
// id는 기존 시나리오 id를 그대로 써서 대상 선택·예측·피드백 데모와 이어지게 한다.
// 서버 규칙을 흉내 낸다: category·from·to·marketTargetId(AND 조건), Replay 기간 필터는 referenceAt 기준(양 끝 포함), 발행일 최신순.
// referenceAt과 publishedAt을 하루 다르게 두어, 미리보기에서 기간 필터가 referenceAt을 쓰는지 구분할 수 있게 한다.
const news = replayFixtures.map(scenario => ({
  id: scenario.id,
  title: scenario.title,
  category: replayNewsCategories[scenario.category],
  briefing: scenario.facts.join('\n\n'),
  contentType: 'replay' as const,
  referenceAt: `${scenario.referenceMonth}-15T09:00:00+09:00`,
  publishedAt: `${scenario.referenceMonth}-16T09:00:00+09:00`,
  marketTargetIds: scenario.targetIds
    .map(id => replayTargets.find(target => target.id === id)?.marketTargetId)
    .filter((id): id is string => !!id),
})).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id))

const toResponse = ({ id, title, category, briefing, contentType, referenceAt, publishedAt }: typeof news[number]) => ({ id, title, category, briefing, contentType, replayStatus: 'eligible' as const, referenceAt, publishedAt })
// 목 데이터의 시각은 모두 +09:00 표기라 앞 10자리가 서울 기준 날짜다.
const seoulDay = (value: string) => value.slice(0, 10)

export function replayNewsFixturePage(query: ReplayNewsQuery, page: number, size: number) {
  const matched = news.filter(item => (!query.category || item.category === query.category)
    && (!query.from || seoulDay(item.referenceAt) >= query.from)
    && (!query.to || seoulDay(item.referenceAt) <= query.to)
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
