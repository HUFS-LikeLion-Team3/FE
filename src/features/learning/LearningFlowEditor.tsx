import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import PredictionPage, { type EditorSession } from './PredictionPage'
import TargetSelectionPage from './TargetSelectionPage'
import { learningApi as api } from './api/service'
import { blankDraft, formatTime, type PageData } from './api/page-data'
import { validateDraft, type Draft } from './model'
import { sessionDestination } from './session-routes'

export default function LearningFlowEditor({ data, queryKey }: { data: PageData; queryKey: (string | undefined)[] }) {
  const queryClient = useQueryClient()
  const candidates = [...new Map([...data.news.targets, ...data.targets].map(t => [t.marketTargetId ?? t.id, { ...t, id: t.marketTargetId ?? t.id }])).values()]
  const initialDraft: Draft = { ...blankDraft(candidates), ...data.draft }
  const [draft, setDraft] = useState<Draft>(() => structuredClone(initialDraft))
  const [saved, setSaved] = useState(() => ({ draft: structuredClone(initialDraft), ids: data.targets.map(t => t.id) }))
  const [ids, setIds] = useState(saved.ids)
  const [selection, setSelection] = useState(!ids.length)
  const [selectionBefore, setSelectionBefore] = useState(ids)
  const [savedAt, setSavedAt] = useState(data.session?.savedAt ? formatTime(data.session.savedAt) : null)
  const sessionRef = useRef(data.session)
  const pending = useRef(false)
  const targets = ids.map(id => candidates.find(t => t.id === id)!).filter(Boolean)
  const persist = async () => {
    if (!targets.length || targets.length > 3) throw new ApiError(400)
    const snapshot = structuredClone(draft)
    let session = sessionRef.current
    if (!session) { session = await api.create(data.news.id); sessionRef.current = session }
    if (session.status !== 'drafting') throw new ApiError(409)
    const selected = await api.select(session.id, targets)
    for (const target of targets) {
      const remote = selected.targets.find(t => t.isSelected && t.marketTargetId === target.id)
      if (!remote) throw new ApiError(502, 'contract')
      await api.save(session.id, remote.sessionTargetId, snapshot[target.id])
    }
    session = await api.session(session.id)
    sessionRef.current = session
    setSaved({ draft: snapshot, ids: [...ids] })
    setSavedAt(session.savedAt ? formatTime(session.savedAt) : null)
    queryClient.setQueryData<PageData>(queryKey, { ...data, targets, session, draft: snapshot })
    void queryClient.invalidateQueries({ queryKey: ['assigned-page', 'news', data.news.id], refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: ['learning-sessions'], refetchType: 'none' })
    return session.id
  }
  const perform = async (submit: boolean): Promise<string | void> => {
    if (pending.current) throw new ApiError(409)
    pending.current = true
    try {
      if (submit && sessionRef.current) {
        const current = await api.session(sessionRef.current.id)
        sessionRef.current = current
        if (current.status !== 'drafting') return sessionDestination(current)
      }
      if (submit && validateDraft(draft, targets)) throw new ApiError(400)
      const id = await persist()
      if (!submit) return
      try { await api.submit(id) } catch (error) {
        const current = await api.session(id)
        if (current.status === 'drafting') throw error
        sessionRef.current = current
      }
      queryClient.removeQueries({ queryKey: ['workbook', id], exact: true })
      return `/learning/${id}/feedback`
    } finally { pending.current = false }
  }
  const editor: EditorSession = { draft, setDraft, savedAt,
    dirty: JSON.stringify(draft) !== JSON.stringify(saved.draft) || JSON.stringify(ids) !== JSON.stringify(saved.ids),
    discard: () => { setDraft(structuredClone(saved.draft)); setIds([...saved.ids]) },
  }
  const selector = selection ? <TargetSelectionPage news={data.news} candidates={candidates} selected={ids} onToggle={id => setIds(previous => previous.includes(id) ? previous.filter(t => t !== id) : previous.length < 3 ? [...previous, id] : previous)} onContinue={() => setSelection(false)} onCancel={selectionBefore.length ? () => { setIds(selectionBefore); setSelection(false) } : undefined} /> : undefined
  return <PredictionPage news={data.news} targets={targets} session={editor} newsHref={`/news/${data.news.id}`} feedbackHref={`/news/${data.news.id}`} selection={selector} onRequestTargetChange={() => { setSelectionBefore([...ids]); setSelection(true) }} onSave={async () => { await perform(false) }} onSubmit={() => perform(true)} />
}
