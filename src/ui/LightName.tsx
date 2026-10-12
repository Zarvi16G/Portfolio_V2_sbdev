import { useLayoutEffect, useRef } from 'react'
import lite from '../data/lite.json'
import { useUiLayoutVersion } from '../hooks/useUiLayout'

// Light version: the porcelain name as an image captured from the 3D one, at the same place and size:
// ~20% of the screen height (16% on phones), within 60% of the width (86% on phones), 14px under the keys.
const RATIO = lite.name.width / lite.name.height

export function LightName() {
  const el = useRef<HTMLImageElement>(null)
  const uiLayout = useUiLayoutVersion()

  useLayoutEffect(() => {
    const img = el.current
    if (!img) return
    const fit = () => {
      const w = innerWidth, h = innerHeight, phone = w < 640
      const keys = document.querySelector('.keys')
      const height = Math.min(h * (phone ? 0.16 : 0.2), (w * (phone ? 0.86 : 0.6)) / RATIO)
      Object.assign(img.style, { height: `${height}px`, width: `${height * RATIO}px`, top: `${(keys ? keys.getBoundingClientRect().bottom : 80) + 14}px` })
    }
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [uiLayout])

  return (
    <h1 className="lite-name-wrap">
      <img ref={el} className="lite-name" src={`/lite/${lite.name.file}`} alt="Santiago Boada.dev" decoding="async" />
    </h1>
  )
}
