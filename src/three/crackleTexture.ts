// Tileable 512px crackle glaze -> { map, bump } canvases (procedural, no image files).
const N = 512
const hex = (h: number) => [(h >> 16) & 255, (h >> 8) & 255, h & 255]
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t)
const sstep = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }
const WHITE = [255, 255, 255]

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function valueNoise(p: number, seed: number) {
  const r = rng(seed), g = Float32Array.from({ length: p * p }, r)
  return (x: number, y: number) => {
    const fx = x * p, fy = y * p, x0 = Math.floor(fx), y0 = Math.floor(fy)
    const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    const xa = ((x0 % p) + p) % p, xb = (xa + 1) % p, ya = ((y0 % p) + p) % p, yb = (ya + 1) % p
    const a = g[ya * p + xa], b = g[ya * p + xb], c = g[yb * p + xa], d = g[yb * p + xb]
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}
function fbm(base: number, oct: number, seed: number) {
  const L = Array.from({ length: oct }, (_, o) => valueNoise(base * 2 ** o, seed + o * 101))
  return (x: number, y: number) => { let v = 0, amp = 0.5, tot = 0; for (const n of L) { v += n(x, y) * amp; tot += amp; amp *= 0.5 } return v / tot }
}
function voronoi(cells: number, seed: number) {
  const r = rng(seed), pts = Float32Array.from({ length: cells * cells * 2 }, r)
  return (x: number, y: number) => {
    const fx = x * cells, fy = y * cells, cx = Math.floor(fx), cy = Math.floor(fy)
    let f1 = 9, f2 = 9
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const gx = cx + i, gy = cy + j, wx = ((gx % cells) + cells) % cells, wy = ((gy % cells) + cells) % cells
      const k = (wy * cells + wx) * 2, d = Math.hypot(gx + pts[k] - fx, gy + pts[k + 1] - fy)
      if (d < f1) { f2 = f1; f1 = d } else if (d < f2) f2 = d
    }
    return [f1, f2]
  }
}

// base = glaze color, crack = color inside the cracks. The glaze lightens toward white
// with a soft noise tone (as in reference.html).
export function crackle(base: number, crack: number) {
  const B = hex(base), C = hex(crack)
  const v1 = voronoi(9, 11), v2 = voronoi(23, 29), n = fbm(6, 3, 5)
  const map = document.createElement('canvas'), bump = document.createElement('canvas')
  map.width = map.height = bump.width = bump.height = N
  const mi = map.getContext('2d')!.createImageData(N, N), bi = bump.getContext('2d')!.createImageData(N, N)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N, [a1, b1] = v1(u, v), [a2, b2] = v2(u, v)
    const k = Math.max(1 - sstep(0, 0.035, b1 - a1), (1 - sstep(0, 0.03, b2 - a2)) * 0.45), tone = (n(u, v) - 0.5) * 0.08
    const c = mix(mix(B, WHITE, Math.max(0, tone)), C, k * 0.75), h = Math.round(Math.min(1, Math.max(0, 0.85 - k * 0.7 + tone)) * 255)
    const i = (y * N + x) * 4
    mi.data.set([c[0], c[1], c[2], 255], i); bi.data.set([h, h, h, 255], i)
  }
  map.getContext('2d')!.putImageData(mi, 0, 0); bump.getContext('2d')!.putImageData(bi, 0, 0)
  return { map, bump }
}
