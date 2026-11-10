import type { OutcomesDto } from '../learning/api/contracts'
import type { ReplayData } from './model'

// Figma examples, not actual market observations. DEV preview import only.
const dates = ['2024-06-12','2024-06-13','2024-06-14','2024-06-17','2024-06-18','2024-06-20','2024-06-21','2024-06-24','2024-06-25','2024-06-26','2024-06-27','2024-06-28','2024-07-01','2024-07-02','2024-07-03','2024-07-05','2024-07-08','2024-07-09','2024-07-10','2024-07-11','2024-07-12']
const values = {
  dollar: [103.50,104.12,104.08,104.20,103.96,103.80,103.90,104.00,103.72,103.60,103.70,103.48,103.59,103.36,103.50,103.24,103.32,103.12,103.23,103.05,103.10],
  yield: [3.95,4.02,4.00,4.04,4.01,3.98,4.00,3.99,3.97,4.00,3.96,3.95,3.97,3.94,3.96,3.93,3.94,3.92,3.94,3.90,3.91],
}
export function replayFixture(scenario: string): ReplayData {
  const targets: ReplayData['targets'] = [{ id:'dollar', marketTargetId:'dollar-market', name:'달러 인덱스', kind:'index' }, { id:'yield', marketTargetId:'yield-market', name:'미국 10년물', kind:'rate' }]
  const outcomes: OutcomesDto = { learningSessionId:'preview-replay-session', targets:targets.map(target => {
    const points = values[target.id as keyof typeof values], unit = target.kind === 'rate' ? '%' : 'pt'
    return { sessionTargetId:target.id, marketTargetId:target.marketTargetId!, baseline:{ status:'ready', baselineValue:points[0], baselineAt:`${dates[0]}T20:00:00Z`, baselineSessionDate:dates[0], unit, dataSourceName:'시안용 예시', dataSourceUrl:null, unavailableReason:null, expectedBaselineDate:dates[0], baselineDeadlineDate:dates[0] }, observations:([1,5,20] as const).map(horizon => {
      const unavailable = scenario === 'unavailable' && horizon === 1
      return { horizon, status:unavailable ? 'unavailable' as const : 'ready' as const, exceptionStatus:'normal', observedValue:unavailable ? null : points[horizon], observedAt:unavailable ? null : `${dates[horizon]}T20:00:00Z`, unit, unavailableReason:unavailable ? '해당 거래일의 자료가 없어 변화량과 그래프를 표시하지 않아요. 다른 기간은 확인하고 통합 회고를 남길 수 있어요.' : null, expectedObservationDate:dates[horizon], observationSessionDate:unavailable ? null : dates[horizon], observationDeadlineDate:dates[horizon], observationDelaySessions:0, changeValue:unavailable ? null : +(points[horizon]-points[0]).toFixed(8), changePercent:unavailable || target.kind==='rate' ? null : (points[horizon]-points[0])/points[0]*100, dataSourceName:'시안용 예시', dataSourceUrl:null, usableForAiEvidence:false }
    }) }
  }) }
  return { replayId:'preview-replay', sessionId:outcomes.learningSessionId, title:'정책금리 동결 발표', resultsRevealedAt:scenario==='locked' ? null : '2026-11-09T09:00:00Z', targets,
    draft:Object.fromEntries(targets.map(target => [target.id,{1:{direction:'up',reason:'정책 기대의 변화가 달러 수요와 장기금리에 영향을 줄 수 있다고 봤어요.'},5:{direction:'neutral',reason:''},20:{direction:'down',reason:''}}])), outcomes:scenario==='missing-outcomes' ? {...outcomes,targets:[]} : outcomes,
    series:Object.fromEntries(targets.map(target=>[target.id, scenario==='missing-series' ? undefined : { learningSessionId:outcomes.learningSessionId, sessionTargetId:target.id, marketTargetId:target.marketTargetId!, series:dates.map((tradingDate,i)=>({tradingDate,closeValue:values[target.id as keyof typeof values][i]+(scenario==='invalid-series' && i===0 ? 1 : 0),unit:target.kind==='rate'?'%':'pt',dataSourceName:'시안용 예시',dataSourceUrl:null})) }])),
    receipt:scenario==='saved'?{replayId:'preview-replay',clientRequestId:'preview-saved-request',savedAt:'2026-11-09T10:00:00Z',answers:[{promptKey:'learned',body:'단기 반응과 20거래일의 흐름이 달랐어요. 발표 사실과 기존 기대를 구분하고, 다른 동시기 요인도 함께 확인해야겠다고 느꼈어요.'}]}:null,
    feedbackHref:'/dev/pages/learning/preview-session/feedback',
  }
}
