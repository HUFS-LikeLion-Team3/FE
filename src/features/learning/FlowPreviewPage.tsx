import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { PageTitle, Shell, Notice, linkClass } from './components/PagePrimitives'
import { demoSessionIds } from './api/unfinished-mock'

if (import.meta.env.DEV) sessionStorage.setItem('finsight.devMockLearning', 'true')

export default function FlowPreviewPage() {
  return <Shell><PageTitle label="DEV / LEARNING FLOW" title="학습 흐름 검증" description="실제 서버에 저장하지 않는 개발용 데이터입니다. 새로고침하면 초기화됩니다." /><Notice title="명시적인 목 모드">실제 API 실패를 목 성공으로 바꾸지 않습니다. 기존 UI 미리보기와 신규 학습 흐름을 검토할 수 있어요.</Notice><div className="flex flex-col items-start gap-3"><Link to="/news/f1000000-0000-4000-8000-000000000099/predict" className={linkClass}>대상 선택부터 새 학습</Link><Link to={`/learning/${demoSessionIds.observing}/results`} className={linkClass}>부분 관측 완료·중간 메모</Link><Link to={`/learning/${demoSessionIds.pending}/results`} className={linkClass}>기준값·관측 대기</Link><Link to={`/learning/${demoSessionIds.unavailable}/results`} className={linkClass}>관측 불가·회고 가능</Link><Link to={`/learning/${demoSessionIds.reflection}/reflection`} className={linkClass}>최종 회고 입력</Link><Link to={`/learning/${demoSessionIds.completed}`} className={linkClass}>완료 타임라인·AI 생성 실패</Link><Link to="/settings/interests" className={linkClass}>관심 설정 변경</Link></div><Button variant="secondary" onClick={() => { sessionStorage.removeItem('finsight.devMockLearning'); window.location.assign('/login') }}>실제 API 모드로 돌아가기</Button></Shell>
}
