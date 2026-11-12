import type { ReplayScenario } from './api'

// 개발 환경 전용 화면 예시이며 API 응답이나 실제 시장 관측값이 아니다. 배포 빌드에는 포함되지 않는다.
// 결과 공개 전 화면이므로 과거 실제 수치·결과·사후 보도를 넣지 않는다.
export const replayFixtures: ReplayScenario[] = [
  // 디자인(Figma PNG)에 있는 시나리오
  {
    id: 'replay-rate-policy',
    category: 'rate_policy',
    title: '미국 기준금리 동결 이후, 시장은 무엇을 더 주목했을까요?',
    referenceMonth: '2025-06',
    facts: [
      '연준은 정책금리를 유지했습니다.',
      '발표문은 이후 물가와 고용 지표를 함께 고려하겠다고 밝혔습니다.',
      '시장은 향후 금리 경로와 경기 흐름을 다시 점검하게 됐습니다.',
    ],
    sourceNote: '연준 발표문 · 기사 원문',
  },

  // 가안 - 팀 확인 필요: 아래 5건의 제목·브리핑·출처 문구·기준 월은 디자인에 없어 임의로 작성한 가안이다.
  // 기준 월도 실제 사건과 무관한 자리표시자다. 숫자·결과는 넣지 않았다.
  {
    id: 'replay-price',
    category: 'price',
    title: '물가 지표 발표 이후, 시장은 어떤 항목을 더 살폈을까요?',
    referenceMonth: '2025-05',
    facts: [
      '통계 당국이 월간 소비자물가 지표를 발표했습니다.',
      '발표 자료는 품목별 변화와 비교 기간을 함께 안내했습니다.',
      '발표 시점에 알려진 정보만으로 영향 대상을 골라 예측합니다.',
    ],
    sourceNote: '통계 발표 자료 · 기사 원문',
  },
  {
    id: 'replay-employment',
    category: 'employment',
    title: '고용 지표 발표 이후, 시장은 무엇을 먼저 확인했을까요?',
    referenceMonth: '2025-04',
    facts: [
      '고용 지표가 발표됐습니다.',
      '발표 자료는 집계 기준 시점과 직전 발표와의 비교 방식을 설명했습니다.',
      '발표 시점에 알려진 정보만으로 영향 대상을 골라 예측합니다.',
    ],
    sourceNote: '고용 통계 발표 자료 · 기사 원문',
  },
  {
    id: 'replay-fx-export',
    category: 'fx_export',
    title: '수출 지표 발표 이후, 환율 시장은 무엇을 함께 살폈을까요?',
    referenceMonth: '2025-03',
    facts: [
      '수출 지표가 발표됐습니다.',
      '발표 자료는 집계 범위와 비교 기간을 함께 안내했습니다.',
      '발표 시점에 알려진 정보만으로 영향 대상을 골라 예측합니다.',
    ],
    sourceNote: '수출입 통계 발표 자료 · 기사 원문',
  },
  {
    id: 'replay-energy',
    category: 'energy',
    title: '에너지 수급 발표 이후, 시장은 무엇에 주목했을까요?',
    referenceMonth: '2025-02',
    facts: [
      '에너지 수급 현황이 발표됐습니다.',
      '발표 자료는 공급과 수요 항목을 나누어 설명했습니다.',
      '발표 시점에 알려진 정보만으로 영향 대상을 골라 예측합니다.',
    ],
    sourceNote: '에너지 수급 발표 자료 · 기사 원문',
  },
  {
    id: 'replay-semiconductor',
    category: 'semiconductor',
    title: '반도체 업황 발표 이후, 시장은 무엇을 더 살폈을까요?',
    referenceMonth: '2025-01',
    facts: [
      '반도체 업황 관련 지표가 발표됐습니다.',
      '발표 자료는 집계 방식과 비교 기간을 함께 설명했습니다.',
      '발표 시점에 알려진 정보만으로 영향 대상을 골라 예측합니다.',
    ],
    sourceNote: '업황 발표 자료 · 기사 원문',
  },
]
