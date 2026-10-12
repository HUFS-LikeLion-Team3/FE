import { useSearchParams } from 'react-router-dom'
import { redirectToKakao } from './api'

const steps = [
  { number: '01', label: '읽기', description: '경제 뉴스의 사실과 배경을 살펴보세요.' },
  { number: '02', label: '기록', description: '내 관점으로 시장의 방향을 예상해 보세요.' },
  { number: '03', label: '돌아보기', description: 'AI 피드백과 관측값을 참고해 생각을 넓혀보세요.' },
]

export default function LoginPage() {
  const [params] = useSearchParams()
  const error = params.get('error')

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      {/* 상단 헤더 */}
      <header className="px-8 py-5 md:px-12">
        <span className="font-sans text-[15px] font-semibold text-text-primary">FinSight</span>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-12 px-6 py-10 md:flex-row md:items-center md:gap-16 md:px-12 md:py-16 lg:gap-24">
        {/* 좌측: 랜딩 카피 */}
        <section className="flex flex-1 flex-col gap-8" aria-label="서비스 소개">
          {/* 브랜드 태그 */}
          <p className="font-sans text-[11px] font-semibold tracking-[0.18em] text-brand-primary">
            ECONOMIC JOURNAL&nbsp;/&nbsp;WORKBOOK
          </p>

          {/* 메인 타이틀 */}
          <div className="flex flex-col gap-4">
            <h1 className="text-hero text-text-primary">
              뉴스를 읽고,<br />
              나만의 관점을 쌓다.
            </h1>
            <p className="font-sans text-[15px] leading-[1.7] text-text-secondary">
              오늘의 경제 뉴스에서 시작하는 작은 예측.<br />
              관찰한 변화와 당시 생각을 한 권의 기록으로 남겨보세요.
            </p>
          </div>

          {/* 구분선 */}
          <hr className="border-border-default" />

          {/* 3단계 설명 */}
          <ol className="flex flex-col gap-6">
            {steps.map((step) => (
              <li key={step.number} className="flex flex-col gap-1">
                <p className="font-sans text-[13px] font-semibold text-brand-primary">
                  {step.number}&nbsp;/&nbsp;{step.label}
                </p>
                <p className="font-sans text-[15px] text-text-primary">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 우측: 로그인 카드 */}
        <aside
          className="w-full rounded-card bg-surface-subtle p-8 md:w-[360px] md:shrink-0 lg:w-[400px]"
          aria-label="로그인"
        >
          <div className="flex flex-col gap-6">
            {/* 카드 헤더 */}
            <div className="flex flex-col gap-2">
              <h2 className="font-sans text-[18px] font-semibold leading-snug text-text-primary">
                나의 첫 기록을 시작하세요
              </h2>
              <p className="font-sans text-[14px] leading-[1.7] text-text-secondary">
                먼저 직접 생각하고, 관찰한 뒤 돌아보는 경제 학습 노트입니다.
              </p>
            </div>

            {/* 오류 메시지 */}
            {error && (
              <p role="alert" className="rounded-control bg-status-error-bg px-3 py-2 font-sans text-[13px] text-status-error">
                {error === 'kakao_denied'
                  ? '카카오 로그인을 취소했어요. 다시 시도해 주세요.'
                  : '로그인 중 문제가 발생했어요. 다시 시도해 주세요.'}
              </p>
            )}

            {/* 카카오 로그인 버튼 */}
            <button
              type="button"
              onClick={redirectToKakao}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-[#FEE500] px-4 py-3 font-sans text-[15px] font-semibold text-[#191919] transition-colors hover:bg-[#F0D800] active:bg-[#E0C800] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEE500]"
            >
              {/* 카카오 말풍선 아이콘 */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 2C5.582 2 2 4.91 2 8.5c0 2.28 1.373 4.283 3.45 5.484l-.88 3.278a.25.25 0 0 0 .375.277L9.1 15.17c.295.022.596.033.9.033 4.418 0 8-2.91 8-6.5S14.418 2 10 2Z"
                  fill="#191919"
                />
              </svg>
              카카오로 시작하기
            </button>

            {/* 약관 안내 */}
            <p className="text-center font-sans text-[12px] leading-[1.6] text-text-muted">
              계속하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
            </p>

            {/* 약관 링크 */}
            <div className="flex flex-col gap-3 border-t border-border-default pt-5">
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center font-sans text-[14px] text-text-secondary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary"
              >
                서비스 이용약관 보기 ↗
              </a>
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center font-sans text-[14px] text-text-secondary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary"
              >
                개인정보 처리방침 보기 ↗
              </a>
            </div>
          </div>
        </aside>
      </main>

      {/* 하단 푸터 */}
      <footer className="px-8 py-5 md:px-12">
        <p className="font-sans text-[12px] text-text-muted">
          FinSight&nbsp;/&nbsp;나만의 시장 관점을 쌓는 기록
        </p>
      </footer>
    </div>
  )
}
