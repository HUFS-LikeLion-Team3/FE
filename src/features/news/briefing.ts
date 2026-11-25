export type BriefingSection = { title: string; body: string }

const MAX_HEADING_LENGTH = 30

/**
 * 브리핑 원문을 빈 줄 기준 문단으로 나눈다.
 * 문단 첫 줄이 짧고 문장으로 끝나지 않으면 소제목으로 보고, 나머지를 본문으로 쓴다.
 */
export function parseBriefing(text: string, fallbackTitle = '주요 내용'): BriefingSection[] {
  const blocks = text.replace(/\r\n?/g, '\n').split(/\n[ \t]*\n/).map(block => block.trim()).filter(Boolean)
  return blocks.map(block => {
    const [first, ...rest] = block.split('\n')
    const heading = first.trim()
    const body = rest.join('\n').trim()
    if (body && heading.length <= MAX_HEADING_LENGTH && !/[.!?。…]$/.test(heading)) return { title: heading, body }
    return { title: fallbackTitle, body: block }
  })
}

/** 목록·카드 미리보기용 첫 문단 본문 */
export function briefingSummary(text: string) {
  return parseBriefing(text)[0]?.body ?? ''
}
