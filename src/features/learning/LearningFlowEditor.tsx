import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import PredictionPage, { type EditorSession } from './PredictionPage'
import TargetSelectionPage from './TargetSelectionPage'
import { learningApi, replayLearningApi } from './api/service'
import { blankDraft, formatTime, type PageData } from './api/page-data'
import { validateDraft, type Draft } from './model'
import { replayFeedbackHref, sessionDestination } from './session-routes'

export default function LearningFlowEditor({ data, queryKey, replay = false }: { data: PageData; queryKey: (string | undefined)[]; replay?: boolean }) {
  const api = replay ? replayLearningApi : learningApi
  const sessionType = replay ? 'replay' : 'live'
  const newsHref = replay ? `/replay/${data.news.id}` : `/news/${data.news.id}`
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
  const readSession = async (id: string) => {
    const current = await api.session(id)
    if (current.id !== id || current.newsId !== data.news.id || current.sessionType !== sessionType) throw new ApiError(502, 'contract')
    return current
  }
  const persist = async (id: string) => {
    const snapshot = structuredClone(draft)
    const selected = await api.select(id, targets)
    if (selected.learningSessionId !== id) throw new ApiError(502, 'contract')
    for (const target of targets) {
      const remote = selected.targets.find(t => t.isSelected && t.marketTargetId === target.id)
      if (!remote) throw new ApiError(502, 'contract')
      const stored = await api.save(id, remote.sessionTargetId, snapshot[target.id])
      if (stored.sessionTargetId !== remote.sessionTargetId) throw new ApiError(502, 'contract')
    }
    const session = await readSession(id)
    sessionRef.current = session
    setSaved({ draft: snapshot, ids: [...ids] })
    setSavedAt(session.savedAt ? formatTime(session.savedAt) : null)
    queryClient.setQueryData<PageData>(queryKey, { ...data, targets, session, draft: snapshot })
    void queryClient.invalidateQueries({ queryKey: ['assigned-page', 'news', data.news.id], refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: ['learning-sessions'], refetchType: 'none' })
  }
  const perform = async (submit: boolean): Promise<string | void> => {
    if (pending.current) throw new ApiError(409)
    if (!targets.length || targets.length > 3) throw new ApiError(400)
    pending.current = true
    try {
      if (submit && validateDraft(draft, targets)) throw new ApiError(400)
      const current = sessionRef.current
        ? submit ? await readSession(sessionRef.current.id) : sessionRef.current
        : await api.create(data.news.id, sessionType)
      if (current.newsId !== data.news.id || current.sessionType !== sessionType) throw new ApiError(502, 'contract')
      sessionRef.current = current
      if (current.status !== 'drafting') {
        if (submit) return sessionDestination(current)
        throw new ApiError(409)
      }
      const id = current.id
      await persist(id)
      if (!submit) return
      try {
        const result = await api.submit(id)
        if (result.sessionId !== id) throw new ApiError(502, 'contract')
      } catch (error) {
        const current = await readSession(id)
        if (current.status === 'drafting') throw error
        sessionRef.current = current
      }
      queryClient.removeQueries({ queryKey: ['workbook', id], exact: true })
      void queryClient.invalidateQueries({ queryKey: ['learning-sessions'] })
      return replay ? replayFeedbackHref(id) : `/learning/${id}/feedback`
    } finally { pending.current = false }
  }
  const editor: EditorSession = { draft, setDraft, savedAt,
    dirty: JSON.stringify(draft) !== JSON.stringify(saved.draft) || JSON.stringify(ids) !== JSON.stringify(saved.ids),
    discard: () => { setDraft(structuredClone(saved.draft)); setIds([...saved.ids]) },
  }
  const selector = selection ? <TargetSelectionPage news={data.news} replayNewsHref={replay ? newsHref : undefined} candidates={candidates} selected={ids} onToggle={id => setIds(previous => previous.includes(id) ? previous.filter(t => t !== id) : previous.length < 3 ? [...previous, id] : previous)} onContinue={() => setSelection(false)} onCancel={selectionBefore.length ? () => { setIds(selectionBefore); setSelection(false) } : undefined} /> : undefined
  return <PredictionPage news={data.news} targets={targets} session={editor} replay={replay} newsHref={newsHref} feedbackHref={newsHref} selection={selector} onRequestTargetChange={() => { setSelectionBefore([...ids]); setSelection(true) }} onSave={async () => { await perform(false) }} onSubmit={() => perform(true)} />
}
