const categoryLabels: Record<string, string> = {
  rate: '금리',
  exchange_rate: '환율',
  semiconductor: '반도체',
  energy: '에너지',
  price: '물가',
  employment: '고용',
}

export function categoryLabel(key: string) {
  return categoryLabels[key] ?? key
}
