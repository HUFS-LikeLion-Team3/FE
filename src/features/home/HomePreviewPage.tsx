/**
 * DEV 전용: 목 데이터로 홈 페이지 UI를 확인합니다.
 * /dev/home 에서 접근합니다.
 */
import { Link } from 'react-router-dom'
import { Shell } from '@/features/learning/components/PagePrimitives'
import { mockInProgressSession, mockNewsList } from './fixtures'

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

const primaryLinkClass =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control border border-transparent bg-brand-primary px-4 py-3 font-sans text-[15px] font-medium text-surface-canvas hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pressed'
const secondaryLinkClass =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control border border-border-default bg-surface-canvas px-4 py-3 font-sans text-[15px] font-medium text-text-primary hover:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pressed'

export default function HomePreviewPage() {
  const featuredNews = mockNewsList[0]
  const coreNewsList = mockNewsList.slice(1)
  const inProgressSession = mockInProgressSession
  const inProgressNews = mockNewsList.find((n) => n.id === inProgressSession.newsId)

  const sessionHref =
    inProgressSession.status === 'drafting'
      ? `/news/${inProgressSession.newsId}/predict`
      : `/learning/${inProgressSession.id}/feedback`

  return (
    <Shell>
      {/* DEV 배너 */}
      <div className="rounded-card bg-brand-subtle px-4 py-2 font-mono text-[12px] text-brand-primary">
        DEV 미리보기 · 목 데이터 사용 중 —{' '}
        <Link to="/" className="underline">
          실제 홈으로 이동
        </Link>
      </div>

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
        </section>

        {/* 우측: 이어서 학습하기 */}
        <aside aria-label="이어서 학습하기" className="space-y-3">
          <h2 className="font-sans text-[17px] font-semibold text-text-primary">
            이어서 학습하기
          </h2>
          <div className="rounded-card border border-border-default bg-surface-canvas p-5 space-y-3">
            <p className="font-sans text-[12px] font-semibold text-status-warning">
              관찰 중 · 새 결과가 있어요
            </p>
            <h3 className="font-sans text-[16px] font-semibold text-text-primary leading-snug">
              {inProgressNews?.title}
            </h3>
            <p className="font-sans text-[13px] text-text-muted">
              마지막 활동{' '}
              {new Date(inProgressSession.updatedAt).toLocaleDateString('ko-KR')}
            </p>
            <Link to={sessionHref} className={secondaryLinkClass}>
              결과 보기
            </Link>
          </div>
        </aside>
      </div>

      {/* 오늘의 핵심 뉴스 */}
      <section aria-labelledby="core-news-heading" className="space-y-2">
        <h2
          id="core-news-heading"
          className="font-sans text-[17px] font-semibold text-text-primary"
        >
          오늘의 핵심 뉴스
        </h2>
        <ul className="divide-y divide-border-default">
          {coreNewsList.map((news) => (
            <li key={news.id}>
              <Link
                to={`/news/${news.id}`}
                className="group flex flex-col gap-1 py-5 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-brand-primary"
              >
                <p className="font-sans text-[12px] text-text-muted">
                  {categoryLabel(news.category)} / [발행처] ·{' '}
                  {new Date(news.publishedAt).toLocaleDateString('ko-KR')}
                </p>
                <h3 className="font-sans text-[17px] font-semibold text-text-primary leading-snug group-hover:text-brand-primary transition-colors">
                  {news.title}
                </h3>
                <p className="font-sans text-[14px] text-text-secondary leading-relaxed line-clamp-2">
                  {news.briefing}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="pt-4 text-center">
          <Link
            to="/explore"
            className="font-sans text-[14px] text-text-secondary hover:text-text-primary"
          >
            뉴스 더 살펴보기
          </Link>
        </div>
      </section>
    </Shell>
  )
}
