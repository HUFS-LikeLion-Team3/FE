import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api-client'
import { linkClass, Notice, PageTitle, Shell } from './components/PagePrimitives'
import { isFeedbackPreparationFailure } from './model'

type Status = 'checking' | 'pending' | 'generating' | 'failed'
type Lookup = { error: Error | null; checking: boolean; onCheck: () => void }

export function InitialFeedbackLookupError({ error, checking, onCheck }: Lookup) {
  const location = useLocation()
  const loginRequired = error instanceof ApiError && error.status === 401
  const returnTo = encodeURIComponent(location.pathname + location.search)
  return <Notice title={loginRequired ? '로그인이 필요해요' : '피드백 상태를 확인하지 못했어요'} error>
    <p>{error?.message} 다시 확인해도 예측 제출이나 피드백 생성은 반복되지 않아요.</p>
    {loginRequired ? <Link to={`/login?returnTo=${returnTo}`} className={linkClass}>로그인하기</Link> : (
      <Button variant="secondary" disabled={checking} onClick={onCheck}>상태 다시 확인</Button>
    )}
  </Notice>
}

export default function InitialFeedbackStatus({ status, failureCode, error, checking, onCheck }: Lookup & {
  status: Status
  failureCode?: string | null
}) {
  const needsReview = status === 'failed' && isFeedbackPreparationFailure(failureCode)
  const title = {
    checking: '저장된 피드백 상태를 확인하고 있어요',
    pending: 'AI 피드백 생성 대기 중이에요',
    generating: 'AI 피드백을 생성하고 있어요',
    failed: needsReview ? '관리자 확인이 필요해요' : 'AI 피드백을 생성하지 못했어요',
  }[status]
  const description = {
    checking: '저장된 예측과 피드백 상태를 불러오고 있어요.',
    pending: '예측이 저장됐어요. 생성이 시작되면 상태가 자동으로 업데이트돼요.',
    generating: '예측이 저장됐어요. 생성 결과에 검토가 필요한 경우 확인을 거친 뒤 피드백이 표시돼요.',
    failed: needsReview
      ? '피드백 준비 과정에서 문제가 생겨 관리자 확인이 필요해요. 저장된 예측을 다시 제출할 필요는 없어요.'
      : '저장된 예측은 학습 기록에서 확인할 수 있어요. 잠시 후 상태를 다시 확인해 주세요.',
  }[status]

  return <Shell responsive>
    <PageTitle label="AI REVIEW / INITIAL" title="최초 AI 피드백" description="예측을 바탕으로 생성되는 피드백 상태를 확인해 보세요." />
    {error ? <InitialFeedbackLookupError error={error} checking={checking} onCheck={onCheck} /> : (
      <Notice title={title} error={status === 'failed'}>{description}</Notice>
    )}
    <div className="flex flex-wrap gap-2">
      {!error && status !== 'checking' && <Button variant="secondary" disabled={checking} onClick={onCheck}>상태 다시 확인</Button>}
      <Link to="/learning" className={linkClass}>학습 기록 보기</Link>
    </div>
  </Shell>
}
