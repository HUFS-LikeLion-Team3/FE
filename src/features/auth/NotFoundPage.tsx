import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { linkClass, Notice, PageTitle, Shell } from '@/features/learning/components/PagePrimitives'

export default function NotFoundPage() {
  useEffect(() => { document.title = '페이지를 찾을 수 없어요 | FinSight' }, [])
  return <Shell responsive>
    <PageTitle label="NOT FOUND" title="페이지를 찾을 수 없어요" description="주소가 바뀌었거나 더 이상 제공하지 않는 화면이에요." />
    <Notice title="입력한 주소를 확인해 주세요">홈이나 학습 기록에서 원하는 화면으로 다시 이동할 수 있어요.</Notice>
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link to="/" className={`${linkClass} bg-brand-primary text-surface-canvas hover:bg-brand-hover`}>홈으로 가기</Link>
      <Link to="/learning" className={`${linkClass} border border-border-default text-brand-primary`}>학습 기록 보기</Link>
    </div>
  </Shell>
}
