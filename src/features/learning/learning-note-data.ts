import type { NewsView } from './model'

export type LearningNews = Pick<NewsView, 'title' | 'facts'>

export function exportComposition(news: LearningNews | undefined) {
  if (!news || !/수출/.test(news.title)) return null
  const facts = news.facts ?? []
  const total = facts.filter(f => /^(총|전체)?\s*수출(액)?$/.test(f.label.trim()))
  const semiconductor = facts.filter(f => /^반도체\s*수출(액)?$/.test(f.label.trim()))
  // Do not pick arbitrary duplicates or mix periods, currencies, or scales.
  if (total.length !== 1 || semiconductor.length !== 1) return null
  const a = total[0]!, b = semiconductor[0]!
  const number = (value: string) => /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value.trim()) ? Number(value.replaceAll(',', '')) : NaN
  const overall = number(a.value), part = number(b.value)
  if (!a.asOf || a.asOf !== b.asOf || !['달러', '만 달러', '백만 달러', '억 달러'].includes(a.unit)
    || a.unit !== b.unit || !Number.isFinite(overall) || !Number.isFinite(part)
    || overall <= 0 || part < 0 || part > overall) return null
  return { overall, part, unit: a.unit, percent: (part / overall * 100).toFixed(1) }
}
