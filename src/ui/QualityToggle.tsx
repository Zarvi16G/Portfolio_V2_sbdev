import { useRef } from 'react'
import { QUALITY } from '../data/content'
import { useLang } from '../i18n/lang'
import type { Pref } from '../perf/lightMode'
import { useQuality } from '../perf/quality'

const OPTIONS: Pref[] = ['auto', 'full', 'lite']

// "Auto | 3D | Lite": same look as the EN | ES pill. A radiogroup: Tab enters on the checked option,
// arrow keys move and choose. With Auto checked, a dot marks the version the detection picked.
export function QualityToggle() {
  const { t } = useLang()
  const { pref, auto, loading, choose } = useQuality()
  const group = useRef<HTMLDivElement>(null)

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = OPTIONS[(OPTIONS.indexOf(pref) + step + OPTIONS.length) % OPTIONS.length]
    choose(next)
    requestAnimationFrame(() => group.current?.querySelector<HTMLButtonElement>(`[data-q="${next}"]`)?.focus())
  }

  return (
    <div ref={group} className="lang quality" role="radiogroup" aria-label={t(QUALITY.label)} onKeyDown={onKey}>
      {OPTIONS.map((q, i) => {
        const picked = pref === 'auto' && q === auto
        return (
          <span key={q} className="lang-opt">
            {i > 0 && <span className="lang-sep" aria-hidden="true">|</span>}
            <button
              type="button" role="radio" data-q={q}
              aria-checked={pref === q}
              tabIndex={pref === q ? 0 : -1}
              className={picked ? 'picked' : undefined}
              aria-description={picked ? t(QUALITY.autoPicked) : undefined}
              onClick={() => choose(q)}
            >
              {t(QUALITY[q])}
              {q === 'full' && loading && <span className="q-spin" role="status" aria-label={t(QUALITY.loading)} />}
            </button>
          </span>
        )
      })}
    </div>
  )
}
