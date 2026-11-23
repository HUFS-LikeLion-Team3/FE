import type { SessionDto } from './api/contracts'

export const replayFeedbackHref = (id: string) => `/replay/session/${id}/feedback`
export const replayResultsHref = (id: string) => `/replay/${id}/results`

export function sessionDestination(session: Pick<SessionDto, 'id' | 'status' | 'sessionType' | 'newsId' | 'resultsRevealedAt'>) {
  if (session.sessionType === 'replay') {
    if (session.status === 'drafting') return `/replay/${session.newsId}/predict`
    return session.resultsRevealedAt ? replayResultsHref(session.id) : replayFeedbackHref(session.id)
  }
  if (session.status === 'drafting') return `/learning/${session.id}/edit`
  if (session.status === 'completed') return `/learning/${session.id}`
  return `/learning/${session.id}/results`
}
