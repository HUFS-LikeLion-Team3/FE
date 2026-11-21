/** Accept app-internal destinations only, including when restored from browser storage. */
export function safeInternalPath(value: string | null | undefined, fallback = '/') {
  if (!value?.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : fallback
  } catch { return fallback }
}
