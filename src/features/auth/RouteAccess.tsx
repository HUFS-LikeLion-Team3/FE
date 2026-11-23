import { AuthLoading } from '@/features/learning/components/PageLoading'
import { useSyncExternalStore, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { getAccessToken, request, setAccessToken, subscribeToAccessToken } from '@/lib/api-client'
import { safeLoginReturnPath } from '@/lib/navigation'
import { isMockLearningEnabled } from '@/features/learning/api/service'

const userSchema = z.object({ id: z.string().uuid() })

function useSession() {
  const token = useSyncExternalStore(subscribeToAccessToken, getAccessToken)
  const query = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: ({ signal }) => request('/users/me', userSchema, { signal }),
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: false,
  })
  return { token, query }
}

function CheckingSession() {
  return <AuthLoading label="로그인 상태를 확인하는 중…" />
}

function SessionCheckError({ error, retry, pending }: { error: Error; retry: () => void; pending: boolean }) {
  return (
    <main className="space-y-4 p-8">
      <p role="alert">{error.message}</p>
      <Button onClick={retry} loading={pending}>다시 확인하기</Button>
      <Button variant="text" onClick={() => setAccessToken(null)}>다시 로그인하기</Button>
    </main>
  )
}

export function ProtectedRoutes() {
  const location = useLocation()
  const { token, query } = useSession()

  if (import.meta.env.DEV && isMockLearningEnabled()) return <Outlet />
  if (!token) {
    const returnTo = location.pathname + location.search + location.hash
    const login = returnTo === '/' ? '/login' : `/login?returnTo=${encodeURIComponent(returnTo)}`
    return <Navigate to={login} replace />
  }
  if (query.isError) return <SessionCheckError error={query.error} retry={() => void query.refetch()} pending={query.isFetching} />
  return query.data ? <Outlet /> : <CheckingSession />
}

export function SignInRoute({ children }: { children: ReactNode }) {
  const [params] = useSearchParams()
  const { token, query } = useSession()

  if (!token) return children
  if (query.isError) return <SessionCheckError error={query.error} retry={() => void query.refetch()} pending={query.isFetching} />
  return query.data
    ? <Navigate to={safeLoginReturnPath(params.get('returnTo'))} replace />
    : <CheckingSession />
}
