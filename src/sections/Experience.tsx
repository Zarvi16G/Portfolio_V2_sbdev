import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EXPERIENCE, type Checkpoint } from '../data/content'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { zoomOf } from '../hooks/useUiLayout'
import { useLang } from '../i18n/lang'
import { CoinFaces } from '../ui/Coin'

// Experience: a CSS-3D game board with a winding road from START (bottom) to the top.
// Upright coins stand on it; hover (desktop) or tap (phones) opens the checkpoint window.

const ROAD = 'M260 1010 C 260 920, 150 910, 150 820 C 150 700, 380 660, 380 520 C 380 380, 210 350, 210 210 C 210 130, 300 90, 300 10'
const TODO = 'M380 520 C 380 380, 210 350, 210 210 C 210 130, 300 90, 300 10'
const DONE = 'M260 1010 C 260 920, 150 910, 150 820 C 150 700, 380 660, 380 520'
// where each coin stands on the board (px), and which side its label goes
const PINS: { left: number; top: number; side?: 'left' }[] = [
  { left: 150, top: 822 }, { left: 380, top: 522, side: 'left' }, { left: 210, top: 212 },
]
const touch = () => matchMedia('(hover: none)').matches

function CheckpointCard({ cp }: { cp: Checkpoint }) {
  const { t } = useLang()
  const goal = cp.kind === 'goal'
  return (
    <>
      <div className="xp-top">
        <span>{t(cp.context)}</span><span>{t(cp.when)}</span>
        {cp.kind === 'now' && <span className="live">{t(EXPERIENCE.current)}</span>}
      </div>
      <h3>{t(goal ? EXPERIENCE.goalTitle : cp.company)}<span>{t(cp.role)}</span></h3>
      <p className="xp-lead">{t(cp.lead)}</p>
      <ul>{cp.bullets.map((b, i) => <li key={i}><span>{t(b)}</span></li>)}</ul>
      {cp.tags.length > 0 && <div className="xp-tags">{cp.tags.map((g, i) => <span key={i}>{t(g)}</span>)}</div>}
      <p className="xp-why"><b>{t(cp.whyLabel)}</b> {t(cp.why)}</p>
    </>
  )
}

