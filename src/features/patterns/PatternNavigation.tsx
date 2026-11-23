import { Link } from 'react-router-dom'
import { FilterChip } from '@/components/ui/FilterChip'
import { linkClass, PageTitle } from '../learning/components/PagePrimitives'

type PatternKind = 'reasoning' | 'outcome'

export function WorkbookNavigation({ patterns = false }: { patterns?: boolean }) {
  return <nav aria-label="학습 기록 메뉴" className="flex flex-wrap gap-2">
    <Link to="/learning" aria-current={!patterns ? 'page' : undefined} className={`${linkClass} min-w-44 ${patterns ? 'border border-border-default' : 'bg-brand-subtle text-brand-primary'}`}>학습 기록</Link>
    <Link to="/learning?tab=patterns" aria-current={patterns ? 'page' : undefined} className={`${linkClass} min-w-44 ${patterns ? 'bg-brand-subtle text-brand-primary' : 'border border-border-default'}`}>학습 패턴</Link>
  </nav>
}

export function PatternHeading({ title, description }: { title: string; description: string }) {
  return <PageTitle label="MY WORKBOOK / PATTERNS" title={title} description={description} />
}

export function PatternNavigation({ kind, onChange }: { kind: PatternKind; onChange: (kind: PatternKind) => void }) {
  return <>
    <WorkbookNavigation patterns />
    <div className="flex flex-wrap gap-2" role="group" aria-label="학습 패턴 종류">
      <FilterChip className="w-60" selected={kind === 'reasoning'} onClick={() => onChange('reasoning')}>판단 이유 패턴</FilterChip>
      <FilterChip className="w-60" selected={kind === 'outcome'} onClick={() => onChange('outcome')}>관측 결과 패턴</FilterChip>
    </div>
  </>
}
