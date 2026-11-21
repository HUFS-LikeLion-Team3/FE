import type { z } from 'zod'

// The login owner calls this after OAuth. Never put a token in VITE_* or a URL.
const tokenKey = 'finsight.accessToken'
export function setAccessToken(token: string | null) {
  if (token) sessionStorage.setItem(tokenKey, token)
  else sessionStorage.removeItem(tokenKey)
}
export class ApiError extends Error {
  status: number
  kind: 'http' | 'network' | 'timeout' | 'contract'
  constructor(status: number, kind: 'http' | 'network' | 'timeout' | 'contract' = 'http') {
    super(kind === 'timeout' ? '응답이 늦어지고 있어요. 다시 시도해 주세요.' : kind === 'network' ? '서버에 연결하지 못했어요. 네트워크를 확인해 주세요.' : kind === 'contract' ? '응답 정보를 확인하지 못했어요. 잠시 후 다시 확인해 주세요.' : status === 401 ? '로그인이 필요하거나 만료됐어요. 다시 로그인해 주세요.' : status === 403 ? '이 기록에 접근할 수 없어요.' : status === 404 ? '요청한 기록을 찾을 수 없어요.' : status === 409 ? '기록 상태가 변경됐어요. 저장된 상태를 다시 확인해 주세요.' : status === 400 ? '입력 내용을 확인해 주세요.' : '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.')
    this.status = status
    this.kind = kind
  }
}
export function parseResponse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new ApiError(502, 'contract')
  return result.data
}
export async function request<T>(path: string, schema: z.ZodType<T>, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, 15000)
  const abort = () => controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) controller.abort()
  try {
    const token = sessionStorage.getItem(tokenKey)
    const base = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:8080')).replace(/\/$/, '')
    const response = await fetch(`${base}/api/v1${path}`, {
      method: options.method ?? 'GET', signal: controller.signal,
      headers: { Accept: 'application/json', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
    if (!response.ok) {
      if (response.status === 401) setAccessToken(null)
      throw new ApiError(response.status)
    }
    let payload: unknown
    try { payload = await response.json() } catch (error) {
      if (controller.signal.aborted) throw error
      throw new ApiError(502, 'contract')
    }
    return parseResponse(schema, payload)
  } catch (error) {
    if (error instanceof ApiError || options.signal?.aborted) throw error
    throw new ApiError(0, timedOut ? 'timeout' : 'network')
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', abort)
  }
}
