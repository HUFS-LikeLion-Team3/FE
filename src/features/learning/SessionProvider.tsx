import { useState, type ReactNode } from 'react'
import type { Draft } from './model'
import { SessionContext } from './session-context'
import { emptyDraft, fixtureTargets, selectedTargets } from './fixtures'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [targets] = useState(() => fixtureTargets[new URLSearchParams(window.location.search).get('fixture') ?? 'two'] ?? selectedTargets)
  const [draft, setDraft] = useState(() => emptyDraft(targets))
  const [saved, setSaved] = useState(() => emptyDraft(targets))
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Draft | null>(null)
  const save = () => { setSaved(structuredClone(draft)); setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })) }
  return <SessionContext.Provider value={{ targets, draft, setDraft, saved, savedAt, save, discard: () => setDraft(structuredClone(saved)), submitted, submit: () => { setSubmitted(structuredClone(draft)); setSaved(structuredClone(draft)) }, dirty: JSON.stringify(draft) !== JSON.stringify(saved) }}>{children}</SessionContext.Provider>
}
