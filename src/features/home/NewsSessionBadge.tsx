import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api-client'
import type { NewsSessionLink } from './news-session'

export function NewsSessionBadge({ link }: { link: NewsSessionLink }) {
  if (!link.badge) return null
  return <span className={`inline-flex w-fit items-center rounded-pill px-2.5 py-1 font-sans text-[12px] font-semibold ${link.kind === 'completed' ? 'bg-surface-subtle text-text-secondary' : 'bg-brand-subtle text-brand-primary'}`}>{link.badge}</span>
}

/** 세션 상태 조회 실패 안내. 실패를 '세션 없음'으로 간주하지 않았다는 점과 재시도를 함께 보여준다. 401은 페이지의 로그인 안내에 맡긴다. */
export function SessionStatusError({ error, retry, busy }: { error: Error | null; retry: () => void; busy: boolean }) {
  if (!error || (error instanceof ApiError && error.status === 401)) return null
  return <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card bg-status-error-bg px-5 py-3"><p className="font-sans text-[14px] text-status-error">내 학습 상태를 확인하지 못했어요. 이미 학습한 기사도 새 기사처럼 보일 수 있어요.</p><Button variant="text" loading={busy} onClick={retry}>학습 상태 다시 확인</Button></div>
}
