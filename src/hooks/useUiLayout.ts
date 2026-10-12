import { useEffect, useState } from 'react'

// A counter that changes whenever the keys or the tiles change size or wrap
// (language switch, font load, breakpoints), so the 3D framing can follow them.
export function useUiLayoutVersion() {
  const [v, setV] = useState(0)
  useEffect(() => {
    const ro = new ResizeObserver(() => setV((n) => n + 1))
    let tries = 0, raf = 0
    const attach = () => {
      const els = document.querySelectorAll('.keys, .tiles')
      if (els.length < 2 && tries++ < 60) { raf = requestAnimationFrame(attach); return }
      els.forEach((el) => ro.observe(el))
    }
    attach()
    document.fonts?.ready.then(() => setV((n) => n + 1))
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return v
}

// The UI zoom of an element (TV tier); positions measured on screen are divided by it before use inside.
export const zoomOf = (el: Element | null) => (el ? parseFloat(getComputedStyle(el).zoom) || 1 : 1)
