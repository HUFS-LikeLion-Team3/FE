import { Navigate, Route, Routes } from 'react-router-dom'

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold tracking-[0.16em] text-teal-700">FINSIGHT</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{description}</p>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<PlaceholderPage title="경제 뉴스로 시장을 해석하는 연습" description="FinSight P0 화면을 이 라우트 구조에서 구현합니다." />}
      />
      <Route path="/login" element={<PlaceholderPage title="로그인" description="카카오 로그인 화면이 들어갈 자리입니다." />} />
      <Route path="/explore" element={<PlaceholderPage title="뉴스 탐색" description="큐레이션 뉴스 목록 화면이 들어갈 자리입니다." />} />
      <Route path="/news/:newsId" element={<PlaceholderPage title="뉴스 상세" description="뉴스 브리핑과 예측 시작 CTA가 들어갈 자리입니다." />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
