import { useRef, useState } from 'react'
import { SECTIONS, UI, type SectionId } from '../data/content'
import { prefersReducedMotion } from '../hooks/useReducedMotion'
import { useLang } from '../i18n/lang'
import { Icon } from './icons'
import { LangToggle } from './LangToggle'

export type KeyRect = { left: number; top: number; width: number; height: number }

// Five keycaps at the top center. Click: the key sinks and flashes wine for 200 ms,
// then the section opens from the key's rectangle.
export function SectionKeys({ onOpen, disabled = false, hiddenKey = null }: {
  onOpen: (id: SectionId, rect: KeyRect, key: HTMLButtonElement) => void
  disabled?: boolean
  hiddenKey?: SectionId | null
}) {
  const { t } = useLang()
  const [pressed, setPressed] = useState<SectionId | null>(null)
  const busy = useRef(false)

  const press = (id: SectionId, el: HTMLButtonElement) => {
    if (disabled || busy.current) return
    busy.current = true
    setPressed(id)
    setTimeout(() => {
      setPressed(null)
      busy.current = false
      const r = el.getBoundingClientRect()
      onOpen(id, { left: r.left, top: r.top, width: r.width, height: r.height }, el)
    }, prefersReducedMotion() ? 0 : 200)
  }

  return (
    <nav className={`keys${disabled ? ' is-hidden' : ''}`} aria-label={t(UI.sectionsNav)} inert={disabled}>
      {SECTIONS.map((s) => (
        <span key={s.id} className="key-base">
          <button
            type="button"
            className={`key${pressed === s.id ? ' pressed' : ''}`}
            data-section={s.id}
            style={hiddenKey === s.id ? { visibility: 'hidden' } : undefined}
            onClick={(e) => press(s.id, e.currentTarget)}
          >
            <Icon name={s.icon} />
            <span>{t(s.label)}</span>
          </button>
        </span>
      ))}
      {/* phones and tablets: the language pill sits with the keys (see keys-tiles.css) */}
      <LangToggle placement="keys" />
    </nav>
  )
}
