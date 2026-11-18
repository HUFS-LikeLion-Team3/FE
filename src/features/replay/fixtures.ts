import type { ReplayScenario } from './api'

// Editable design examples only. These are fictional learning materials, not real news.
const examples = [
  { category: 'rate_policy', titles: ['정책금리 동결 발표', '정책 결정문과 시장 기대', '통화정책 발표에서 볼 질문'], keywords: '정책 결정과 기대를 나누어 읽기', summary: '정책 결정문에 담긴 사실과 향후 확인할 요소를 살펴봅니다.', facts: ['동결은 정책금리를 유지했다는 사실이에요. 이 결정과 시장이 미리 예상한 내용을 구분해서 읽어보세요. 발표 이후의 가격·금리 변화는 아직 보여주지 않아요.', '정책금리와 장기금리는 서로 다른 지표입니다. 시장 기대·위험 선호·다른 동시기 요인을 함께 살펴볼 질문으로 남겨보세요.'], targetIds: ['dollar', 'yield'], announcement: '정책금리 3.50% → 3.50% · 동결' },
  { category: 'price', titles: ['물가 지표 발표를 읽는 관점', '품목별 물가와 비교 기준', '물가 발표에서 구분할 정보'], keywords: '소비자물가 · 기저효과', summary: '발표 수치의 비교 기준과 지표의 구성 요소를 살펴봅니다.', facts: ['가상의 월간 소비자물가 발표를 살펴보는 학습 자료예요. 집계 대상과 비교 기간을 구분해 읽어보세요.', '전체 지표와 품목별 변화를 나누고 기저효과와 당시 정책 기대를 함께 확인할 질문으로 남겨보세요.'], targetIds: ['yield', 'nasdaq'], announcement: null },
  { category: 'employment', titles: ['고용 지표에서 확인할 정보', '고용과 임금의 관계', '경제활동 지표 읽기'], keywords: '고용 · 임금 · 경제활동', summary: '고용·임금 지표가 각각 보여주는 정보를 구분합니다.', facts: ['가상의 고용 통계 발표를 읽는 학습 자료예요. 취업자와 임금의 집계 범위 및 기준 기간을 구분해 보세요.', '고용과 임금이 함께 움직인다고 가정하기 전에 당시 발표에서 확인한 사실과 추가로 필요한 자료를 나누어 남겨보세요.'], targetIds: ['dollar', 'yield', 'nasdaq'], announcement: null },
  { category: 'fx_export', titles: ['수출 통계와 환율의 관계', '수출입 발표에서 볼 질문', '수출과 수요를 구분해 읽기'], keywords: '수출 · 환율 · 수요', summary: '수출 통계에 담긴 사실과 환율을 함께 살펴볼 질문을 정리합니다.', facts: ['가상의 수출 통계 발표를 읽는 학습 자료예요. 집계 기간과 수출 물량·금액의 차이를 구분해 보세요.', '수출 발표의 사실과 환율에 대한 내 가설을 나누고, 상대국 수요와 다른 동시기 요인을 추가로 확인해 보세요.'], targetIds: ['dollar'], announcement: null },
  { category: 'energy', titles: ['원유 공급 발표를 읽는 방법', '공급 계획과 실제 공급', '에너지 수요와 재고 읽기'], keywords: '공급 계획 · 수요 · 재고', summary: '공급 발표와 시장 수급에 영향을 줄 수 있는 요소를 구분합니다.', facts: ['가상의 원유 공급 계획 발표를 읽는 학습 자료예요. 계획과 실제 공급을 구분하고 발표 당시 확인된 범위를 살펴보세요.', '공급 외에도 수요와 재고, 통화정책 기대를 확인할 질문으로 남겨보세요.'], targetIds: ['dollar', 'yield'], announcement: null },
  { category: 'semiconductor', titles: ['반도체 실적 발표에서 볼 항목', '반도체 재고와 수요', '실적과 시장 기대 구분하기'], keywords: '매출 · 재고 · 수요', summary: '실적 발표의 주요 항목과 시장 기대를 구분해 읽습니다.', facts: ['가상의 반도체 실적 발표를 읽는 학습 자료예요. 매출과 재고가 각각 보여주는 정보를 구분해 보세요.', '발표된 실적과 향후 수요 전망을 구분하고, 당시 시장이 기대한 내용과의 차이를 살펴볼 질문으로 남겨보세요.'], targetIds: ['nasdaq'], announcement: null },
] satisfies (Omit<ReplayScenario, 'id' | 'referenceMonth' | 'title' | 'sourceNote'> & { titles: string[] })[]

export const replayFixtures: ReplayScenario[] = [0, 1, 2].flatMap(round => examples.map((example, index) => {
  const totalMonth = 2025 * 12 + 2 - index - round * 6
  return { ...example, id: `replay-${example.category}-${round + 1}`, title: example.titles[round],
    referenceMonth: `${Math.floor(totalMonth / 12)}-${String(totalMonth % 12 + 1).padStart(2, '0')}`,
    sourceNote: '가상 발표 자료 (시안용 학습 예시)' }
}))
