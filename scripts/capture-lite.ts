// Captures the static images of the light version from the 3D version.
//   npm run capture:lite        (CHROMIUM_PATH=/path/to/chromium to use another browser)
//
// - public/lite/room-<w>x<h>.webp: the room + desk setup (no keys, tiles or name) at 1440x900, 820x1180 and 390x844, 2x
// - public/lite/name.webp: the porcelain name alone, transparent background, 2x, cropped to its pixels
// - src/data/lite.json: per room image, the wall/floor line, the bubble anchors and the person / plant
//   hotspots (all in % of the image), projected from the same 3D anchors
//
// Captured with prefers-reduced-motion: the name is already in place and still, the screens show written code,
// so every run gives the same images.

import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, type Browser, type Page } from 'playwright-core'
import { createServer } from 'vite'

const OUT = new URL('../public/lite/', import.meta.url)
const ROOMS = [[1440, 900], [820, 1180], [390, 844]] as const
const DPR = 2
const MAX_BYTES = 250 * 1024
const CHROMIUM = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium'

type Rect = { x: number; y: number; w: number; h: number }
type RoomMeta = { file: string; width: number; height: number; horizon: number; anchors: Record<'person' | 'plant', { x: number; y: number }>; hotspots: Record<'person' | 'plant', Rect> }

const server = await createServer({ server: { port: 0, strictPort: false }, logLevel: 'error' })
await server.listen()
const base = server.resolvedUrls!.local[0]
const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })

async function open(b: Browser, width: number, height: number, hideCss: string) {
  const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: DPR, reducedMotion: 'reduce', locale: 'en-US' })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.error('  page error:', e.message))
  await page.goto(`${base}?quality=full`)
  await page.addStyleTag({ content: hideCss })
  // the room registers its pick/project functions once the setup is built; then give the name and its font time
  await page.evaluate(async () => { (window as any).__rb = (await import('/src/scene/roomBridge.ts')).roomBridge })
  await page.waitForFunction(() => (window as any).__rb.pick !== null, null, { timeout: 120_000 })
  await page.waitForTimeout(6000)
  return page
}

// PNG -> WebP in the browser itself (no image library needed); optional crop to the opaque pixels
async function encode(page: Page, png: Buffer, trim: boolean) {
  const enc = await page.context().browser()!.newPage()
  const out = await enc.evaluate(async ({ b64, trim, max }) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode()
    let c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    let g = c.getContext('2d')!; g.drawImage(img, 0, 0)
    if (trim) {
      const d = g.getImageData(0, 0, c.width, c.height).data
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      const pad = 4, cx = Math.max(0, x0 - pad), cy = Math.max(0, y0 - pad), cw = Math.min(c.width, x1 + pad + 1) - cx, ch = Math.min(c.height, y1 + pad + 1) - cy
      const t = document.createElement('canvas'); t.width = cw; t.height = ch; t.getContext('2d')!.drawImage(c, cx, cy, cw, ch, 0, 0, cw, ch)
      c = t; g = t.getContext('2d')!
    }
    for (let q = 0.8; q >= 0.5; q -= 0.05) {                     // ~80, lower only if the file is over budget
      const url = c.toDataURL('image/webp', q), bytes = Math.round(((url.length - 23) * 3) / 4)
      if (bytes <= max || q < 0.55) return { url, q: Math.round(q * 100), w: c.width, h: c.height, bytes }
    }
    throw new Error('unreachable')
  }, { b64: png.toString('base64'), trim, max: MAX_BYTES })
  await enc.close()
  return { ...out, data: Buffer.from(out.url.split(',')[1], 'base64') }
}

await mkdir(OUT, { recursive: true })
const meta: { rooms: RoomMeta[]; name: { file: string; width: number; height: number } } = { rooms: [], name: { file: '', width: 0, height: 0 } }

// ---- the room, three sizes ----
for (const [w, h] of ROOMS) {
  console.log(`room ${w}x${h}…`)
  const page = await open(browser, w, h, '.keys, .tiles, .lang, .name-canvas { visibility: hidden !important; }')
  const info = await page.evaluate(() => {
    const rb = (window as any).__rb
    const tiles = document.querySelector('.tiles')!.getBoundingClientRect().top
    const horizon = Math.min(0.7, Math.max(0.56, tiles / innerHeight - 0.14))   // same line as the 3D camera framing
    const anchors = { person: rb.project('person', false), plant: rb.project('plant', false) }
    const box: Record<string, [number, number, number, number]> = {}
    for (let y = 0; y < innerHeight; y += 3) for (let x = 0; x < innerWidth; x += 3) {
      const k = rb.pick(x, y); if (!k) continue
      const b = box[k] ?? (box[k] = [x, y, x, y]); b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y)
    }
    return { horizon, anchors, box }
  })
  const png = await page.screenshot({ type: 'png' })
  const img = await encode(page, png, false)
  const file = `room-${w}x${h}.webp`
  await writeFile(new URL(file, OUT), img.data)
  const pct = (v: number, of: number) => +((v / of) * 100).toFixed(2)
  const rect = (b: [number, number, number, number]): Rect => ({ x: pct(b[0], w), y: pct(b[1], h), w: pct(b[2] - b[0] + 3, w), h: pct(b[3] - b[1] + 3, h) })
  meta.rooms.push({
    file, width: w, height: h, horizon: pct(info.horizon * h, h),
    anchors: { person: { x: pct(info.anchors.person.x, w), y: pct(info.anchors.person.y, h) }, plant: { x: pct(info.anchors.plant.x, w), y: pct(info.anchors.plant.y, h) } },
    hotspots: { person: rect(info.box.person), plant: rect(info.box.plant) },
  })
  console.log(`  ${file}: ${img.w}x${img.h}, ${(img.bytes / 1024).toFixed(0)} KB (q${img.q})`)
  await page.context().close()
}

// ---- the name alone, transparent ----
console.log('name…')
{
  const page = await open(browser, 1440, 900, '.room-canvas, .keys, .tiles, .lang { visibility: hidden !important; } html, body { background: transparent !important; }')
  const png = await page.screenshot({ type: 'png', omitBackground: true })
  const img = await encode(page, png, true)
  await writeFile(new URL('name.webp', OUT), img.data)
  meta.name = { file: 'name.webp', width: img.w / DPR, height: img.h / DPR }
  console.log(`  name.webp: ${img.w}x${img.h}, ${(img.bytes / 1024).toFixed(0)} KB (q${img.q})`)
  await page.context().close()
}

await writeFile(new URL('../src/data/lite.json', import.meta.url), JSON.stringify(meta, null, 2) + '\n')
console.log('lite.json written')
await browser.close()
await server.close()
