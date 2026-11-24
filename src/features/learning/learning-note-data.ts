import type { NewsView } from './model'

export type LearningNews = Pick<NewsView, 'title' | 'facts'>

// Require an explicit aggregation window in each label. asOf is a point in
// time and cannot distinguish monthly, cumulative, or partial-month figures.
function periodLabel(label: string, semiconductor: boolean) {
  const metric = semiconductor ? '반도체\\s*수출(?:액)?' : '(?:총|전체)?\\s*수출(?:액)?'
  const pattern = new RegExp('^(\\d{4})년\\s*(\\d{1,2})월(?:\\s*(\\d{1,2})\\s*[~∼–-]\\s*(\\d{1,2})일)?\\s+' + metric + '$')
  const match = label.trim().match(pattern)
  if (!match) return null
  const year = Number(match[1]), month = Number(match[2])
  if (month < 1 || month > 12 || year < 1) return null
  if (!match[3]) return { key: `${year}-${month}:month`, display: `${year}년 ${month}월 전체` }
  const start = Number(match[3]), end = Number(match[4])
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (start < 1 || start > end || end > last) return null
  return { key: `${year}-${month}:${start}-${end}`, display: `${year}년 ${month}월 ${start}~${end}일` }
}

export function exportComposition(news: LearningNews | undefined) {
  if (!news || !/수출/.test(news.title)) return null
  const facts = news.facts ?? []
  const total = facts.flatMap(fact => { const period = periodLabel(fact.label, false); return period ? [{ fact, period }] : [] })
  const semiconductor = facts.flatMap(fact => { const period = periodLabel(fact.label, true); return period ? [{ fact, period }] : [] })
  // Do not pick arbitrary duplicates or mix periods, currencies, or scales.
  if (total.length !== 1 || semiconductor.length !== 1) return null
  const totalRow = total[0]!, partRow = semiconductor[0]!
  if (totalRow.period.key !== partRow.period.key) return null
  const a = totalRow.fact, b = partRow.fact
  const number = (value: string) => /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value.trim()) ? Number(value.replaceAll(',', '')) : NaN
  const overall = number(a.value), part = number(b.value)
  if (!a.asOf || a.asOf !== b.asOf || !['달러', '만 달러', '백만 달러', '억 달러'].includes(a.unit)
    || a.unit !== b.unit || !Number.isFinite(overall) || !Number.isFinite(part)
    || overall <= 0 || part < 0 || part > overall) return null
  return { overall, part, unit: a.unit, period: totalRow.period.display, percent: (part / overall * 100).toFixed(1) }
}
