import { Button } from '@/components/ui/Button'
import { Modal } from '@/features/learning/components/Modal'

export type EvidenceEntry = { title: string; lines: string[] }
export type EvidenceView = { title: string; description: string; entries: EvidenceEntry[] }

export function PatternEvidence({ view, onClose }: { view: EvidenceView; onClose: () => void }) {
  return <Modal title={view.title} onClose={onClose}>
    <p className="text-meta text-text-muted">{view.description}</p>
    {view.entries.map((entry, index) => <article key={index} className="space-y-5 rounded-card border border-border-default p-6">
      <h3 className="flex items-start gap-3 font-sans text-xl font-semibold leading-7">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-brand-subtle font-mono text-meta font-normal text-brand-primary">{String(index + 1).padStart(2, '0')}</span>
        {entry.title}
      </h3>
      {entry.lines.map((line, lineIndex) => <p key={lineIndex} className="whitespace-pre-wrap break-words text-ui leading-[30px]">{line}</p>)}
    </article>)}
    <Button variant="text" className="w-full" onClick={onClose}>패턴으로 돌아가기</Button>
  </Modal>
}
