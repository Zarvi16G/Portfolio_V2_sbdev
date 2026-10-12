import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { SECTIONS, UI, type SectionId } from '../data/content'
import { prefersReducedMotion } from '../hooks/useReducedMotion'
import { zoomOf } from '../hooks/useUiLayout'
import { useLang } from '../i18n/lang'
import type { KeyRect } from '../ui/SectionKeys'
import { About } from './About'
import { Contact } from './Contact'
import { Experience } from './Experience'
import { Projects } from './Projects'
import { Skills } from './Skills'

// Open: the room and the name zoom softly toward the pressed key and fade; the section grows out
// of the key's rectangle. Close (button or Esc): the reverse, ending exactly on the key.

export type SectionPhase = 'opening' | 'open' | 'closing'
export type ActiveSection = { id: SectionId; from: KeyRect }

const EASE = 'cubic-bezier(.65,0,.25,1)'
const zoomMs = () => (prefersReducedMotion() ? 1 : 950)
const rectOf = (el: Element): KeyRect => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height } }
const keyEl = (id: SectionId) => document.querySelector<HTMLElement>(`.key[data-section="${id}"]`)

// the portfolio behind (room + name, or the light version's background + name) zooms toward the key and fades
function zoomPortfolio(open: boolean, origin?: KeyRect) {
  const bg = document.querySelector<HTMLElement>('.room-canvas, .lite-room')
  const name = document.querySelector<HTMLElement>('.name-canvas, .lite-name')
  if (!bg || !name) return
  if (origin) {
    const o = `${(((origin.left + origin.width / 2) / innerWidth) * 100).toFixed(1)}% ${(((origin.top + origin.height / 2) / innerHeight) * 100).toFixed(1)}%`
    if (name.classList.contains('lite-name')) {
      // the light name is centered with a transform: put the origin in its own box
      const r = name.getBoundingClientRect()
      name.style.transformOrigin = `${origin.left + origin.width / 2 - r.left}px ${origin.top + origin.height / 2 - r.top}px`
    } else name.style.transformOrigin = o
    bg.style.transformOrigin = o
  }
  const a: Keyframe[] = [{ scale: '1', opacity: 1, filter: 'blur(0px)' }, { scale: '1.35', opacity: 0, filter: 'blur(6px)' }]
  const b: Keyframe[] = [{ scale: '1' }, { scale: '1.12' }]
  name.getAnimations().forEach((x) => x.cancel()); bg.getAnimations().forEach((x) => x.cancel())
  const opts = { duration: zoomMs(), easing: EASE, fill: open ? 'forwards' : 'none' } as const
  name.animate(open ? a : [...a].reverse(), opts)
  bg.animate(open ? b : [...b].reverse(), opts)
  name.style.pointerEvents = open ? 'none' : ''
}

// FLIP for the die box: it is mounted at its final size and place (so its canvas is measured once) and only its
// transform animates: a uniform scale (the smaller factor, so it never stretches) + a translate from the key's rect.
function flip(box: HTMLElement, key: KeyRect, open: boolean) {
  const to = box.getBoundingClientRect()
  const s = Math.min(key.width / to.width, key.height / to.height)
  const dx = key.left + key.width / 2 - (to.left + to.width / 2), dy = key.top + key.height / 2 - (to.top + to.height / 2)
  const small = { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0 }
  const big = { transform: 'none', opacity: 1 }
  return box.animate(open ? [small, big] : [big, small], { duration: zoomMs(), easing: EASE, fill: open ? 'none' : 'forwards' })
}

