import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Shell } from '@/features/learning/components/PagePrimitives'
import { completeOnboarding, getInterests, saveInterests, type InterestItem } from './api'

// ─── 정적 데이터 ───────────────────────────────────────────────────────────────

type MarketOption = { key: string; label: string }
type TopicOption = { key: string; label: string }

const MARKET_OPTIONS: MarketOption[] = [
  { key: 'korea', label: '국내' },
  { key: 'us', label: '미국' },
]

const TOPIC_OPTIONS: TopicOption[] = [
  { key: 'rate', label: '금리' },
  { key: 'exchange_rate', label: '환율' },
  { key: 'semiconductor', label: '반도체' },
  { key: 'energy', label: '에너지' },
  { key: 'price', label: '물가' },
  { key: 'employment', label: '고용' },
]

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

/** interests[] → 선택된 시장 키 Set */
function toMarketSet(interests: InterestItem[]): Set<string> {
  return new Set(interests.filter(i => i.interestType === 'market').map(i => i.interestKey))
}

/** interests[] → 선택된 주제 키 Set */
function toTopicSet(interests: InterestItem[]): Set<string> {
  return new Set(interests.filter(i => i.interestType === 'topic').map(i => i.interestKey))
}

/** "둘 다" 선택 상태 계산 */
function marketSelectionState(selected: Set<string>): 'none' | 'korea' | 'us' | 'both' {
  const hasKorea = selected.has('korea')
  const hasUs = selected.has('us')
  if (hasKorea && hasUs) return 'both'
  if (hasKorea) return 'korea'
  if (hasUs) return 'us'
  return 'none'
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function InterestSettingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 기존 관심사 조회 (설정 페이지 재방문 시 복원)
  const {
    data: savedInterests,
    isLoading: isLoadingInterests,
    isError: isLoadError,
    refetch,
  } = useQuery({
    queryKey: ['interests'],
    queryFn: getInterests,
  })

  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set())
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())

  // 조회 완료 후 저장된 관심사를 초기 선택 상태에 반영한다.
  // (useState 초기화 함수는 1회만 실행되므로 비동기 조회 결과를 담지 못한다)
  useEffect(() => {
    if (!savedInterests) return
    setSelectedMarkets(toMarketSet(savedInterests))
    setSelectedTopics(toTopicSet(savedInterests))
  }, [savedInterests])

  // 관심사 저장 + 온보딩 완료
  const { mutate: submit, isPending, error: saveError } = useMutation({
    mutationFn: async () => {
      const interests: InterestItem[] = [
        ...Array.from(selectedMarkets).map(key => ({ interestType: 'market' as const, interestKey: key })),
        ...Array.from(selectedTopics).map(key => ({ interestType: 'topic' as const, interestKey: key })),
      ]
      await saveInterests(interests)
      await completeOnboarding()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] })
      navigate('/', { replace: true })
    },
  })

  // 건너뛰기: 빈 관심사로 저장 후 온보딩 완료
  const { mutate: skip, isPending: isSkipping } = useMutation({
    mutationFn: async () => {
      await saveInterests([])
      await completeOnboarding()
    },
    onSuccess: () => navigate('/', { replace: true }),
  })

  // ─── 시장 토글 핸들러 ───────────────────────────────────────────────────────

  function toggleMarket(key: string) {
    setSelectedMarkets(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleBoth() {
    const state = marketSelectionState(selectedMarkets)
    if (state === 'both') {
      // 이미 둘 다 선택 → 전체 해제
      setSelectedMarkets(new Set())
    } else {
      // 둘 다 선택
      setSelectedMarkets(new Set(['korea', 'us']))
    }
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
  // 조회 중이거나 조회 실패 시에는 저장을 막는다.
  // 조회가 끝나지 않은 상태에서 저장하면 기존 관심사를 빈 배열로 덮어쓸 수 있다.
  const isBusy = isPending || isSkipping
  const canSave = !isLoadingInterests && !isLoadError && !isBusy

  return (
    <Shell>
      {/* 페이지 헤더 */}
      <div className="space-y-4">
        <p className="font-sans text-[11px] font-semibold tracking-[0.18em] text-brand-primary">
          GETTING STARTED
        </p>
        <h1 className="text-page text-text-primary">어떤 경제 이야기가 궁금하세요?</h1>
        <p className="font-sans text-[15px] text-text-secondary">
          관심 분야를 선택하면 관련 뉴스를 먼저 보여드려요. 선택하지 않고 시작해도 괜찮아요.
        </p>
      </div>

      {/* 조회 실패 안내: 저장 차단 + 재시도 */}
      {isLoadError && (
        <div role="alert" className="space-y-3 rounded-card bg-status-error-bg px-5 py-4">
          <p className="font-sans text-[14px] font-medium text-status-error">
            관심사를 불러오지 못했어요.
          </p>
          <p className="font-sans text-[13px] text-text-secondary">
            지금 저장하면 기존 설정이 지워질 수 있어 저장을 멈췄어요. 다시 불러온 뒤 설정해 주세요.
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            다시 불러오기
          </Button>
        </div>
      )}

      {/* 조회 중 안내 */}
      {isLoadingInterests && (
        <p role="status" className="font-sans text-[14px] text-text-muted">
          기존 관심사를 불러오는 중…
        </p>
      )}

      {/* 관심 시장 */}
      <section className="space-y-4" aria-labelledby="market-heading">
        <h2 id="market-heading" className="text-section text-text-primary">관심 시장</h2>
        <div className="flex flex-wrap gap-3" role="group" aria-label="관심 시장 선택">
          {MARKET_OPTIONS.map(({ key, label }) => (
            <FilterChip
              key={key}
              selected={selectedMarkets.has(key)}
              onClick={() => toggleMarket(key)}
            >
              {label}
            </FilterChip>
          ))}
          <FilterChip
            selected={marketState === 'both'}
            onClick={toggleBoth}
          >
            둘 다
          </FilterChip>
        </div>
      </section>

      {/* 관심 주제 */}
      <section className="space-y-4" aria-labelledby="topic-heading">
        <h2 id="topic-heading" className="text-section text-text-primary">관심 주제</h2>
        <p className="font-sans text-[13px] text-text-muted">복수 선택할 수 있어요.</p>
        <div className="flex flex-wrap gap-3" role="group" aria-label="관심 주제 선택">
          {TOPIC_OPTIONS.map(({ key, label }) => (
            <FilterChip
              key={key}
              selected={selectedTopics.has(key)}
              onClick={() => toggleTopic(key)}
            >
              {label}
            </FilterChip>
          ))}
        </div>

        {/* 안내 카드 */}
        <div className="rounded-card bg-surface-subtle px-5 py-4 space-y-1">
          <p className="font-sans text-[14px] font-semibold text-text-primary">
            선택은 뉴스의 우선순위에 반영돼요.
          </p>
          <p className="font-sans text-[13px] text-text-secondary">
            뉴스를 제한하지 않으며, 건너뛰면 전체 시장·주제로 시작합니다.
          </p>
        </div>
      </section>

      {/* 저장 오류 메시지 */}
      {saveError && (
        <p role="alert" className="rounded-control bg-status-error-bg px-3 py-2 font-sans text-[13px] text-status-error">
          저장하지 못했어요. 다시 시도해 주세요.
        </p>
      )}

      {/* 액션 버튼 */}
      <div className="space-y-3">
        <Button
          className="w-full"
          loading={isPending}
          loadingLabel="저장 중…"
          disabled={!canSave}
          onClick={() => submit()}
        >
          완료하고 시작하기
        </Button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => skip()}
          className="w-full min-h-11 font-sans text-[14px] text-text-secondary hover:text-text-primary disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand-primary"
        >
          건너뛰기
        </button>
      </div>
    </Shell>
  )
}
