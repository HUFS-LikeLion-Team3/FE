import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Choice } from '@/components/ui/Choice'
import { FilterChip } from '@/components/ui/FilterChip'
import { TextArea, TextField } from '@/components/ui/TextField'

export default function UiPreviewPage() {
  const [direction, setDirection] = useState('up')
  const [filter, setFilter] = useState('all')
  const [interest, setInterest] = useState(false)
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState('')

  return (
    <main className="mx-auto max-w-content space-y-12 px-4 py-12 min-[375px]:px-5 md:px-8 lg:px-12">
      <header className="space-y-4">
        <p className="font-mono text-label font-medium text-brand-primary">FINSIGHT / UI</p>
        <h1 className="text-page">공용 컴포넌트</h1>
        <p className="text-ui text-text-secondary">개발 환경에서 상태와 키보드 동작을 확인하는 화면입니다.</p>
        <Link to="/" className="inline-flex min-h-11 items-center text-control text-brand-primary underline">홈으로 이동</Link>
      </header>
      <section className="space-y-4" aria-labelledby="buttons">
        <h2 id="buttons" className="text-section">버튼</h2>
        {(['primary', 'secondary', 'text'] as const).map(variant => (
          <div key={variant} className="flex flex-wrap gap-4">
            <Button variant={variant} className="w-[184px]" onClick={() => setMessage('버튼을 눌렀어요.')}>예측 제출하기</Button>
            <Button variant={variant} className="w-[184px]" disabled>예측 제출하기</Button>
            <Button variant={variant} className="w-[184px]" loading>예측 제출하기</Button>
          </div>
        ))}
        <p role="status" className="min-h-6 text-meta text-status-success">{message}</p>
      </section>
      <section className="space-y-4" aria-labelledby="fields">
        <h2 id="fields" className="text-section">입력 필드</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="판단 이유 · 선택" placeholder="판단에 참고한 요소를 기록해보세요." helperText="비워 두어도 괜찮아요." />
          <TextField label="입력한 판단 이유" defaultValue="발표 전 시장 기대도 함께 살펴봤어요." helperText="비워 두어도 괜찮아요." />
          <TextField label="저장 오류" error="저장하지 못했어요. 다시 시도해주세요." placeholder="판단에 참고한 요소를 기록해보세요." />
          <TextField label="최종 제출한 판단 이유" readOnly defaultValue="발표 전 시장 기대도 함께 살펴봤어요." helperText="최종 제출한 예측은 수정할 수 없어요." />
          <TextField label="비활성 입력" disabled placeholder="판단에 참고한 요소를 기록해보세요." helperText="비워 두어도 괜찮아요." />
        </div>
        <form className="space-y-4" onSubmit={event => {
          event.preventDefault()
          const reflection = new FormData(event.currentTarget).get('reflection')
          setError(typeof reflection === 'string' && reflection.trim() ? undefined : '회고를 한 문장 이상 작성해주세요.')
        }}>
          <TextArea label="회고 작성" name="reflection" error={error} helperText="제출 버튼으로 오류 안내 연결을 확인합니다." />
          <Button type="submit">회고 입력 확인</Button>
        </form>
      </section>
      <section className="space-y-4" aria-labelledby="choices">
        <h2 id="choices" className="text-section">선택</h2>
        <fieldset className="space-y-3">
          <legend className="mb-3 text-control font-medium">예상 방향</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {[['up', '상승 예상'], ['flat', '큰 변화 없음'], ['down', '하락 예상']].map(([value, label]) => (
              <Choice key={value} type="radio" name="direction" value={value} label={label} checked={direction === value} onChange={() => setDirection(value)} />
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice type="checkbox" label="반도체 관심 분야" checked={interest} onChange={event => setInterest(event.target.checked)} />
          <Choice type="checkbox" label="비활성 선택" disabled />
        </div>
      </section>
      <section className="space-y-4" aria-labelledby="filters">
        <h2 id="filters" className="text-section">필터</h2>
        <div className="flex flex-wrap gap-3" role="group" aria-label="뉴스 분야">
          {[['all', '전체'], ['semiconductor', '반도체'], ['rates', '금리']].map(([value, label]) => (
            <FilterChip key={value} selected={filter === value} className="w-[184px]" onClick={() => setFilter(value)}>{label}</FilterChip>
          ))}
          <FilterChip selected={false} disabled className="w-[184px]">비활성 필터</FilterChip>
        </div>
      </section>
      <section className="space-y-4" aria-labelledby="typography">
        <h2 id="typography" className="text-section">타이포그래피</h2>
        <p className="text-hero">경제 뉴스로 시장을 해석하는 연습</p>
        <p className="text-news-title">금리 변화가 시장에 미치는 영향</p>
        <p className="max-w-[720px] text-news-body">뉴스에서 읽은 사실과 나의 예측을 연결하고, 관측 결과를 보며 판단 과정을 돌아봅니다.</p>
        <p className="text-number text-market-up">+1.24%</p>
      </section>
    </main>
  )
}
