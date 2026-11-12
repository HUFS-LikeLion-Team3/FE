import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { PageTitle, Notice, Shell } from '@/features/learning/components/PagePrimitives'
import { QueryState } from '@/features/learning/components/QueryState'
import { getReplayScenarios, replayAvailable, replayCategories, type ReplayCategoryKey } from './api'
import { ReplayScenarioCard } from './ReplayScenarioCard'

const tabsId = 'replay'
const pageTitle = <PageTitle label="PAST NEWS / REPLAY" title="지난 뉴스 Replay" description="결과를 보기 전에 당시 뉴스로 직접 예측해보세요." />

export default function ReplayPage() {
  return replayAvailable ? <ReplayContent /> : <ReplayUnavailable />
}

// 배포 빌드: Replay API와 데이터가 연결되기 전까지 안내만 보여준다.
function ReplayUnavailable() {
  return <Shell>{pageTitle}<Notice title="Replay는 준비 중이에요">지난 뉴스 Replay는 아직 이용할 수 없어요. 준비가 끝나면 이곳에서 만나볼 수 있어요.</Notice></Shell>
}

function ReplayContent() {
  const [params, setParams] = useSearchParams()
  const query = useQuery({ queryKey: ['replay', 'scenarios'], queryFn: ({ signal }) => getReplayScenarios(signal), retry: false })
  const active: ReplayCategoryKey = replayCategories.find(category => category.key === params.get('category'))?.key ?? replayCategories[0].key
  const changeCategory = (key: ReplayCategoryKey) => {
    const next = new URLSearchParams(params)
    next.set('category', key)
    setParams(next, { replace: true, preventScrollReset: true })
  }
  if (!query.data) return <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
  const category = replayCategories.find(item => item.key === active) ?? replayCategories[0]
  const scenario = query.data.find(item => item.category === category.key)
  return <Shell>
    {pageTitle}
    <Tabs tabs={replayCategories} value={category.key} onChange={changeCategory} label="Replay 카테고리" idPrefix={tabsId} />
    <TabPanel idPrefix={tabsId} tabKey={category.key} className="space-y-8">
      {scenario ? <>
        <ReplayScenarioCard scenario={scenario} categoryLabel={category.label} />
        <section aria-labelledby="replay-brief-title" className="space-y-4">
          <h2 id="replay-brief-title" className="text-news-title">사실 브리핑</h2>
          <div className="space-y-4 rounded-card border border-border-default bg-surface-canvas p-6">
            <ul className="list-disc space-y-2 pl-6 text-ui">{scenario.facts.map(fact => <li key={fact}>{fact}</li>)}</ul>
            <p className="text-meta text-text-muted">출처: {scenario.sourceNote} | 원문은 결과 확인 후 열어보기를 권장</p>
          </div>
        </section>
      </> : <Notice title="이 카테고리의 시나리오가 아직 없어요">다른 카테고리를 선택해 주세요.</Notice>}
    </TabPanel>
    <section aria-labelledby="replay-target-title" className="space-y-2">
      <h2 id="replay-target-title" className="text-news-title">먼저 영향 대상을 선택해 예측해보세요.</h2>
      <p className="text-meta text-text-secondary">라이브 뉴스와 동일하게 1~3개 대상의 1·5·20거래일 판단을 기록합니다.</p>
    </section>
    <Notice title="Replay의 결과 공개 방식" className="bg-brand-subtle">
      <p className="text-ui text-text-primary">예측 제출 → AI 피드백 → ‘실제 결과 보기’ → 1·5·20일 결과와 통합 회고</p>
      <p className="mt-2">중간 관찰 단계 없이, 결과를 한 번에 보고 회고합니다.</p>
    </Notice>
    <div className="flex flex-col items-end gap-2">
      <Button className="w-48" disabled aria-describedby="replay-cta-help">예측 시작하기</Button>
      <p id="replay-cta-help" className="text-meta text-text-muted">Replay 예측은 준비 중이에요</p>
    </div>
  </Shell>
}
