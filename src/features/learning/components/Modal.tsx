import { useEffect, useId, useRef, type ReactNode } from 'react'

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    return () => { dialog.close(); previous?.focus() }
  }, [])
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const controls = Array.from(ref.current!.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')).filter(node => node.getClientRects().length > 0)
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (!first) { event.preventDefault(); return }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }} className="fixed inset-0 m-auto max-h-[90vh] w-[720px] max-w-[calc(100vw-48px)] overflow-y-auto rounded-card border border-border-default bg-surface-canvas p-8 text-text-primary backdrop:bg-overlay-scrim">
    <h2 id={titleId} className="mb-6 text-page">{title}</h2>
    <div className="space-y-6">{children}</div>
  </dialog>
}
