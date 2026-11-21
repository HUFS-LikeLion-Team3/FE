import type { SessionDto } from './api/contracts'

export function sessionDestination(session: Pick<SessionDto, 'id' | 'status'>) {
  if (session.status === 'drafting') return `/learning/${session.id}/edit`
  if (session.status === 'completed') return `/learning/${session.id}`
  return `/learning/${session.id}/results`
}
