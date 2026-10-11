import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NewsDetailPage from './NewsDetailPage'
import FeedbackPage from './FeedbackPage'
import PredictionPage from './PredictionPage'
import type { FeedbackView, NewsView } from './model'
import type { Session } from './session-context'
import { linkClass, Notice, PageTitle, Shell } from './components/PagePrimitives'

type Props = {
  page: 'news' | 'prediction' | 'initial' | 'final'
  feedbackHref?: string; news?: NewsView; feedback?: FeedbackView; session?: Session
  onRetry?: () => Promise<void>; onSave?: () => Promise<void>; onSubmit?: () => Promise<void>
  onStartPrediction?: () => void; onRequestTargetChange?: () => void
}
export default function AssignedProductPage({ page, news, feedback, feedbackHref, session, onRetry, onSave, onSubmit, onStartPrediction, onRequestTargetChange }: Props) {
  const { newsId } = useParams()
  const [loading, setLoading] = useState(false)
  // API integration supplies these view models and actions; no preview fallback.
  const retry = async () => {
    if (!onRetry || loading) return
    setLoading(true)
    try { await onRetry() } catch { /* Keep the failure state available for another retry. */ }
    finally { setLoading(false) }
  }
  if (page === 'news') return <NewsDetailPage data={news ?? null} state={loading ? 'loading' : news ? 'new' : 'unavailable'} onRetry={() => void retry()} onStartPrediction={onStartPrediction ?? (() => {})} />
  if (page === 'prediction') {
    if (news && session?.targets.length && onSave && onSubmit && onRequestTargetChange && feedbackHref) return <PredictionPage news={news} session={session} targets={session.targets} newsHref={`/news/${newsId ?? news.id}`} feedbackHref={feedbackHref} onSave={onSave} onSubmit={onSubmit} onRequestTargetChange={onRequestTargetChange} />
    return <Shell><PageTitle label="WORKBOOK / PREDICTION" title="나의 생각을 기록해 보세요" description="먼저 내 관점으로 예상하고, 제출 후 AI 피드백을 살펴보세요." /><Notice title="작성할 대상 정보를 불러오지 못했어요">뉴스 상세에서 다시 시작해 주세요.</Notice><Link to="/explore" className={linkClass}>뉴스 탐색으로 이동</Link></Shell>
  }
  return <FeedbackPage data={feedback ?? null} final={page === 'final'} onRetry={() => void retry()} />
}
