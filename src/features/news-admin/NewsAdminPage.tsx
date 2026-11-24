import { useRef, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { TextArea, TextField } from '@/components/ui/TextField'
import { topics } from '@/features/explore/api'
import { Notice, Shell, linkClass } from '@/features/learning/components/PagePrimitives'
import { ApiError, request } from '@/lib/api-client'
import { newsAdminAccessQuery } from './api'

const categories = topics.filter(topic => topic.key !== 'all')
const sourceTypes = [
  ['original_article', '원문 기사'],
  ['official_statistic', '공식 통계'],
  ['government_release', '정부 발표'],
  ['central_bank_release', '중앙은행 발표'],
  ['research_report', '리서치 보고서'],
] as const
const marketsSchema = z.object({
  targets: z.array(z.object({ id: z.uuid(), code: z.string(), displayName: z.string(), marketCategory: z.string() })),
})
const publishedSchema = z.object({ id: z.uuid(), title: z.string() })
type Market = z.infer<typeof marketsSchema>['targets'][number]
type Published = z.infer<typeof publishedSchema>
const marketCategories: Record<string, string> = {
  korea_equity: '국내 주식', us_equity: '미국 주식', sector: '섹터', fx: '환율', rate: '금리', commodity: '원자재',
}
const selectClass = 'min-h-12 w-full rounded-control border border-border-control bg-surface-canvas p-3 text-meta focus-visible:outline-2 focus-visible:outline-brand-primary'

export default function NewsAdminPage() {
  const access = useQuery(newsAdminAccessQuery)
  const markets = useQuery({
    queryKey: ['news-admin', 'markets'],
    queryFn: ({ signal }) => request('/market-targets', marketsSchema, { signal }),
    enabled: Boolean(access.data),
    retry: false,
  })
  const error = access.error ?? markets.error
  const forbidden = error instanceof ApiError && error.status === 403

  return (
    <Shell responsive>
      <h1 className="text-page">학습 뉴스 등록</h1>
      {error ? (
        <Notice title={forbidden ? '뉴스 관리자 권한이 필요해요' : '등록 화면을 불러오지 못했어요'} error>
          {!forbidden && <><p>{error.message}</p><Button variant="secondary" className="mt-3" onClick={() => void (access.error ? access.refetch() : markets.refetch())}>다시 불러오기</Button></>}
        </Notice>
      ) : markets.data ? <NewsForm markets={markets.data.targets} /> : <p role="status">등록 화면을 준비하고 있어요.</p>}
    </Shell>
  )
}

function NewsForm({ markets }: { markets: Market[] }) {
  const client = useQueryClient()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [briefing, setBriefing] = useState('')
  const [selected, setSelected] = useState<Market[]>([])
  const [rationales, setRationales] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [published, setPublished] = useState<Published | null>(null)
  const attempt = useRef<{ fingerprint: string; requestId: string } | null>(null)
  const submitting = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || published) return
    setError('')
    const form = new FormData(event.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()
    const publicationTime = new Date(field('publishedAt'))
    const referenceTime = field('referenceAt') ? new Date(field('referenceAt')) : publicationTime
    const targets = selected.map(market => ({
      marketTargetId: market.id,
      rationale: rationales[market.id]?.trim() ?? '',
    }))
    if (![title.trim(), category, briefing.trim(), field('publisher'), field('sourceExcerpt')].every(Boolean)
        || !targets.length || targets.some(target => !target.rationale)) {
      setError('필수 정보와 선택한 지표의 선정 이유를 입력해 주세요.')
      return
    }
    if (![publicationTime, referenceTime].every(time => time.getTime() <= Date.now())) {
      setError('원문 발행 시각과 관측 기준 시각을 현재 시각 이전으로 입력해 주세요.')
      return
    }
    try {
      const url = new URL(field('sourceUrl'))
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error()
    } catch {
      setError('원문 URL은 올바른 HTTP 또는 HTTPS 주소로 입력해 주세요.')
      return
    }
    const body = {
      title: title.trim(), category, briefing: briefing.trim(),
      publishedAt: publicationTime.toISOString(), referenceAt: referenceTime.toISOString(),
      source: { type: field('sourceType'), publisher: field('publisher'), url: field('sourceUrl'), excerpt: field('sourceExcerpt') },
      targets,
    }
    const fingerprint = JSON.stringify(body)
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, requestId: crypto.randomUUID() }

    submitting.current = true
    setBusy(true)
    try {
      const registered = await request('/admin/news', publishedSchema, {
        method: 'POST', body: { ...body, requestId: attempt.current.requestId },
      })
      setPublished(registered)
      void client.invalidateQueries({ queryKey: ['news'] })
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 409
        ? '이미 등록된 원문이거나 등록 정보가 충돌해요. 입력 내용을 확인해 주세요.'
        : cause instanceof Error ? cause.message : '뉴스를 등록하지 못했어요.')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  if (published) return (
    <Notice title="뉴스를 등록했어요">
      <p>{published.title}</p>
      <Link to={`/news/${published.id}`} className={linkClass}>등록한 뉴스 보기</Link>
    </Notice>
  )

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <form onSubmit={event => void submit(event)} className="space-y-8">
        <fieldset disabled={busy} className="space-y-4">
          <legend className="mb-4 text-section">기사 정보</legend>
          <TextField label="기사 제목" value={title} onChange={event => setTitle(event.target.value)} maxLength={255} required />
          <div className="space-y-2 rounded-card bg-surface-subtle p-4">
            <label className="block text-control font-medium" htmlFor="news-admin-category">주제</label>
            <select className={selectClass} id="news-admin-category" value={category} onChange={event => setCategory(event.target.value)} required>
              <option value="">주제 선택</option>
              {categories.map(topic => <option key={topic.key} value={topic.key}>{topic.label}</option>)}
            </select>
          </div>
          <TextArea label="학습용 뉴스 브리핑" value={briefing} onChange={event => setBriefing(event.target.value)} maxLength={8000} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="원문 발행 시각" name="publishedAt" type="datetime-local" required />
            <TextField label="관측 기준 시각" name="referenceAt" type="datetime-local" helperText="비워두면 원문 발행 시각을 사용해요." />
          </div>
          <p className="text-meta text-text-secondary">시각은 기기의 시간대를 기준으로 입력해 주세요.</p>
        </fieldset>

        <fieldset disabled={busy} className="space-y-4">
          <legend className="mb-4 text-section">대표 출처</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="발행처" name="publisher" maxLength={255} required />
            <div className="space-y-2 rounded-card bg-surface-subtle p-4">
              <label className="block text-control font-medium" htmlFor="news-admin-source-type">자료 유형</label>
              <select className={selectClass} id="news-admin-source-type" name="sourceType">
                {sourceTypes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
          </div>
          <TextField label="원문 URL" name="sourceUrl" type="url" maxLength={255} required />
          <TextArea label="원문 근거 발췌" name="sourceExcerpt" maxLength={8000} helperText="AI 피드백에서 근거로 참고할 실제 원문을 입력해 주세요." required />
        </fieldset>

        <fieldset disabled={busy} className="space-y-4">
          <legend className="mb-4 text-section">관측 지표</legend>
          <p className="text-meta text-text-secondary">기사와 관련된 지표를 1~3개 선택해 주세요. 선택한 순서대로 기사에 표시돼요.</p>
          {markets.length === 0 && <Notice title="선택할 수 있는 지표가 없어요">활성화된 시장 지표가 필요해요.</Notice>}
          <div className="grid gap-2 sm:grid-cols-2">
            {markets.map(market => {
              const checked = selected.some(item => item.id === market.id)
              return (
                <label key={market.id} className="flex items-start gap-2 rounded-control border border-border-default p-3 has-checked:border-brand-primary has-checked:bg-brand-subtle">
                  <input type="checkbox" className="mt-1 accent-brand-primary" checked={checked} disabled={!checked && selected.length >= 3}
                    onChange={() => setSelected(current => checked ? current.filter(item => item.id !== market.id) : [...current, market])} />
                  <span className="min-w-0"><span className="block break-words font-medium">{market.displayName}</span>
                    <span className="block text-meta text-text-secondary">{marketCategories[market.marketCategory] ?? market.marketCategory} · {market.code}</span></span>
                </label>
              )
            })}
          </div>
          {selected.map(market => <TextArea key={market.id} label={`${market.displayName} 선정 이유`} rows={2} value={rationales[market.id] ?? ''} required maxLength={1000}
            onChange={event => setRationales(current => ({ ...current, [market.id]: event.target.value }))} />)}
        </fieldset>

        {error && <Notice title="뉴스를 등록하지 못했어요" error>{error}</Notice>}
        <Button type="submit" loading={busy} disabled={selected.length === 0}>뉴스 등록 및 공개</Button>
      </form>

      <aside aria-labelledby="news-admin-preview" className="min-w-0 space-y-5 rounded-card border border-border-default p-6 lg:sticky lg:top-6">
        <h2 id="news-admin-preview" className="text-control font-medium text-text-secondary">기사 미리보기</h2>
        <p className="text-meta text-brand-primary">{categories.find(topic => topic.key === category)?.label ?? '주제 미선택'}</p>
        <h3 className="break-words text-section">{title.trim() || '기사 제목'}</h3>
        {briefing.trim() && <p className="whitespace-pre-wrap break-words text-ui">{briefing}</p>}
        <div className="space-y-2 rounded-control bg-surface-subtle p-4">
          <h4 className="text-control font-medium">이 뉴스와 함께 관찰할 지표</h4>
          {selected.length > 0 ? (
            <ul className="space-y-1 text-meta">{selected.map(market => <li key={market.id}>{market.displayName}</li>)}</ul>
          ) : <p className="text-meta text-text-secondary">선택한 지표가 여기에 표시돼요.</p>}
        </div>
      </aside>
    </div>
  )
}
