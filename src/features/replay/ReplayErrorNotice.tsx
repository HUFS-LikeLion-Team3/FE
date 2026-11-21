import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Notice, linkClass } from '../learning/components/PagePrimitives'
import { replayErrorKind, type ReplayErrorKind } from './api'

type Titles = Record<Exclude<ReplayErrorKind, 'login'>, string>

/** 목록·상세 조회 오류 안내. 401은 로그인으로, 404는 다시 불러오기 없이 children의 이동 버튼만 보여준다. */
export function ReplayErrorNotice({ error, titles, retry, busy = false, children }: { error: Error; titles: Titles; retry?: () => void; busy?: boolean; children?: ReactNode }) {
  const { pathname, search } = useLocation()
  const kind = replayErrorKind(error)
  if (kind === 'login') return <Notice title="로그인이 필요해요" error><p>{error.message}</p><Link to={`/login?returnTo=${encodeURIComponent(pathname + search)}`} className={linkClass}>로그인하기</Link></Notice>
  return <Notice title={titles[kind]} error>
    <p>{kind === 'unsupported' ? '조건을 바꾸거나 잠시 후 다시 확인해 주세요.' : kind === 'notFound' ? '목록에서 다른 지난 뉴스를 선택해 주세요.' : error.message}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {children}
      {retry && kind !== 'notFound' && <Button variant="secondary" loading={busy} onClick={retry}>다시 불러오기</Button>}
    </div>
  </Notice>
}