export function Experience() {
  const { t } = useLang()
  const reduceMotion = useReducedMotion()
  const view = useRef<HTMLElement>(null), stage = useRef<HTMLDivElement>(null), board = useRef<HTMLDivElement>(null)
  const pop = useRef<HTMLDivElement>(null), done = useRef<SVGPathElement>(null)
  const coins = useRef<(HTMLButtonElement | null)[]>([])
  const [open, setOpen] = useState<number | null>(null)
  const [isTouch] = useState(touch)
  const [last, setLast] = useState(0)   // keeps the window's content while it fades out
  useEffect(() => { if (open !== null) setLast(open) }, [open])

  // the board scales to the stage: the road and its labels need ~420px; the board's edges may crop
  const layout = useCallback((animate: boolean) => {
    const s = stage.current, b = board.current
    if (!s || !b) return
    const k = Math.min(1, (s.clientWidth - 8) / 420, s.clientHeight / 560)
    b.style.setProperty('--k', k.toFixed(3))
    if (animate && !reduceMotion) {
      b.animate([{ transform: `translateX(-50%) scale(${k}) rotateX(20deg)` }, { transform: `translateX(-50%) scale(${k}) rotateX(56deg)` }], { duration: 1100, easing: 'cubic-bezier(.2,.8,.2,1)' })
      done.current?.animate([{ strokeDashoffset: 600, opacity: 0 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 1300, delay: 400, easing: 'ease-out', fill: 'backwards' })
      b.classList.add('xp-anim')
    }
  }, [reduceMotion])

  useLayoutEffect(() => { layout(true) }, [layout])

  // place the checkpoint window: beside the board on wide screens, above / below the coin on narrow ones
  const place = useCallback(() => {
    const i = open, v = view.current, p = pop.current, b = board.current, c = i === null ? null : coins.current[i]
    if (!v || !p || !b || !c) return
    // work in the view's own units (TV tier: the view is zoomed, screen rects are not)
    const z = zoomOf(v)
    const local = (r: DOMRect) => ({ left: r.left / z, top: r.top / z, right: r.right / z, bottom: r.bottom / z, width: r.width / z, height: r.height / z })
    const sr = local(v.getBoundingClientRect()), cr = local(c.getBoundingClientRect()), br = local(b.getBoundingClientRect())
    const pw = p.offsetWidth, ph = p.offsetHeight
    let left: number, top: number
    if (sr.width >= 900) {
      const roomR = sr.right - br.right, roomL = br.left - sr.left
      left = roomR >= roomL ? br.right - sr.left + 24 : br.left - sr.left - pw - 24
      left = Math.max(12, Math.min(left, sr.width - pw - 12))
      top = cr.top + cr.height / 2 - sr.top + v.scrollTop - ph / 2
      top = Math.max(v.scrollTop + 8, Math.min(top, v.scrollTop + v.clientHeight - ph - 8))
    } else {
      left = Math.max(12, Math.min(cr.left - sr.left + cr.width / 2 - pw / 2, sr.width - pw - 12))
      top = cr.top - sr.top + v.scrollTop - ph - 14
      if (top < v.scrollTop + 8) top = cr.bottom - sr.top + v.scrollTop + 14
    }
    p.style.left = `${left}px`; p.style.top = `${top}px`
  }, [open])

  useLayoutEffect(place, [place, t])

  useEffect(() => {
    const onResize = () => { layout(false); place() }
    addEventListener('resize', onResize)
    return () => removeEventListener('resize', onResize)
  }, [layout, place])

  // Esc closes the window first (before it closes the section)
  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); setOpen(null) } }
    addEventListener('keydown', onKey, true)
    return () => removeEventListener('keydown', onKey, true)
  }, [open])

  const cps = EXPERIENCE.checkpoints

  return (
    <section className="projects xp" ref={view} aria-labelledby="xp-title">
      <header className="proj-head">
        <span className="eyebrow">{t(EXPERIENCE.eyebrow)}</span>
        <h2 id="xp-title">{t(EXPERIENCE.title)}</h2>
        <span className="xp-hint">{t(isTouch ? EXPERIENCE.hintTap : EXPERIENCE.hintHover)}</span>
      </header>
      <div className="xp-stage" ref={stage} onClick={(e) => { if (!(e.target as Element).closest('.coin')) setOpen(null) }}>
        <div className="xp-board" ref={board}>
          <svg className="road" viewBox="0 0 520 1000" aria-hidden="true">
            <path className="edge" d={ROAD} />
            <path className="lane" d={ROAD} />
            <path className="todo" d={TODO} />
            <path className="done" ref={done} d={DONE} />
            <text className="start" x="300" y="975">{t(EXPERIENCE.start)}</text>
          </svg>
          {PINS.map((p, i) => <span key={`s${i}`} className="xp-shadow" style={{ left: p.left, top: p.top - 2 }} />)}
          <span className="xp-here" style={{ left: 380, top: 520 }} aria-hidden="true" />
          {cps.map((cp, i) => (
            <div key={cp.n} className={`xp-pin${PINS[i].side ? ' left' : ''}`} style={{ left: PINS[i].left, top: PINS[i].top }}>
              <button
                ref={(el) => { coins.current[i] = el }}
                className={`coin${cp.kind === 'now' ? ' now' : ''}${cp.kind === 'goal' ? ' ghost' : ''}${open === i ? ' open' : ''}`}
                type="button"
                aria-label={t(cp.aria)}
                aria-expanded={open === i}
                onPointerEnter={() => { if (!isTouch) setOpen(i) }}
                onPointerLeave={(e) => { if (!isTouch && !pop.current?.contains(e.relatedTarget as Node)) setOpen(null) }}
                onFocus={() => { if (!isTouch) setOpen(i) }}
                onBlur={() => { if (!isTouch) setOpen(null) }}
                onClick={() => setOpen(open === i && isTouch ? null : i)}
              >
                <CoinFaces label={cp.n} />
              </button>
              <div className="xp-label"><small>{t(cp.label)}</small><b>{t(cp.company)}</b><span>{t(cp.when)}</span></div>
            </div>
          ))}
          <div className="xp-pin xp-flagpin" style={{ left: 452, top: 528 }} aria-hidden="true">
            <div>
              <svg viewBox="0 0 64 92"><rect x="12" y="6" width="4" height="82" rx="2" fill="#2c2a30" /><circle cx="14" cy="6" r="4" fill="#9e1240" />
                <g className="cloth"><path d="M16 10 L62 24 L16 38 Z" fill="#9e1240" /><path d="M16 10 L62 24 L16 24 Z" fill="#b3154a" />
                  <text x="22" y="28" fontFamily="Poppins, sans-serif" fontSize="9" fontWeight="700" fill="#fff">{EXPERIENCE.flag}</text></g></svg>
              <em>{t(EXPERIENCE.here)}</em>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`xp-pop${open !== null ? ' show' : ''}`}
        ref={pop}
        role="dialog"
        aria-live="polite"
        aria-hidden={open === null}
        onPointerLeave={(e) => { if (!isTouch && !(e.relatedTarget as Element | null)?.closest?.('.coin')) setOpen(null) }}
      >
        <CheckpointCard cp={cps[open ?? last]} />
      </div>
    </section>
  )
}
