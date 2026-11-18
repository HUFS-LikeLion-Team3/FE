// Preserve authored paragraphs. Older single-block responses get visual breaks only.
function feedbackParagraphs(content: string): string[] {
  const paragraphs = content.trim().split(/\n\s*\n/).filter(Boolean)
  if (paragraphs.length !== 1 || content.includes('\n') || content.length < 180 || typeof Intl.Segmenter !== 'function') return paragraphs
  const sentences = [...new Intl.Segmenter('ko', { granularity: 'sentence' }).segment(content)].map(part => part.segment)
  if (sentences.length < 2) return paragraphs
  const groups: string[] = []
  let current = ''
  let count = 0
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > 180) {
      groups.push(current.trim())
      current = ''
      count = 0
    }
    current += sentence
    count += 1
    if (current.length >= 120 || count === 2) {
      groups.push(current.trim())
      current = ''
      count = 0
    }
  }
  if (current.trim()) groups.push(current.trim())
  return groups
}

export default function FeedbackBody({ content, muted = false, interpretation = false }: { content: string; muted?: boolean; interpretation?: boolean }) {
  return <div className={`space-y-6 break-words text-ui ${muted ? 'text-text-secondary' : ''}`}>
    {feedbackParagraphs(content).map((paragraph, index) => {
      const label = /^(핵심 개념|판단|이유|근거|결과|적용|확인할 조건|관측 사실|AI 해석)\s*[:：]\s*/.exec(paragraph)
      if (!label) return <p key={index} className="whitespace-pre-wrap leading-[1.85]">{paragraph}</p>
      const concept = label[1] === '핵심 개념'
      return <div key={index} className={concept ? 'space-y-2 rounded-control bg-surface-subtle p-4 sm:p-5' : 'space-y-2'}>
        <h3 className={`text-meta font-semibold ${concept ? 'text-brand-primary' : 'text-text-secondary'}`}>{interpretation && label[1] === '판단' ? 'AI 해석' : label[1]}</h3>
        <p className="whitespace-pre-wrap leading-[1.85]">{paragraph.slice(label[0].length)}</p>
      </div>
    })}
  </div>
}
