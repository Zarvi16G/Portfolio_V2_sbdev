import { useLayoutEffect, useRef } from 'react'
import { QUALITY } from '../data/content'
import { useUiLayoutVersion } from '../hooks/useUiLayout'
import { useLang } from '../i18n/lang'
import { useQuality } from '../perf/quality'

// Shown 5 s when the automatic detection switches to the light version; "Load 3D" loads it and saves the choice.
export function QualityNotice() {
  const { t } = useLang()
  const { notice, choose, dismissNotice } = useQuality()
  const el = useRef<HTMLDivElement>(null)
  const uiLayout = useUiLayoutVersion()
  // just under the keys
  useLayoutEffect(() => {
    const keys = document.querySelector('.keys')
    if (el.current && keys) el.current.style.top = `${keys.getBoundingClientRect().bottom + 10}px`
  }, [notice, uiLayout])
  if (!notice) return null
  return (
    <div className="q-notice" role="status" ref={el}>
      <span>{t(QUALITY.notice)}</span>
      <span aria-hidden="true">·</span>
      <button type="button" className="q-notice-load" onClick={() => choose('full')}>{t(QUALITY.load3d)}</button>
      <button type="button" className="q-notice-x" aria-label={t(QUALITY.dismiss)} onClick={dismissNotice}>×</button>
    </div>
  )
}
