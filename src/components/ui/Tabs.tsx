import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type TabItem<K extends string = string> = { key: K; label: string }

// 탭 버튼과 패널을 연결하는 id. Tabs와 TabPanel이 같은 idPrefix·key로 같은 값을 만든다.
const tabId = (prefix: string, key: string) => `${prefix}-tab-${key}`
const tabPanelId = (prefix: string, key: string) => `${prefix}-panel-${key}`

type TabsProps<K extends string> = {
  tabs: readonly TabItem<K>[]
  value: K
  onChange: (key: K) => void
  /** tablist의 접근 가능한 이름 */
  label: string
  /** 같은 화면에 탭 그룹이 여러 개일 때 id가 겹치지 않게 하는 접두사 */
  idPrefix: string
  className?: string
}

/**
 * 선택한 탭에 따라 아래 패널의 내용이 바뀌는 탭 목록.
 * 방향키(←/→)·Home·End로 이동하며, 포커스가 이동하면 해당 탭이 선택된다.
 * 선택한 탭의 내용은 같은 idPrefix를 쓰는 TabPanel로 감싼다.
 */
export function Tabs<K extends string>({ tabs, value, onChange, label, idPrefix, className }: TabsProps<K>) {
  const refs = useRef(new Map<K, HTMLButtonElement>())

  const move = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length]
    onChange(next.key)
    refs.current.get(next.key)?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowRight': move(index + 1); break
      case 'ArrowLeft': move(index - 1); break
      case 'Home': move(0); break
      case 'End': move(tabs.length - 1); break
      default: return
    }
    event.preventDefault()
  }

  return (
    <div role="tablist" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {tabs.map((tab, index) => {
        const selected = tab.key === value
        return (
          <button
            key={tab.key}
            ref={node => {
              if (node) refs.current.set(tab.key, node)
              else refs.current.delete(tab.key)
            }}
            type="button"
            role="tab"
            id={tabId(idPrefix, tab.key)}
            aria-selected={selected}
            aria-controls={selected ? tabPanelId(idPrefix, tab.key) : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={event => handleKeyDown(event, index)}
            className={cn(
              'inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border px-4 py-2 text-control font-medium',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
              selected
                ? 'border-brand-primary bg-brand-subtle text-brand-primary'
                : 'border-border-default bg-surface-canvas text-text-primary',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/** 선택된 탭의 내용을 담는 패널. 내용에 포커스할 요소가 없어도 키보드로 도달할 수 있게 tabIndex 0을 가진다. */
export function TabPanel({ idPrefix, tabKey, className, children }: { idPrefix: string; tabKey: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={tabPanelId(idPrefix, tabKey)}
      aria-labelledby={tabId(idPrefix, tabKey)}
      tabIndex={0}
      className={cn('focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary', className)}
    >
      {children}
    </div>
  )
}
