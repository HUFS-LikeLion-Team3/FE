import { lazy, Suspense } from 'react'
import { ProtectedRoutes, SignInRoute } from '@/features/auth/RouteAccess'
import { createBrowserRouter, Navigate, Route, RouterProvider, Routes } from 'react-router-dom'
import { PageLoading } from '@/features/learning/components/PageLoading'

const ReplayResultsPage = lazy(() => import('@/features/replay/ReplayResultsPage'))
const ReplayPreviewPage = import.meta.env.DEV ? lazy(() => import('@/features/replay/ReplayPreviewPage')) : null

const ResultsPage = lazy(() => import('@/features/learning/ResultsPage'))
const FinalReflectionPage = lazy(() => import('@/features/learning/FinalReflectionPage'))
const CompletedSessionPage = lazy(() => import('@/features/learning/CompletedSessionPage'))
const FlowPreviewPage = import.meta.env.DEV ? lazy(() => import('@/features/learning/FlowPreviewPage')) : null
const AssignedProductPage = lazy(() => import('@/features/learning/AssignedProductPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const KakaoCallbackPage = lazy(() => import('@/features/auth/KakaoCallbackPage'))
const InterestSettingPage = lazy(() => import('@/features/interest/InterestSettingPage'))
const NewsExplorePage = lazy(() => import('@/features/explore/NewsExplorePage'))
const ReplayPage = lazy(() => import('@/features/replay/ReplayPage'))
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
      <Route path="/login" element={<SignInRoute><LoginPage /></SignInRoute>} />
      <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
      <Route path="/terms" element={<PolicyPage kind="terms" />} />
      <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
      {ReplayPreviewPage && <Route path="/dev/replay/preview/results" element={<ReplayPreviewPage />} />}
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings/interests" element={<InterestSettingPage editing />} />
        <Route path="/onboarding" element={<InterestSettingPage />} />
        <Route path="/replay/:replayId/results" element={<ReplayResultsPage />} />
        <Route path="/explore" element={<NewsExplorePage />} />
        <Route path="/replay/*" element={<ReplayPage />} />
        <Route path="/news/:newsId" element={<AssignedProductPage page="news" />} />
        <Route path="/news/:newsId/predict" element={<AssignedProductPage page="prediction" />} />
        <Route path="/learning/:sessionId/edit" element={<AssignedProductPage page="prediction" />} />
        <Route path="/learning" element={<LearningHistoryPage />} />
        <Route path="/learning/:sessionId" element={<CompletedSessionPage />} />
        <Route path="/learning/:sessionId/reflection" element={<FinalReflectionPage />} />
        <Route path="/learning/:sessionId/results" element={<ResultsPage />} />
        <Route path="/learning/:sessionId/feedback" element={<AssignedProductPage page="initial" />} />
        <Route path="/learning/:sessionId/final-feedback" element={<AssignedProductPage page="final" />} />
      </Route>
      {AssignedPreviewApp && <Route path="/dev/pages/*" element={<AssignedPreviewApp />} />}
      {UiPreviewPage && <Route path="/dev/ui" element={<UiPreviewPage />} />}
      {InterestSettingPreviewPage && <Route path="/dev/onboarding" element={<InterestSettingPreviewPage />} />}
      {HomePreviewPage && <Route path="/dev/home" element={<HomePreviewPage />} />}
      {LearningHistoryPreviewPage && <Route path="/dev/learning" element={<LearningHistoryPreviewPage />} />}
      {FlowPreviewPage && <Route path="/dev/flow" element={<FlowPreviewPage />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// A data router enables useBlocker for unsaved prediction navigation.
const router = createBrowserRouter([{ path: '*', element: <Suspense fallback={<PageLoading />}><AppRoutes /></Suspense> }])
export default function App() { return <RouterProvider router={router} /> }
