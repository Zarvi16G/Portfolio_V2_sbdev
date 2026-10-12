import * as THREE from 'three'

// A monitor screen: a 512x288 canvas that "types" 12 lines of colored code bars,
// holds 1.4 s when full, flashes white and starts a new program.
const COLORS = ['#e0577f', '#9ea2ab', '#c9ccd3', '#b3154a', '#6b6f78', '#f4eff2', '#d9a35a']

type Line = { indent: number; segs: { w: number; c: string }[]; w: number }

export function codeScreen(seed: number, withMark: boolean, reduceMotion: boolean) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 288
  const g = c.getContext('2d')!, tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
  const r = (() => { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296 } })()
  let lines: Line[] = []
  function newProgram() {
    lines = []; let indent = 0
    const n = 12
    for (let i = 0; i < n; i++) {
      if (i > 0 && r() < 0.3 && indent < 3) indent++; else if (r() < 0.35 && indent > 0) indent--
      const segs: Line['segs'] = []; let w = 0, k = 1 + Math.floor(r() * 3)
      while (k--) { const sw = 22 + r() * 90; segs.push({ w: sw, c: COLORS[Math.floor(r() * COLORS.length)] }); w += sw + 8 }
      lines.push({ indent, segs, w })
    }
  }
  newProgram()
  const total = () => lines.reduce((a, l) => a + l.w, 0)
  let shown = 0, holdUntil = 0, flash = 0
  function draw(cursorOn: boolean) {
    g.fillStyle = '#17151c'; g.fillRect(0, 0, 512, 288)
    g.fillStyle = '#211e27'; g.fillRect(0, 0, 512, 22)                    // title bar
    ;['#e0577f', '#6b6f78', '#6b6f78'].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(14 + i * 14, 11, 4, 0, 7); g.fill() })
    g.fillStyle = '#1b1920'; g.fillRect(0, 22, 30, 266)                     // line-number gutter
    let left = shown, cx = 0, cy = 0
    lines.forEach((l, i) => {
      const y = 36 + i * 19
      g.fillStyle = '#3a3742'; g.fillRect(10, y, 10, 6)
      let x = 40 + l.indent * 20
      for (const s of l.segs) {
        if (left <= 0) break
        const w = Math.min(s.w, left); left -= s.w + 8
        g.fillStyle = s.c; g.globalAlpha = 0.9
        g.beginPath(); g.roundRect(x, y, w, 7, 3.5); g.fill(); g.globalAlpha = 1
        cx = x + w + 3; cy = y; x += s.w + 8
      }
    })
    if (cursorOn) { g.fillStyle = '#f4eff2'; g.fillRect(cx, cy - 2, 2, 11) }
    if (withMark) {                                                          // tiny coral sparkle in the corner (not a logo)
      const mx = 497, my = 274, s = 6
      g.fillStyle = '#d97757'; g.beginPath()
      g.moveTo(mx, my - s); g.quadraticCurveTo(mx + 1, my - 1, mx + s, my); g.quadraticCurveTo(mx + 1, my + 1, mx, my + s)
      g.quadraticCurveTo(mx - 1, my + 1, mx - s, my); g.quadraticCurveTo(mx - 1, my - 1, mx, my - s); g.fill()
    }
    if (flash > 0) { g.fillStyle = `rgba(244,239,242,${flash})`; g.fillRect(0, 22, 512, 266) }
    tex.needsUpdate = true
  }
  let last = 0
  function update(now: number) {
    if (now - last < 45) return; last = now
    if (holdUntil) {
      if (now > holdUntil) { holdUntil = 0; shown = 0; newProgram(); flash = 0.35 }   // boom: start again
    } else {
      shown += 14 + r() * 26
      if (shown >= total()) { shown = total(); holdUntil = now + 1400 }
    }
    flash = Math.max(0, flash - 0.07)
    draw(Math.floor(now / 450) % 2 === 0)
  }
  if (reduceMotion) { shown = total() * 0.7; draw(false) }
  else draw(true)
  return { tex, update }
}
