// Light version for weak devices: decided once on load, before any 3D canvas mounts.
// Light when: no WebGL2, deviceMemory <= 2, hardwareConcurrency <= 2 or prefers-reduced-data.
// After mount, a slow first 2 s (< 24 fps average) also switches to light, remembered for the session.
// Dev overrides: ?light=1 forces light, ?light=0 forces the full version.

const SESSION_KEY = 'sb-light'

export type LightReason = 'forced' | 'no-webgl2' | 'low-memory' | 'few-cores' | 'reduced-data' | 'slow-fps'
export type Quality = { light: boolean; reason: LightReason | null }

export function detectQuality(): Quality {
  const force = new URLSearchParams(location.search).get('light')
  if (force === '1') return { light: true, reason: 'forced' }
  if (force === '0') return { light: false, reason: null }

  try {
    if (sessionStorage.getItem(SESSION_KEY) === 'slow-fps') return { light: true, reason: 'slow-fps' }
  } catch { /* storage blocked */ }

  let gl2 = false
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    gl2 = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch { /* no WebGL */ }
  if (!gl2) return { light: true, reason: 'no-webgl2' }

  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return { light: true, reason: 'low-memory' }
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) return { light: true, reason: 'few-cores' }
  if (matchMedia('(prefers-reduced-data: reduce)').matches) return { light: true, reason: 'reduced-data' }
  return { light: false, reason: null }
}

// Measures the average frame rate over the first 2 s; calls onSlow if it is under 24 fps.
export function watchFirstFrames(onSlow: () => void, ms = 2000, minFps = 24) {
  let frames = 0, raf = 0
  const start = performance.now()
  const tick = (now: number) => {
    frames++
    if (now - start < ms) { raf = requestAnimationFrame(tick); return }
    const fps = (frames * 1000) / (now - start)
    if (fps < minFps) {
      try { sessionStorage.setItem(SESSION_KEY, 'slow-fps') } catch { /* storage blocked */ }
      onSlow()
    }
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
