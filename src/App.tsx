import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Route, RouterProvider, Routes } from 'react-router-dom'

const ResultsPage = lazy(() => import('@/features/learning/ResultsPage'))
const FinalReflectionPage = lazy(() => import('@/features/learning/FinalReflectionPage'))
const CompletedSessionPage = lazy(() => import('@/features/learning/CompletedSessionPage'))
const FlowPreviewPage = import.meta.env.DEV ? lazy(() => import('@/features/learning/FlowPreviewPage')) : null
const AssignedProductPage = lazy(() => import('@/features/learning/AssignedProductPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const KakaoCallbackPage = lazy(() => import('@/features/auth/KakaoCallbackPage'))
const InterestSettingPage = lazy(() => import('@/features/interest/InterestSettingPage'))
const NewsExplorePage = lazy(() => import('@/features/explore/NewsExplorePage'))
const HomePage = lazy(() => import('@/features/home/HomePage'))
const LearningHistoryPage = lazy(() => import('@/features/history/LearningHistoryPage'))
const PolicyPage = lazy(() => import('@/features/auth/PolicyPage'))

const UiPreviewPage = import.meta.env.DEV ? lazy(() => import('@/pages/UiPreviewPage')) : null
const AssignedPreviewApp = import.meta.env.DEV ? lazy(() => import('@/features/learning/AssignedPreviewApp')) : null

const InterestSettingPreviewPage = import.meta.env.DEV ? lazy(() => import('@/features/interest/InterestSettingPreviewPage')) : null
const HomePreviewPage = import.meta.env.DEV ? lazy(() => import('@/features/home/HomePreviewPage')) : null
const LearningHistoryPreviewPage = import.meta.env.DEV ? lazy(() => import('@/features/history/LearningHistoryPreviewPage')) : null

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage />}
      />
      <Route path="/login" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><LoginPage /></Suspense>} />
      <Route path="/auth/kakao/callback" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><KakaoCallbackPage /></Suspense>} />
      <Route path="/settings/interests" element={<InterestSettingPage editing />} />
      <Route path="/onboarding" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><InterestSettingPage /></Suspense>} />
      <Route path="/terms" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><PolicyPage kind="terms" /></Suspense>} />
      <Route path="/privacy" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><PolicyPage kind="privacy" /></Suspense>} />
      <Route path="/explore" element={<NewsExplorePage />} />
      <Route path="/news/:newsId" element={<AssignedProductPage page="news" />} />
      <Route path="/news/:newsId/predict" element={<AssignedProductPage page="prediction" />} />
      <Route path="/learning/:sessionId/edit" element={<AssignedProductPage page="prediction" />} />
      <Route path="/learning" element={<LearningHistoryPage />} />
      <Route path="/learning/:sessionId" element={<CompletedSessionPage />} />
      <Route path="/learning/:sessionId/reflection" element={<FinalReflectionPage />} />
      <Route path="/learning/:sessionId/results" element={<ResultsPage />} />
      <Route path="/learning/:sessionId/feedback" element={<AssignedProductPage page="initial" />} />
      <Route path="/learning/:sessionId/final-feedback" element={<AssignedProductPage page="final" />} />
      {AssignedPreviewApp && <Route path="/dev/pages/*" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><AssignedPreviewApp /></Suspense>} />}
      {UiPreviewPage && <Route path="/dev/ui" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><UiPreviewPage /></Suspense>} />}
      {InterestSettingPreviewPage && <Route path="/dev/onboarding" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><InterestSettingPreviewPage /></Suspense>} />}
      {HomePreviewPage && <Route path="/dev/home" element={<HomePreviewPage />} />}
      {LearningHistoryPreviewPage && <Route path="/dev/learning" element={<LearningHistoryPreviewPage />} />}
      {FlowPreviewPage && <Route path="/dev/flow" element={<FlowPreviewPage />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// A data router enables useBlocker for unsaved prediction navigation.
const router = createBrowserRouter([{ path: '*', element: <AppRoutes /> }])
export default function App() { return <Suspense fallback={<p role="status">불러오는 중…</p>}><RouterProvider router={router} /></Suspense> }
