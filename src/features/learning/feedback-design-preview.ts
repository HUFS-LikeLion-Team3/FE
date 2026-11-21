import type { Draft, FeedbackItem, FeedbackView, Source, Target } from './model'
import type { OutcomesDto, SeriesDto } from './api/contracts'

// DEV-only visual fixtures for Figma page 05. Never used as an HTTP fallback.
const targets: Target[] = [
  { id: 'nasdaq', marketTargetId: 'nasdaq-market', name: 'NASDAQ 100', kind: 'index', targetType: 'stock_index', marketCategory: 'us_equity' },
  { id: 'yield', marketTargetId: 'yield-market', name: '미국 10년물 국채금리', kind: 'rate', targetType: 'yield', marketCategory: 'rate' },
]
const draft: Draft = Object.fromEntries(targets.map(target => [target.id, {
  1: { direction: 'up', reason: target.kind === 'rate' ? '국채 공급이 늘면 장기금리가 오를 것 같아요.' : '기준금리가 오르면 기업이 돈을 더 싸게 빌릴 수 있어 주가가 오를 것 같아요.' },
  5: { direction: 'up', reason: '' }, 20: { direction: 'up', reason: '' },
}]))
const sources: Source[] = [1, 2, 3].map(n => ({ id: `preview-source-${n}`, title: `[0${n}] 디자인 검토용 근거 자료`, publisher: '미리보기 자료', date: '2026. 9. 16.', quote: '출처를 펼쳤을 때 인용 원문과 발행 시각을 확인하는 UI 예시입니다.', url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm' }))
const item = (type: string, title: string, body: string, references = sources): FeedbackItem => ({ type, title, body, sources: references })
const review = {
  nasdaq: "사용자는 상승을 예상했지만, 이번 자료에서는 하락 쪽 판단이 더 설득력 있습니다. 특히 '기준금리가 오르면 기업이 돈을 더 싸게 빌릴 수 있다'는 문장은 방향이 반대인데, 금리 인상은 일반적으로 차입 비용을 낮추기보다 높이는 쪽이라 주가에는 우호적 근거가 되기 어렵습니다. 금리와 주가를 연결하려 한 점 자체는 맞지만, 이번 자료에서는 그 연결이 상승이 아니라 할인율 부담 쪽으로 해석됩니다.",
  yield: "사용자의 상승 방향은 이번 자료와 대체로 같습니다. 다만 적어 준 이유인 '국채 공급이 늘면'은 이번 기사나 승인된 근거에 없는 연결이고, 현재 자료에서 더 직접적인 경로는 정책금리 인상과 물가 우려가 장기금리 기대에 전달된다는 점입니다. 물가와 정책 경로 기대를 장기금리와 연결했더라면 이번 근거와 더 잘 맞았습니다.",
}
function initialItems(target: Target) {
  const rate = target.kind === 'rate'
  return [
    item('initial_market_impact', 'AI의 방향 판단', rate
      ? '이번 발표에서는 단기 상승 쪽에 무게를 둡니다. 연준이 정책금리를 3.75~4.00%로 올리고 물가가 여전히 높아 2% 목표 복귀를 서두르겠다고 밝힌 만큼, 이 자료에서는 향후 단기 금리 경로 기대가 높아지며 미국 10년물 금리에도 상방 압력이 전달될 가능성이 더 큽니다. T5·T20도 같은 상승 판단을 적었는데, 현재 자료만 보면 적어도 방향 자체는 단기와 크게 어긋나지 않습니다.'
      : '이번 발표에서는 단기 하락 쪽에 무게를 둡니다. 연준이 정책금리를 0.25%p 인상하고 물가가 여전히 높다고 강조한 만큼, 이 자료에서는 할인율 상승 압력이 NASDAQ 100에 먼저 부담을 줄 가능성이 더 커 보입니다. T5·T20도 같은 상승 판단을 적었지만, 현재 근거만으로는 금리 인상 직후의 밸류에이션 부담을 뒤집을 추가 재료가 확인되지 않아 같은 방향 연장은 설득력이 약합니다.'),
    item('initial_prediction_review', '내 예측 근거 평가', rate ? review.yield : review.nasdaq),
    item('initial_counter_scenario', '반대 시나리오', rate
      ? '기본 판단이 바뀌려면 이번 인상이 향후 경기 둔화 신호로 더 강하게 읽혀 장기 성장·물가 기대가 함께 낮아져야 합니다. 그러면 정책금리 인상에도 불구하고 미국 10년물 금리는 되레 하락하는 해석이 더 강해질 수 있습니다.'
      : '기본 판단이 바뀌려면 이번 인상이 추가 긴축의 신호가 아니라 거의 마무리 신호로 받아들여져 장기 할인율 기대가 오히려 완화돼야 합니다. 또는 금리 부담보다 이익 기대와 위험 프리미엄 개선이 더 크게 작동한다는 근거가 함께 나와야 NASDAQ 100의 상방 해석이 강해집니다.'),
  ]
}
function finalItems(target: Target) {
  const rate = target.kind === 'rate'
  return [
    item('final_observed_flow', '관찰된 흐름', rate
      ? '결과: 미국 10년물 금리는 기준값 5.01%에서 T1 4.94%로 0.07%p 내렸습니다. T5는 5.11%, T20은 5.10%로 기준보다 각각 0.10%p, 0.09%p 높았습니다.\n\n단기에는 하락했지만 뒤의 두 구간에서는 기준보다 높은 금리가 관찰됐습니다.'
      : '결과: NASDAQ 100은 기준값 28,945.06에서 T1 29,446.98로 501.92포인트, 1.73% 올랐고, T5에는 30,470.29로 1,525.23포인트, 5.27% 상승했습니다.\n\nT20에도 29,950.82로 기준 대비 1,005.76포인트, 3.47% 높았습니다. 세 구간 모두 기준 대비 상승했지만, T5까지 더 크게 오른 뒤 T20에는 일부 되돌림이 있었습니다.', []),
    item('final_market_explanation', '실제 변동의 배경', 'AI 해석: 정책금리 결정만으로 이후 가격을 모두 설명하기는 어렵습니다. 당시 함께 관찰된 장기금리와 위험 선호의 변화도 살펴볼 수 있습니다.\n\n근거: 발표 직후와 이후 기간의 자료는 서로 다른 시점의 정보를 보여줍니다. 해당 시점까지 공개된 출처를 구분해 읽어야 합니다.\n\n핵심 개념: 기본 압력과 실제 반응은 다를 수 있어요. 할인율이나 정책 경로가 주는 압력과, 다른 동시기 요인이 합쳐진 관측 결과를 나누어 살펴보세요.'),
    item('final_prediction_review', '예측 결과와 근거 평가', rate
      ? "결과: T1의 상승 예상과 달리 금리는 하락했습니다. T5·T20에는 기준보다 높은 금리가 관찰됐습니다.\n\n이유: '국채 공급이 늘면'이라는 설명은 이번 근거에서 직접 확인하지 못했습니다. 방향과 별개로 정책 경로와 장기금리의 연결을 더 확인해야 합니다.\n\n적용: 같은 방향이 관찰됐더라도 그 이유가 입증된 것은 아닙니다. 다음에는 자료에서 확인한 사실과 내 가설을 나누어 남겨보세요."
      : "결과: 방향 자체는 T1·T5·T20 모두 실제와 맞았습니다. 다만 T1에 적은 이유인 '기준금리가 오르면 기업이 돈을 더 싸게 빌릴 수 있어 주가가 오를 것'은 경제 연결이 반대로 서 있습니다.\n\n이유: 금리 인상은 일반적으로 차입 비용과 할인율을 높이는 경로로 작동합니다. 방향이 같았다는 사실과 그 이유가 맞았는지는 구분해야 합니다.\n\n적용: 기본 압력과 실제 반응을 나누어 살펴보세요. T5·T20은 이유를 적지 않았으므로 관측된 결과와 방향만 비교할 수 있습니다."),
    item('final_takeaway', '이번 사례에서 배운 점', '단기와 이후의 변화를 구분하고, 방향을 맞혔는지보다 어떤 사실과 이유를 연결했는지 돌아보세요.\n\n다음에는 다른 시나리오가 나타날 조건과 확인할 지표의 발표 시점도 함께 적어보세요.'),
  ]
}
const dates = ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13', '2026-10-14']
// Figma's anchor values; intermediate points are explicitly synthetic visual data.
const anchors = { nasdaq: [28945.06, 29446.98, 30470.29, 29950.82], yield: [5.01, 4.94, 5.11, 5.10] }
export function feedbackDesignPreview(final: boolean): FeedbackView {
  const outcomes: OutcomesDto = { learningSessionId: 'preview-session', targets: [] }
  const marketSeries: Record<string, SeriesDto> = {}
  for (const target of targets) {
    const values = anchors[target.id as keyof typeof anchors]
    const unit = target.kind === 'rate' ? '%' : 'pt'
    const observations = ([1, 5, 20] as const).map((horizon, i) => ({ horizon, status: 'ready' as const, exceptionStatus: 'normal', observedValue: values[i + 1], observedAt: `${dates[horizon]}T20:00:00Z`, unit, unavailableReason: null, expectedObservationDate: dates[horizon], observationSessionDate: dates[horizon], observationDeadlineDate: dates[horizon], observationDelaySessions: 0, changeValue: +(values[i + 1] - values[0]).toFixed(8), changePercent: target.kind === 'rate' ? null : (values[i + 1] - values[0]) / values[0] * 100, dataSourceName: '디자인 검토용 예시', dataSourceUrl: null, usableForAiEvidence: false }))
    outcomes.targets.push({ sessionTargetId: target.id, marketTargetId: target.marketTargetId!, baseline: { status: 'ready', baselineValue: values[0], baselineAt: `${dates[0]}T20:00:00Z`, baselineSessionDate: dates[0], unit, dataSourceName: '디자인 검토용 예시', dataSourceUrl: null, unavailableReason: null, expectedBaselineDate: dates[0], baselineDeadlineDate: dates[0] }, observations })
    const checkpoints = [0, 1, 5, 20]
    marketSeries[target.id] = { learningSessionId: 'preview-session', sessionTargetId: target.id, marketTargetId: target.marketTargetId!, series: dates.map((tradingDate, i) => {
      const segment = Math.min(checkpoints.findIndex(point => point >= i), 3)
      const left = Math.max(segment - 1, 0), right = segment
      const progress = right === left ? 0 : (i - checkpoints[left]) / (checkpoints[right] - checkpoints[left])
      return { tradingDate, closeValue: values[left] + (values[right] - values[left]) * progress, unit, dataSourceName: '디자인 검토용 예시', dataSourceUrl: null }
    }) }
  }
  return { sessionId: 'preview-session', targets, draft, observation: final ? 'completed' : 'baseline_pending', reflection: '발표 내용뿐 아니라 미리 형성된 기대도 함께 확인해야겠다고 느꼈어요.', reflectionSavedAt: '2026. 10. 15. 10:30', generatedAt: final ? '2026. 11. 3. 15:23' : '2026. 11. 2. 13:52', inputCutoffAt: final ? '2026. 10. 15. 08:00' : '2026. 9. 17. 03:05', sessionItems: [item('flow_summary', '판단 흐름 요약', '사용자는 NASDAQ 100과 미국 10년물 국채금리 모두 T1·T5·T20 상승을 예상했습니다. 근거를 적은 단기 이유는 각각 금리 인상이 차입 비용을 낮춘다는 해석과, 국채 공급 증가가 장기금리를 올릴 것이라는 해석입니다.', []), ...(!final ? [item('news_analysis', '뉴스 핵심 해설', '이번 자료에서는 정책금리 인상과 물가 안정 의지가 함께 확인됐고, 단기적으로는 주식의 할인율 부담과 장기금리의 정책 경로 기대를 나누어 살펴볼 수 있습니다.', [])] : [])], items: Object.fromEntries(targets.map(target => [target.id, final ? finalItems(target) : initialItems(target)])), ...(final ? { outcomes, marketSeries, observationRecords: Object.fromEntries(outcomes.targets.map(target => [target.sessionTargetId, target.observations.map(o => ({ horizon: o.horizon, status: o.status, text: `${o.observedValue} ${o.unit} · ${o.observationSessionDate}` }))])), midNotes: { nasdaq: ['1거래일 메모 · 다른 동시기 요인도 함께 확인해 봐야겠어요.'], yield: [] } } : {}) }
}
