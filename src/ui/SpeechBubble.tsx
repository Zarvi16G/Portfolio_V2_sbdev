import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BUBBLES } from '../data/content'
import { useLang, Rich } from '../i18n/lang'
import type { SetupKind } from '../scene/DeskSetup'
import { roomBridge } from '../scene/roomBridge'

type PlantPhase = 'ask' | 'watering' | 'thanks'

// Comic speech bubbles over the person and the plant. Clicks reach the room through a window
// listener in the capture phase (the name canvas covers the room); a hit stops the click so the
// name intro does not replay.
export function SpeechBubbles({ enabled }: { enabled: boolean }) {
  const { t } = useLang()
  const [open, setOpen] = useState<SetupKind | null>(null)
  const [phase, setPhase] = useState<PlantPhase>('ask')
  const watering = useRef(false)
  const raised = useRef(false)
  const el = useRef<HTMLDivElement>(null)

  const hide = useCallback(() => {
    setOpen(null)
    if (!watering.current) raised.current = false
  }, [])

  const show = useCallback((kind: SetupKind) => {
    setOpen(kind)
    if (kind === 'plant' && !watering.current) { setPhase('ask'); raised.current = false }
  }, [])

  // place the bubble above its anchor every frame while it is open (no React state per frame)
  const place = useCallback(() => {
    const node = el.current, kind = node?.dataset.kind as SetupKind | undefined
    if (!node || !kind || !roomBridge.project) return
    const { x, y } = roomBridge.project(kind, kind === 'plant' && raised.current)
    const half = ((node.firstElementChild as HTMLElement | null)?.offsetWidth || 200) / 2
    node.style.left = `${Math.max(16 + half, Math.min(x, innerWidth - 16 - half))}px`
    node.style.top = `${y}px`
  }, [])

  useLayoutEffect(() => {
    const node = el.current
    if (!open || !node) return
    node.style.transition = 'none'           // appear in place; the slide is only for moving up while watering
    place()
    void node.offsetWidth
    node.style.transition = ''
    let raf = requestAnimationFrame(function loop() { place(); raf = requestAnimationFrame(loop) })
    return () => cancelAnimationFrame(raf)
  }, [open, place])

  // clicks and the "help" cursor over the person / plant; Esc closes
  useEffect(() => {
    if (!enabled) { hide(); return }
    const inRoom = (target: EventTarget | null) => target instanceof Element && !!target.closest('.room-canvas, .name-canvas, .lite-room')
    const onClick = (e: MouseEvent) => {
      if (!inRoom(e.target)) return
      // light version: the invisible buttons over the person / plant (also reached with the keyboard)
      const spot = (e.target as Element).closest<HTMLElement>('[data-bubble]')
      const kind = (spot?.dataset.bubble as SetupKind | undefined) ?? roomBridge.pick?.(e.clientX, e.clientY)
      if (kind) { e.stopPropagation(); e.preventDefault(); show(kind) } else hide()
    }
    const onMove = (e: PointerEvent) => {
      const name = document.querySelector<HTMLElement>('.name-canvas')   // light version: the buttons have cursor: help
      if (!name || !inRoom(e.target)) return
      name.style.cursor = roomBridge.pick?.(e.clientX, e.clientY) ? 'help' : ''
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide() }
    addEventListener('click', onClick, true)
    addEventListener('pointermove', onMove)
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('click', onClick, true)
      removeEventListener('pointermove', onMove)
      removeEventListener('keydown', onKey)
    }
  }, [enabled, hide, show])

  // "Let's talk" = press the Contact key: it sinks, flashes wine and Contact opens
  const talk = () => {
    hide()
    document.querySelector<HTMLButtonElement>('.key[data-section="contact"]')?.click()
  }

  const water = () => {
    if (watering.current || !roomBridge.water) return
    watering.current = true
    raised.current = true
    setPhase('watering')
    roomBridge.water(() => {
      watering.current = false
      setPhase('thanks')
    })
  }

  // after "thank you", close by itself
  useEffect(() => {
    if (phase !== 'thanks' || open !== 'plant') return
    const id = setTimeout(hide, 2400)
    return () => clearTimeout(id)
  }, [phase, open, hide])

  if (!open || !enabled) return null
  const isPerson = open === 'person'
  const text = isPerson ? BUBBLES.person : phase === 'ask' ? BUBBLES.plant : phase === 'watering' ? BUBBLES.watering : BUBBLES.thanks

  return (
    <div ref={el} className="bubble" data-kind={open} role="dialog" aria-label={t(isPerson ? BUBBLES.personLabel : BUBBLES.plantLabel)}>
      <div className="bubble-in" key={open}>
        <span aria-live="polite"><Rich text={t(text)} /></span>
        {isPerson && <button className="bubble-btn" type="button" onClick={talk}>{t(BUBBLES.talk)}</button>}
        {!isPerson && phase === 'ask' && <button className="bubble-btn" type="button" onClick={water}>{t(BUBBLES.water)}</button>}
      </div>
    </div>
  )
}
