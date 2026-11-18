import { lazy, Suspense } from 'react'
import { Notice, PageTitle, Shell } from '../learning/components/PagePrimitives'

const ReplayWorkspace = import.meta.env.DEV ? lazy(() => import('./ReplayWorkspace')) : null
export default function ReplayPage() {
  return ReplayWorkspace ? <Suspense fallback={<p role="status">지난 뉴스를 불러오는 중…</p>}><ReplayWorkspace /></Suspense>
    : <Shell section="/explore"><PageTitle label="REPLAY / LIBRARY" title="지난 뉴스로, 한 번의 학습을 경험하다" description="발표 당시의 사실에서 시작해 예측하고, 공개된 과거 결과와 함께 돌아보세요." /><Notice title="Replay는 준비 중이에요">지난 뉴스 학습은 API 연결이 준비되면 이용할 수 있어요.</Notice></Shell>
}
