import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Route, RouterProvider, Routes } from 'react-router-dom'

const AssignedProductPage = lazy(() => import('@/features/learning/AssignedProductPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const KakaoCallbackPage = lazy(() => import('@/features/auth/KakaoCallbackPage'))
const PolicyPage = lazy(() => import('@/features/auth/PolicyPage'))

const UiPreviewPage = import.meta.env.DEV ? lazy(() => import('@/pages/UiPreviewPage')) : null
const AssignedPreviewApp = import.meta.env.DEV ? lazy(() => import('@/features/learning/AssignedPreviewApp')) : null

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold tracking-[0.16em] text-teal-700">FINSIGHT</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{description}</p>
    </main>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<PlaceholderPage title="경제 뉴스로 시장을 해석하는 연습" description="FinSight P0 화면을 이 라우트 구조에서 구현합니다." />}
      />
      <Route path="/login" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><LoginPage /></Suspense>} />
      <Route path="/auth/kakao/callback" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><KakaoCallbackPage /></Suspense>} />
      <Route path="/terms" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><PolicyPage kind="terms" /></Suspense>} />
      <Route path="/privacy" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><PolicyPage kind="privacy" /></Suspense>} />
      <Route path="/explore" element={<PlaceholderPage title="뉴스 탐색" description="큐레이션 뉴스 목록 화면이 들어갈 자리입니다." />} />
      <Route path="/news/:newsId" element={<AssignedProductPage page="news" />} />
      <Route path="/news/:newsId/predict" element={<AssignedProductPage page="prediction" />} />
      <Route path="/learning/:sessionId/edit" element={<AssignedProductPage page="prediction" />} />
      <Route path="/learning/:sessionId/feedback" element={<AssignedProductPage page="initial" />} />
      <Route path="/learning/:sessionId/final-feedback" element={<AssignedProductPage page="final" />} />
      {AssignedPreviewApp && <Route path="/dev/pages/*" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><AssignedPreviewApp /></Suspense>} />}
      {UiPreviewPage && <Route path="/dev/ui" element={<Suspense fallback={<p role="status">불러오는 중…</p>}><UiPreviewPage /></Suspense>} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// A data router enables useBlocker for unsaved prediction navigation.
const router = createBrowserRouter([{ path: '*', element: <AppRoutes /> }])
export default function App() { return <Suspense fallback={<p role="status">불러오는 중…</p>}><RouterProvider router={router} /></Suspense> }
