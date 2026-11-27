import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 새로 배포된 뒤 열려 있던 탭은 이전 빌드의 화면 파일을 요청해 불러오기에 실패한다.
// 이때 한 번만 새로고침해 최신 빌드를 받는다. 새로고침 후에도 실패하면 반복하지 않는다.
const reloadKey = 'finsight.preloadReloadAt'
window.addEventListener('vite:preloadError', event => {
  let last = 0
  try { last = Number(sessionStorage.getItem(reloadKey)) || 0 } catch { /* 저장소를 못 쓰면 바로 새로고침한다 */ }
  if (Date.now() - last < 10_000) return
  event.preventDefault()
  try { sessionStorage.setItem(reloadKey, String(Date.now())) } catch { /* 무시 */ }
  window.location.reload()
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
