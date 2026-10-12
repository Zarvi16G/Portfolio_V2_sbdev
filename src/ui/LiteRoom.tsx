import { useLayoutEffect, useRef } from 'react'
import { BUBBLES } from '../data/content'
import lite from '../data/lite.json'
import { useUiLayoutVersion } from '../hooks/useUiLayout'
import { useLang } from '../i18n/lang'
import type { SetupKind } from '../scene/DeskSetup'
import { roomBridge } from '../scene/roomBridge'

// Light version: the room as a static image captured from the 3D one (scripts/capture-lite.ts).
// <picture> picks the capture closest to the screen's shape; the image covers the screen and is shifted so the
// wall/floor line lands where the 3D camera puts it. Invisible buttons over the person and the plant open the
// same speech bubbles as in 3D (positions from lite.json, in % of the image).

type Room = (typeof lite.rooms)[number]
const byFile = (src: string) => lite.rooms.find((r) => src.endsWith(r.file)) ?? lite.rooms[0]
const room = (w: number, h: number) => lite.rooms.find((r) => r.width === w && r.height === h)!
const R1440 = room(1440, 900), R820 = room(820, 1180), R390 = room(390, 844)
const WATER_MS = 2000

export function LiteRoom({ hidden = false }: { hidden?: boolean }) {
  const { t } = useLang()
  const box = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const meta = useRef<Room>(R1440)
  const uiLayout = useUiLayoutVersion()

  useLayoutEffect(() => {
    const fit = () => {
      const b = box.current, i = img.current
      if (!b || !i) return
      const m = (meta.current = byFile(i.currentSrc || i.src))
      const w = innerWidth, h = innerHeight
      const s = Math.max(w / m.width, h / m.height)                 // cover
      const iw = m.width * s, ih = m.height * s
      const tiles = document.querySelector('.tiles')
      const horizon = Math.min(0.7, Math.max(0.56, (tiles ? tiles.getBoundingClientRect().top / h : 0.82) - 0.14)) * h
      const top = Math.min(0, Math.max(h - ih, horizon - (m.horizon / 100) * ih))   // line up the wall/floor line, keep covering
      Object.assign(b.style, { width: `${iw}px`, height: `${ih}px`, left: `${(w - iw) / 2}px`, top: `${top}px` })
      const spots = b.querySelectorAll<HTMLElement>('[data-bubble]')
      spots.forEach((el) => {
        const r = m.hotspots[el.dataset.bubble as SetupKind]
        Object.assign(el.style, { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` })
      })
    }
    const i = img.current
    fit()
    i?.addEventListener('load', fit)
    addEventListener('resize', fit)

    // the speech bubbles ask the room where things are, as in 3D
    const screenOf = (kind: SetupKind) => {
      const r = box.current!.getBoundingClientRect(), a = meta.current.anchors[kind]
      return { x: r.left + (a.x / 100) * r.width, y: r.top + (a.y / 100) * r.height }
    }
    roomBridge.project = (kind) => screenOf(kind)
    roomBridge.pick = (x, y) => {
      const r = box.current!.getBoundingClientRect()
      for (const kind of ['person', 'plant'] as SetupKind[]) {
        const s = meta.current.hotspots[kind]
        const l = r.left + (s.x / 100) * r.width, tp = r.top + (s.y / 100) * r.height
        if (x >= l && x <= l + (s.w / 100) * r.width && y >= tp && y <= tp + (s.h / 100) * r.height) return kind
      }
      return null
    }
    // no watering can here: the text changes, and after 2 s the plant says thanks
    let waterTimer = 0
    roomBridge.water = (onDone) => { waterTimer = window.setTimeout(onDone, WATER_MS) }

    return () => {
      i?.removeEventListener('load', fit)
      removeEventListener('resize', fit)
      clearTimeout(waterTimer)
      roomBridge.project = roomBridge.pick = roomBridge.water = null
    }
  }, [uiLayout])

  return (
    <div className="lite-room" inert={hidden}>
      <div className="lite-room-box" ref={box}>
        <picture>
          <source media="(max-aspect-ratio: 57/100)" srcSet={`/lite/${R390.file}`} />
          <source media="(max-aspect-ratio: 105/100)" srcSet={`/lite/${R820.file}`} />
          <img ref={img} src={`/lite/${R1440.file}`} alt="" decoding="async" />
        </picture>
        <button type="button" className="lite-spot" data-bubble="person" aria-label={t(BUBBLES.personSpot)} />
        <button type="button" className="lite-spot" data-bubble="plant" aria-label={t(BUBBLES.plantSpot)} />
      </div>
    </div>
  )
}
