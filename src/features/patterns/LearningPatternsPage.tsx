import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import LivePatterns from './LivePatterns'

const PatternPreview = import.meta.env.DEV ? lazy(() => import('./PatternPreview')) : null

export default function LearningPatternsPage() {
  const [params] = useSearchParams()
  if (PatternPreview && params.get('preview') === '1') {
    return <Suspense fallback={<p role="status">학습 패턴 시안을 불러오고 있어요…</p>}><PatternPreview /></Suspense>
  }
  return <LivePatterns />
}