// a box (panel / card) grows out of the key's rect, or shrinks back into it
function morph(card: HTMLElement, from: KeyRect, open: boolean, base = 'translate(-50%, -50%)') {
  const to = card.getBoundingClientRect()
  const z = zoomOf(card)   // TV tier: translations inside a zoomed box are zoomed too
  const sx = from.width / to.width, sy = from.height / to.height
  const dx = (from.left + from.width / 2 - (to.left + to.width / 2)) / z, dy = (from.top + from.height / 2 - (to.top + to.height / 2)) / z
  const small = { transform: `${base} translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: open ? 0.4 : 0 }
  const big = { transform: base, opacity: 1 }
  return card.animate(open ? [small, big] : [big, small], { duration: zoomMs(), easing: EASE, fill: open ? 'none' : 'forwards' })
}

export function SectionHost({ active, phase, light, onPhase, onClosed }: {
  active: ActiveSection | null
  phase: SectionPhase | null
  light: boolean
  onPhase: (p: SectionPhase) => void
  onClosed: (id: SectionId) => void
}) {
  const { t } = useLang()
  const root = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLButtonElement>(null)
  const timer = useRef(0)

  const isSkills = active?.id === 'skills'
  const sideBySide = isSkills && !light

  // ---- open ----
  useLayoutEffect(() => {
    if (!active || phase !== 'opening' || !root.current) return
    const { from } = active
    const ms = zoomMs()
    zoomPortfolio(true, from)
    back.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms * 0.5, delay: ms * 0.5, fill: 'backwards' })
    if (sideBySide) {
      // the die grows from the key into its box on the left; the summary slides in
      const box = root.current.querySelector<HTMLElement>('.die-box'), panel = root.current.querySelector<HTMLElement>('.panel')
      if (box) flip(box, from, true)
      panel?.animate([{ opacity: 0, transform: innerWidth > 860 ? 'translateX(40px)' : 'translateY(40px)' }, { opacity: 1, transform: 'none' }],
        { duration: ms * 0.7, delay: ms * 0.35, easing: EASE, fill: 'backwards' })
    } else {
      const card = root.current.querySelector<HTMLElement>('.projects, .panel')
      if (card) { card.scrollTop = 0; morph(card, from, true) }
    }
    timer.current = window.setTimeout(() => {
      onPhase('open')
      back.current?.focus({ preventScroll: true })
    }, ms)
    return () => clearTimeout(timer.current)
  }, [active, phase, sideBySide, onPhase])

  // ---- close: the reverse, ending exactly on the key ----
  const close = useCallback(() => {
    if (!active || phase !== 'open' || !root.current) return
    onPhase('closing')
    const id = active.id
    const key = keyEl(id)
    const to = key ? rectOf(key) : active.from
    const ms = zoomMs()
    zoomPortfolio(false)
    const done = () => onClosed(id)   // the key shows again and takes the focus back (SectionKeys)
    let anim: Animation | undefined
    if (sideBySide) {
      const box = root.current.querySelector<HTMLElement>('.die-box'), panel = root.current.querySelector<HTMLElement>('.panel')
      panel?.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: innerWidth > 860 ? 'translateX(40px)' : 'translateY(40px)' }],
        { duration: ms * 0.5, easing: EASE, fill: 'forwards' })
      if (box) anim = flip(box, to, false)
    } else {
      const card = root.current.querySelector<HTMLElement>('.projects, .panel')
      if (card) anim = morph(card, to, false)
    }
    if (anim) anim.finished.then(done, done)
    else done()
  }, [active, phase, sideBySide, onPhase, onClosed])

  // Esc closes (a section's own pop-ups catch Esc first, in the capture phase)
  useEffect(() => {
    if (phase !== 'open') return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [phase, close])

  if (!active) return null

  return (
    <div ref={root} className="section-host" role="dialog" aria-modal="true" aria-label={t(SECTIONS.find((s) => s.id === active.id)!.label)}>
      <button ref={back} className="close" type="button" onClick={close} hidden={phase === 'closing'}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
        {t(UI.back)}
      </button>
      {active.id === 'skills' && <Skills interactive={phase === 'open'} light={light} />}
      {active.id === 'projects' && <Projects />}
      {active.id === 'experience' && <Experience />}
      {active.id === 'about' && <About />}
      {active.id === 'contact' && <Contact openDelay={zoomMs() * 0.7} />}
    </div>
  )
}
