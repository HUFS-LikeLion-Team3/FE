import { safeInternalPath } from '@/lib/navigation'
import { useState } from 'react'
import { Link, useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Shell, PageTitle, Notice, linkClass } from '@/features/learning/components/PagePrimitives'
import { QueryState } from '@/features/learning/components/QueryState'
import { Modal } from '@/features/learning/components/Modal'
import { completeOnboarding, getInterests, saveInterests, type InterestItem } from './api'

const topics = [{ key: 'rate', label: '금리' }, { key: 'exchange_rate', label: '환율' }, { key: 'semiconductor', label: '반도체' }, { key: 'energy', label: '에너지' }, { key: 'price', label: '물가' }, { key: 'employment', label: '고용' }]
export default function InterestSettingPage({ editing = false }: { editing?: boolean }) {
  const query = useQuery({ queryKey: ['interests'], queryFn: getInterests, retry: false })
  if (!query.data) return <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
  return <>
    {query.isError && <Notice title="최신 관심 설정을 불러오지 못했어요" error>{query.error.message} 선택한 내용은 유지했어요.<Button variant="text" onClick={() => void query.refetch()}>다시 불러오기</Button></Notice>}
    <InterestForm key={editing ? 'settings' : 'onboarding'} initial={query.data} editing={editing} />
  </>
}
function InterestForm({ initial, editing }: { initial: InterestItem[]; editing: boolean }) {
  const navigate = useNavigate()
  const client = useQueryClient()
  const [selected, setSelected] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [done, setDone] = useState(false)
  const [allowNavigation, setAllowNavigation] = useState(false)
  const mutation = useMutation({
    mutationFn: async (interests: InterestItem[]) => {
      const result = await saveInterests(interests)
      if (!editing) await completeOnboarding()
      return result
    },
    onSuccess: interests => {
      client.setQueryData(['interests'], interests)
      void client.invalidateQueries({ queryKey: ['news'] })
      setSaved(interests); setSelected(interests); setDone(true); setAllowNavigation(true)
      if (!editing) {
        const returnTo = sessionStorage.getItem('finsight.returnTo')
        sessionStorage.removeItem('finsight.returnTo')
        navigate(safeInternalPath(returnTo), { replace: true })
      }
    },
  })
  const dirty = JSON.stringify(selected) !== JSON.stringify(saved)
  const blocker = useBlocker(() => editing && !allowNavigation && (dirty || mutation.isPending))
  useBeforeUnload(event => { if (editing && (dirty || mutation.isPending) && !allowNavigation) { event.preventDefault(); event.returnValue = '' } })
  const has = (type: InterestItem['interestType'], key: string) => selected.some(item => item.interestType === type && item.interestKey === key)
  const both = has('market', 'korea') && has('market', 'us')
  const change = (interests: InterestItem[]) => { setSelected(interests); setDone(false); setAllowNavigation(false); mutation.reset() }
  const toggleTopic = (key: string) => change(has('topic', key) ? selected.filter(item => item.interestType !== 'topic' || item.interestKey !== key) : [...selected, { interestType: 'topic', interestKey: key }])
  const market = (key: 'korea' | 'us' | 'both') => {
    const same = key === 'both' ? both : !both && has('market', key)
    const values = same ? [] : key === 'both' ? ['korea', 'us'] : [key]
    change([...selected.filter(item => item.interestType !== 'market'), ...values.map(interestKey => ({ interestType: 'market' as const, interestKey }))])
  }
  return <Shell section="/"><PageTitle label={editing ? 'YOUR INTERESTS / EDIT' : 'GETTING STARTED'} title={editing ? '관심 설정을 바꿔보세요' : '어떤 경제 이야기가 궁금하세요?'} description={editing ? '저장한 관심 시장과 주제를 불러왔어요. 변경한 관심사는 홈 뉴스 추천 순서에 반영돼요.' : '관심 분야를 선택하면 관련 뉴스를 먼저 보여드려요. 선택하지 않고 시작해도 괜찮아요.'} />
    <div className={editing ? 'max-w-[720px] space-y-8' : 'space-y-8'}><fieldset className="space-y-8" disabled={mutation.isPending}><legend className="sr-only">관심 시장과 주제 선택</legend><section className="space-y-6"><h2 className="text-section">관심 시장</h2><div className="flex gap-2" role="group" aria-label="관심 시장 선택">{([{ key: 'korea', label: '국내' }, { key: 'us', label: '미국' }, { key: 'both', label: '둘 다' }] as const).map(option => <FilterChip key={option.key} selected={option.key === 'both' ? both : !both && has('market', option.key)} onClick={() => market(option.key)}>{option.label}</FilterChip>)}</div></section><section className="space-y-6"><h2 className="text-section">관심 주제</h2><p className="text-meta text-text-muted">복수 선택할 수 있어요.</p><div className="flex flex-wrap gap-2" role="group" aria-label="관심 주제 선택">{topics.map(topic => <FilterChip key={topic.key} selected={has('topic', topic.key)} onClick={() => toggleTopic(topic.key)}>{topic.label}</FilterChip>)}</div></section></fieldset>
      <Notice title="선택은 뉴스의 우선순위에 반영돼요.">{editing ? '선택하지 않아도 괜찮아요. 취소하면 기존 관심 설정을 유지합니다.' : '뉴스를 제한하지 않으며, 건너뛰면 전체 시장·주제로 시작합니다.'}</Notice>
      {mutation.error && <Notice title="저장하지 못했어요" error>{mutation.error.message} 선택한 내용은 유지했어요. 다시 시도해 주세요.</Notice>}{done && <Notice title="변경을 저장했어요">다음 뉴스 조회부터 새 관심 설정을 반영해요.</Notice>}
      <Button className="w-full" loading={mutation.isPending} onClick={() => mutation.mutate([...selected])}>{editing ? '변경 저장하기' : '완료하고 시작하기'}</Button>{editing ? <Link to="/" className={`${linkClass} w-full`}>{done ? '홈으로 돌아가기' : '취소'}</Link> : <Button variant="text" className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate([])}>건너뛰기</Button>}
    </div>
    {blocker.state === 'blocked' && <Modal title="저장하지 않은 관심 설정이 있어요" onClose={() => { if (!mutation.isPending) blocker.reset() }}><p className="text-ui">나가면 기존에 저장한 관심 설정을 유지해요.</p><Button disabled={mutation.isPending} onClick={() => blocker.reset()}>계속 수정하기</Button><Button variant="secondary" disabled={mutation.isPending} onClick={() => blocker.proceed()}>변경하지 않고 나가기</Button></Modal>}
  </Shell>
}
