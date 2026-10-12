import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Shell } from '@/features/learning/components/PagePrimitives'
import { getLearningSessions, getNewsList, type LearningSession, type NewsItem } from './api'

// 버튼처럼 보이는 링크용 클래스 (Button primary 스타일과 동일)
const primaryLinkClass = 'inline-flex min-h-12 w-full items-center justify-center rounded-control border border-transparent bg-brand-primary px-4 py-3 font-sans text-[15px] font-medium text-surface-canvas hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pressed'
const secondaryLinkClass = 'inline-flex min-h-12 w-full items-center justify-center rounded-control border border-border-default bg-surface-canvas px-4 py-3 font-sans text-[15px] font-medium text-text-primary hover:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pressed'

// ─── 카테고리 한글 변환 ────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  rate: '금리',
  exchange_rate: '환율',
  semiconductor: '반도체',
  energy: '에너지',
  price: '물가',
  employment: '고용',
}

function categoryLabel(key: string) {
  return CATEGORY_LABEL[key] ?? key
}

// ─── 진행 중인 세션 카드 ────────────────────────────────────────────────────────

function InProgressCard({
  session,
  news,
}: {
  session: LearningSession
  news: NewsItem | undefined
}) {
  const href =
    session.status === 'drafting'
      ? `/news/${session.newsId}/predict`
      : `/learning/${session.id}/feedback`

  return (
    <div className="rounded-card border border-border-default bg-surface-canvas p-5 space-y-3">
      <p className="font-sans text-[12px] font-semibold text-status-warning">
        관찰 중 · 새 결과가 있어요
      </p>
      <h3 className="font-sans text-[16px] font-semibold text-text-primary leading-snug">
        {news?.title ?? '뉴스를 불러오는 중…'}
      </h3>
      {news && (
        <p className="font-sans text-[13px] text-text-muted">
          {/* 피그마: "달러 인덱스 · NASDAQ 100 / 마지막 활동 [시각]" 형식 */}
          마지막 활동 {new Date(session.updatedAt).toLocaleDateString('ko-KR')}
        </p>
      )}
      <Link to={href} className={secondaryLinkClass}>결과 보기</Link>
    </div>
  )
}

// ─── 뉴스 목록 아이템 ─────────────────────────────────────────────────────────

function NewsListItem({ news }: { news: NewsItem }) {
  const publishedDate = new Date(news.publishedAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })

  return (
    <li>
      <Link
        to={`/news/${news.id}`}
        className="group flex flex-col gap-1 py-5 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-brand-primary"
      >
        <p className="font-sans text-[12px] text-text-muted">
          {categoryLabel(news.category)} / [발행처] · {publishedDate}
        </p>
        <h3 className="font-sans text-[17px] font-semibold text-text-primary leading-snug group-hover:text-brand-primary transition-colors">
          {news.title}
        </h3>
        <p className="font-sans text-[14px] text-text-secondary leading-relaxed line-clamp-2">
          {news.briefing}
        </p>
      </Link>
    </li>
  )
}

// ─── 홈 페이지 ────────────────────────────────────────────────────────────────

export default function HomePage() {
  // 추천순 뉴스 목록 (live, 최대 10개)
  const { data: newsList = [], isLoading: newsLoading } = useQuery({
    queryKey: ['news', { sort: 'recommended', contentType: 'live', size: 10 }],
    queryFn: () =>
      getNewsList({ sort: 'recommended', contentType: 'live', size: 10 }),
  })

  // 진행 중인 학습 세션 (observing, reflection_pending)
  const { data: observingSessions = [] } = useQuery({
    queryKey: ['learning-sessions', { status: 'observing' }],
    queryFn: () => getLearningSessions({ status: 'observing', size: 1 }),
  })

  const { data: reflectionSessions = [] } = useQuery({
    queryKey: ['learning-sessions', { status: 'reflection_pending' }],
    queryFn: () =>
      getLearningSessions({ status: 'reflection_pending', size: 1 }),
  })

  // 가장 최근 진행 중 세션 1개
  const inProgressSession =
    reflectionSessions[0] ?? observingSessions[0] ?? null

  // 대표 뉴스: 첫 번째 뉴스
  const featuredNews = newsList[0]
  // 핵심 뉴스: 나머지
  const coreNewsList = newsList.slice(1)

  return (
    <Shell>
      {/* 페이지 헤더 */}
      <div className="space-y-4">
        <p className="font-sans text-[11px] font-semibold tracking-[0.18em] text-brand-primary">
          TODAY&nbsp;/&nbsp;FINSIGHT
        </p>
        <h1 className="text-hero text-text-primary">
          오늘의 뉴스,<br />
          내일의 관점.
        </h1>
        <p className="font-sans text-[15px] text-text-secondary">
          안녕하세요. 오늘은 어떤 변화를 함께 살펴볼까요?
        </p>
      </div>

      {/* 메인 콘텐츠: 대표 뉴스 + 이어서 학습하기 */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)] lg:items-start">
        {/* 좌측: 대표 뉴스 */}
        <section aria-label="오늘의 대표 뉴스" className="space-y-5">
          {newsLoading ? (
            <p role="status" className="font-sans text-[14px] text-text-muted">
              뉴스를 불러오는 중…
            </p>
          ) : featuredNews ? (
            <>
              <div className="space-y-1">
                <p className="font-sans text-[12px] font-semibold text-brand-primary">
                  오늘의 대표 뉴스 / {categoryLabel(featuredNews.category)}
                </p>
                <h2 className="text-page text-text-primary leading-snug">
                  {featuredNews.title}
                </h2>
              </div>
              <p className="font-sans text-[15px] text-text-secondary leading-relaxed">
                {featuredNews.briefing}
              </p>
              <p className="font-sans text-[13px] text-text-muted">
                [발행처] · {new Date(featuredNews.publishedAt).toLocaleDateString('ko-KR')}
              </p>
              <Link to={`/news/${featuredNews.id}`} className={primaryLinkClass}>
                뉴스 읽고 예측하기
              </Link>
            </>
          ) : (
            <p className="font-sans text-[14px] text-text-muted">
              오늘의 뉴스가 아직 없어요.
            </p>
          )}
        </section>

        {/* 우측: 이어서 학습하기 */}
        {inProgressSession && (
          <aside aria-label="이어서 학습하기" className="space-y-3">
            <h2 className="font-sans text-[17px] font-semibold text-text-primary">
              이어서 학습하기
            </h2>
            <InProgressCard
              session={inProgressSession}
              news={newsList.find((n) => n.id === inProgressSession.newsId)}
            />
          </aside>
        )}
      </div>

      {/* 오늘의 핵심 뉴스 */}
      {coreNewsList.length > 0 && (
        <section aria-labelledby="core-news-heading" className="space-y-2">
          <h2
            id="core-news-heading"
            className="font-sans text-[17px] font-semibold text-text-primary"
          >
            오늘의 핵심 뉴스
          </h2>
          <ul className="divide-y divide-border-default">
            {coreNewsList.map((news) => (
              <NewsListItem key={news.id} news={news} />
            ))}
          </ul>
          <div className="pt-4 text-center">
            <Link
              to="/explore"
              className="font-sans text-[14px] text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-brand-primary"
            >
              뉴스 더 살펴보기
            </Link>
          </div>
        </section>
      )}
    </Shell>
  )
}
