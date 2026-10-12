// Which version to show: 3D ("full") or light ("lite"). The decision, in this order:
//   1. ?quality=full | ?quality=lite in the URL (?light=0 / ?light=1 also work)
//   2. the visitor's choice in the selector, saved in localStorage "sb-quality"
//   3. automatic: device checks now, and a frame-rate check once the 3D is running (never saved)

export type Mode = 'full' | 'lite'
export type Pref = Mode | 'auto'

const KEY = 'sb-quality'

export function readUrlMode(): Mode | null {
  const params = new URLSearchParams(location.search)
  const q = params.get('quality') ?? ({ '1': 'lite', '0': 'full' } as Record<string, string>)[params.get('light') ?? '']
  return q === 'full' || q === 'lite' ? q : null
}

// a manual choice replaces the URL override: drop the parameter so a reload keeps the choice
export function clearUrlMode() {
  const url = new URL(location.href)
  if (!url.searchParams.has('quality') && !url.searchParams.has('light')) return
  url.searchParams.delete('quality'); url.searchParams.delete('light')
  history.replaceState(history.state, '', url)
}

export function readPref(): Pref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'full' || v === 'lite') return v
  } catch { /* storage blocked */ }
  return 'auto'
}

export function savePref(p: Pref) {
  try {
    if (p === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, p)
  } catch { /* storage blocked */ }
}

// Device checks, before any 3D code loads: light when there is no WebGL2, deviceMemory <= 2,
// hardwareConcurrency <= 2 or prefers-reduced-data.
export function detectDevice(): Mode {
  let gl2 = false
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    gl2 = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch { /* no WebGL */ }
  if (!gl2) return 'lite'
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return 'lite'
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) return 'lite'
  if (matchMedia('(prefers-reduced-data: reduce)').matches) return 'lite'
  return 'full'
}

// Frame-rate check once the 3D is running: skip the first 30 frames (shader compile, textures), then measure
// until 5 s after the start (at least from 2 s on); onSlow if the average is under 20 fps. Returns a cancel function.
export function watchFrameRate(onSlow: () => void, { skipFrames = 30, from = 2000, to = 5000, minFps = 20 } = {}) {
  let frames = 0, counted = 0, startAt = 0, raf = 0
  const t0 = performance.now()
  const tick = (now: number) => {
    frames++
    if (!startAt) {
      if (frames >= skipFrames && now - t0 >= from) { startAt = now; counted = 0 }
    } else {
      counted++
      if (now - t0 >= to && now - startAt >= 1000) {
        if ((counted * 1000) / (now - startAt) < minFps) onSlow()
        return
      }
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
