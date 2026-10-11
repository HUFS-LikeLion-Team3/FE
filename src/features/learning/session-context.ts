import { createContext, useContext } from 'react'
import type { Draft, Target } from './model'

export type Session = {
  targets: Target[]
  draft: Draft; setDraft: (draft: Draft) => void
  saved: Draft; savedAt: string | null; save: () => void; discard: () => void
  submitted: Draft | null; submit: () => void; dirty: boolean
}
export const SessionContext = createContext<Session | null>(null)

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('UI preview requires SessionProvider')
  return value
}
