/**
 * DEV 전용: 목 데이터로 관심 설정 페이지의 "복원" 동작을 확인합니다.
 * /dev/onboarding 에서 접근합니다.
 *
 * 저장된 관심사(미국 + 반도체)가 진입 시 칩에 선택된 상태로 복원되는지 확인하는 것이 목적입니다.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Shell } from '@/features/learning/components/PagePrimitives'
import type { InterestItem } from './api'

const MARKET_OPTIONS = [
  { key: 'korea', label: '국내' },
  { key: 'us', label: '미국' },
]
const TOPIC_OPTIONS = [
  { key: 'rate', label: '금리' },
  { key: 'exchange_rate', label: '환율' },
  { key: 'semiconductor', label: '반도체' },
  { key: 'energy', label: '에너지' },
  { key: 'price', label: '물가' },
  { key: 'employment', label: '고용' },
]

// 저장된 사용자를 흉내 내는 목 데이터: 미국 시장 + 반도체 주제
const MOCK_SAVED_INTERESTS: InterestItem[] = [
  { interestType: 'market', interestKey: 'us' },
  { interestType: 'topic', interestKey: 'semiconductor' },
]

function toMarketSet(interests: InterestItem[]) {
  return new Set(interests.filter(i => i.interestType === 'market').map(i => i.interestKey))
}
function toTopicSet(interests: InterestItem[]) {
  return new Set(interests.filter(i => i.interestType === 'topic').map(i => i.interestKey))
}
function marketSelectionState(selected: Set<string>) {
  const hasKorea = selected.has('korea')
  const hasUs = selected.has('us')
  if (hasKorea && hasUs) return 'both'
  if (hasKorea) return 'korea'
  if (hasUs) return 'us'
  return 'none'
}

export default function InterestSettingPreviewPage() {
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(() => toMarketSet(MOCK_SAVED_INTERESTS))
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(() => toTopicSet(MOCK_SAVED_INTERESTS))

  function toggleMarket(key: string) {
    setSelectedMarkets(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  function toggleBoth() {
    setSelectedMarkets(prev =>
      marketSelectionState(prev) === 'both' ? new Set() : new Set(['korea', 'us']),
    )
  }
  function toggleTopic(key: string) {
    setSelectedTopics(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const marketState = marketSelectionState(selectedMarkets)

  return (
    <Shell>
      <div className="rounded-card bg-brand-subtle px-4 py-2 font-mono text-[12px] text-brand-primary">
        DEV 미리보기 · 저장된 관심사(미국·반도체)가 복원된 상태
      </div>

      <div className="space-y-4">
        <p className="font-sans text-[11px] font-semibold tracking-[0.18em] text-brand-primary">
          GETTING STARTED
        </p>
        <h1 className="text-page text-text-primary">어떤 경제 이야기가 궁금하세요?</h1>
        <p className="font-sans text-[15px] text-text-secondary">
          관심 분야를 선택하면 관련 뉴스를 먼저 보여드려요. 선택하지 않고 시작해도 괜찮아요.
        </p>
      </div>

      <section className="space-y-4" aria-labelledby="market-heading">
        <h2 id="market-heading" className="text-section text-text-primary">관심 시장</h2>
        <div className="flex flex-wrap gap-3" role="group" aria-label="관심 시장 선택">
          {MARKET_OPTIONS.map(({ key, label }) => (
            <FilterChip key={key} selected={selectedMarkets.has(key)} onClick={() => toggleMarket(key)}>
              {label}
            </FilterChip>
          ))}
          <FilterChip selected={marketState === 'both'} onClick={toggleBoth}>
            둘 다
          </FilterChip>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="topic-heading">
        <h2 id="topic-heading" className="text-section text-text-primary">관심 주제</h2>
        <p className="font-sans text-[13px] text-text-muted">복수 선택할 수 있어요.</p>
        <div className="flex flex-wrap gap-3" role="group" aria-label="관심 주제 선택">
          {TOPIC_OPTIONS.map(({ key, label }) => (
            <FilterChip key={key} selected={selectedTopics.has(key)} onClick={() => toggleTopic(key)}>
              {label}
            </FilterChip>
          ))}
        </div>

        <div className="rounded-card bg-surface-subtle px-5 py-4 space-y-1">
          <p className="font-sans text-[14px] font-semibold text-text-primary">
            선택은 뉴스의 우선순위에 반영돼요.
          </p>
          <p className="font-sans text-[13px] text-text-secondary">
            뉴스를 제한하지 않으며, 건너뛰면 전체 시장·주제로 시작합니다.
          </p>
        </div>
      </section>

      <div className="space-y-3">
        <Button className="w-full" disabled>
          완료하고 시작하기 (미리보기)
        </Button>
        <button
          type="button"
          disabled
          className="w-full min-h-11 font-sans text-[14px] text-text-secondary disabled:opacity-50"
        >
          건너뛰기
        </button>
      </div>
    </Shell>
  )
}
