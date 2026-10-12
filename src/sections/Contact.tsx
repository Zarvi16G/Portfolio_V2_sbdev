import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CONTACT, LINKS } from '../data/content'
import { prefersReducedMotion } from '../hooks/useReducedMotion'
import { useLang } from '../i18n/lang'

// Contact: a wine envelope whose flap opens in 3D; the letter slides up with the email
// (Copy), GitHub and LinkedIn. The envelope's height and the lift follow the letter's height.
export function Contact({ openDelay }: { openDelay: number }) {
  const { t } = useLang()
  const stage = useRef<HTMLDivElement>(null), env = useRef<HTMLDivElement>(null), letter = useRef<HTMLDivElement>(null)
  const addr = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [copy, setCopy] = useState<'idle' | 'done' | 'fallback'>('idle')

  // closed, the letter fits inside; open, it rises until only its blank bottom stays in the pocket
  const layout = useCallback(() => {
    const l = letter.current, s = stage.current
    if (!l || !s || !l.offsetHeight) return
    const lh = l.offsetHeight
    s.style.setProperty('--env-h', `${Math.max(220, lh + 34)}px`)
    s.style.setProperty('--lift', `${18 + lh - 40}px`)
    if (l.style.top) l.style.top = `${18 - (18 + lh - 40)}px`
  }, [])

  useLayoutEffect(layout, [layout, t])
  useEffect(() => {
    addEventListener('resize', layout)
    const id = setTimeout(() => setOpen(true), openDelay)   // the envelope opens once the section is in place
    return () => { removeEventListener('resize', layout); clearTimeout(id) }
  }, [layout, openDelay])

  // once the letter is out, park it with "top" and no transform, so its text is drawn crisp
  useEffect(() => {
    const l = letter.current
    if (!l || !open) return
    const park = () => {
      const lift = parseFloat(getComputedStyle(stage.current!).getPropertyValue('--lift')) || 0
      l.style.transition = 'none'; l.style.top = `${Math.round(18 - lift)}px`; l.style.transform = 'none'
    }
    if (prefersReducedMotion()) { park(); return }
    const onEnd = (e: TransitionEvent) => { if (e.propertyName === 'transform' && e.target === l) park() }
    l.addEventListener('transitionend', onEnd)
    return () => l.removeEventListener('transitionend', onEnd)
  }, [open])

  useEffect(() => {
    if (copy === 'idle') return
    const id = setTimeout(() => setCopy('idle'), 1800)
    return () => clearTimeout(id)
  }, [copy])

  const doCopy = () => {
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents(addr.current!)
      const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(r)
      setCopy('fallback')
    }
    try { navigator.clipboard.writeText(LINKS.email).then(() => setCopy('done'), fallback) } catch { fallback() }
  }

  return (
    <section className="projects" aria-labelledby="contact-title">
      <div className="contact-head">
        <span className="eyebrow">{t(CONTACT.eyebrow)}</span>
        <h2 id="contact-title" className="sr-only">{t(CONTACT.title)}</h2>
        <span className="status">{t(CONTACT.status)}</span>
      </div>
      <div className="env-stage" ref={stage}>
        <div className={`env${open ? ' open' : ''}`} ref={env}>
          <span className="env-back" aria-hidden="true" />
          <span className="env-flap" aria-hidden="true" />
          <div className="letter" ref={letter}>
            <small>{t(CONTACT.dear)}</small>
            <h3>{t(CONTACT.letterTitle)}</h3>
            <p>{t(CONTACT.text)}</p>
            <div className="mailrow">
              <span ref={addr}>{LINKS.email}</span>
              <button className={`copy-btn${copy === 'done' ? ' done' : ''}`} type="button" onClick={doCopy} aria-live="polite">
                {t(copy === 'done' ? CONTACT.copied : copy === 'fallback' ? CONTACT.copyFallback : CONTACT.copy)}
              </button>
            </div>
            <div className="socials">
              <a className="social" href={LINKS.github} target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5" /></svg>GitHub</a>
              <a className="social" href={LINKS.linkedin} target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /></svg>LinkedIn</a>
            </div>
          </div>
          <span className="env-front" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
