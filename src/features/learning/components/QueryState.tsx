import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api-client'
import { Notice, Shell, linkClass } from './PagePrimitives'

export function QueryState({ error, loading, retry }: { error?: Error | null; loading: boolean; retry: () => void }) {
  return <Shell>{loading ? <Notice title="기록을 불러오고 있어요">잠시만 기다려 주세요.</Notice> : <><Notice title="기록을 불러오지 못했어요" error>{error?.message ?? '잠시 후 다시 확인해 주세요.'}</Notice>{error instanceof ApiError && error.status === 401 ? <Link className={linkClass} to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>로그인하기</Link> : <Button onClick={retry}>다시 불러오기</Button>}</>}</Shell>
}
