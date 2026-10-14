import { Link } from 'react-router-dom'

type PolicyKind = 'terms' | 'privacy'

type PolicySection = { heading: string; body: string[] }

type PolicyContent = {
  title: string
  description: string
  effectiveDate: string
  sections: PolicySection[]
}

// 샘플(목) 약관 텍스트입니다. 실제 법적 효력이 있는 문구는 기획·법무 확정 후 교체합니다.
const CONTENT: Record<PolicyKind, PolicyContent> = {
  terms: {
    title: '서비스 이용약관',
    description: 'FinSight 서비스 이용에 관한 약관입니다.',
    effectiveDate: '2026-10-01',
    sections: [
      {
        heading: '제1조 (목적)',
        body: [
          '이 약관은 FinSight(이하 “서비스”)가 제공하는 경제 뉴스 학습 서비스의 이용 조건과 절차, 이용자와 서비스의 권리·의무 및 책임 사항을 규정하는 것을 목적으로 합니다.',
        ],
      },
      {
        heading: '제2조 (정의)',
        body: [
          '“이용자”란 이 약관에 따라 서비스를 이용하는 회원을 말합니다.',
          '“학습 기록”이란 이용자가 뉴스를 읽고 작성한 예측, 회고 등 서비스 내에서 생성한 콘텐츠를 말합니다.',
        ],
      },
      {
        heading: '제3조 (약관의 효력 및 변경)',
        body: [
          '이 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다.',
          '서비스는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용 일자와 사유를 명시하여 사전에 공지합니다.',
        ],
      },
      {
        heading: '제4조 (서비스의 제공)',
        body: [
          '서비스는 경제 뉴스 큐레이션, 예측 작성, AI 피드백, 학습 기록 보관 등의 기능을 제공합니다.',
          '서비스가 제공하는 뉴스와 피드백은 학습을 돕기 위한 정보이며, 투자 권유나 투자 자문에 해당하지 않습니다.',
        ],
      },
    ],
  },
  privacy: {
    title: '개인정보 처리방침',
    description: 'FinSight가 수집·이용하는 개인정보에 관한 방침입니다.',
    effectiveDate: '2026-10-01',
    sections: [
      {
        heading: '1. 수집하는 개인정보 항목',
        body: [
          '회원가입 및 로그인: 카카오 계정 식별자, 프로필 이름',
          '서비스 이용 과정: 학습 기록, 관심 설정, 접속 로그',
        ],
      },
      {
        heading: '2. 개인정보의 이용 목적',
        body: [
          '회원 식별 및 로그인 유지',
          '관심사 기반 뉴스 추천 및 학습 기록 보관',
          '서비스 품질 개선 및 오류 분석',
        ],
      },
      {
        heading: '3. 개인정보의 보유 및 이용 기간',
        body: [
          '회원 탈퇴 시 지체 없이 파기하는 것을 원칙으로 합니다.',
          '관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.',
        ],
      },
      {
        heading: '4. 이용자의 권리',
        body: [
          '이용자는 언제든지 자신의 개인정보 조회·수정·삭제를 요청할 수 있습니다.',
          '동의 철회 및 회원 탈퇴를 통해 개인정보 처리의 중단을 요청할 수 있습니다.',
        ],
      },
    ],
  },
}

/**
 * 약관/개인정보 처리방침 페이지.
 * 현재 본문은 샘플(목) 텍스트이며, 확정된 법적 문구로 교체 예정입니다.
 */
export default function PolicyPage({ kind }: { kind: PolicyKind }) {
  const { title, description, effectiveDate, sections } = CONTENT[kind]

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12 md:px-12 md:py-16">
      <header className="flex items-center justify-between">
        <Link
          to="/login"
          className="font-sans text-[14px] text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-brand-primary"
        >
          ← 돌아가기
        </Link>
        <span className="font-sans text-[15px] font-semibold text-text-primary">FinSight</span>
      </header>

      <div className="space-y-2">
        <h1 className="text-page text-text-primary">{title}</h1>
        <p className="font-sans text-[15px] text-text-secondary">{description}</p>
        <p className="font-sans text-[13px] text-text-muted">시행일 {effectiveDate}</p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="font-sans text-[16px] font-semibold text-text-primary">
              {section.heading}
            </h2>
            <div className="space-y-2">
              {section.body.map((paragraph, i) => (
                <p
                  key={i}
                  className="font-sans text-[14px] leading-[1.8] text-text-secondary"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
