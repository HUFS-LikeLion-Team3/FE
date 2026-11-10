export function formatReplayValue(value: number | null | undefined, signed = false) {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${signed && value > 0 ? '+' : ''}${value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function replayChangeClass(value: number | null | undefined) {
  return value != null && Number.isFinite(value) && value > 0 ? 'text-market-up'
    : value != null && Number.isFinite(value) && value < 0 ? 'text-market-down' : 'text-text-secondary'
}
