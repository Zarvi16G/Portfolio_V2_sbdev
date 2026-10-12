import { useLayoutEffect, useRef } from 'react'
import { NAME_LINES } from '../data/content'
import { useUiLayoutVersion } from '../hooks/useUiLayout'

// Light version: the name as HTML text, at the same place and size as the 3D one:
// ~20% of the screen height (16% on phones), within 60% of the width (86% on phones), 14px under the keys.
export function LightName() {
  const el = useRef<HTMLHeadingElement>(null)
  const uiLayout = useUiLayoutVersion()

  useLayoutEffect(() => {
    const h1 = el.current
    if (!h1) return
    const fit = () => {
      const w = innerWidth, h = innerHeight, phone = w < 640
      const keys = document.querySelector('.keys')
      const top = (keys ? keys.getBoundingClientRect().bottom : 80) + 14
      // two lines at line-height 1.12 -> 2.24em tall
      let size = (h * (phone ? 0.16 : 0.2)) / 2.24
      h1.style.fontSize = `${size}px`
      const maxW = w * (phone ? 0.86 : 0.6)
      if (h1.scrollWidth > maxW) size *= maxW / h1.scrollWidth
      h1.style.fontSize = `${size}px`
      h1.style.top = `${top}px`
    }
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [uiLayout])

  return <h1 ref={el} className="light-name" aria-label="Santiago Boada.dev">{NAME_LINES.map((l) => <span key={l} aria-hidden="true">{l}</span>)}</h1>
}
