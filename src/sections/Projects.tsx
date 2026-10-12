import { useRef } from 'react'
import { LINKS, PROJECTS } from '../data/content'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { Rich, useLang } from '../i18n/lang'
import { Icon } from '../ui/icons'

const CHART = [[62, 30], [66, 34], [60, 28], [72, 36], [70, 26], [76, 31], [74, 40], [80, 29], [78, 33], [84, 30], [82, 35], [90, 36]]
const Arrow = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" /></svg>

// Projects: one card. Left, a browser frame with a mini dashboard in the app's own palette that
// tilts toward the pointer; right, the pitch, features, how it is built and the links.
export function Projects() {
  const { t, lang } = useLang()
  const reduceMotion = useReducedMotion()
  const browser = useRef<HTMLDivElement>(null)
  const m = PROJECTS.mock

  const tilt = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || !browser.current) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    browser.current.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`)
    browser.current.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`)
  }
  const untilt = () => { browser.current?.style.setProperty('--ry', '0deg'); browser.current?.style.setProperty('--rx', '0deg') }

  return (
    <section className="projects" aria-labelledby="proj-title">
      <header className="proj-head">
        <span className="eyebrow">{t(PROJECTS.eyebrow)}</span>
        <h2 id="proj-title">{t(PROJECTS.title)}</h2>
        <span className="proj-count">{t(PROJECTS.count)}</span>
      </header>
      <article className="proj" aria-labelledby="p1-title">
        <div className="proj-shot" onPointerMove={tilt} onPointerLeave={untilt}>
          <div className="browser" ref={browser}>
            <div className="browser-bar" aria-hidden="true"><i /><i /><i /><span>{LINKS.liveAppHost}</span></div>
            <div className="mock" role="img" aria-label={t(m.aria)}>
              <div className="mock-nav">
                <b>{PROJECTS.name}</b>
                {m.nav[lang].map((n, i) => <span key={n} className={i === 0 ? 'on' : undefined}>{n}</span>)}
              </div>
              <div className="mock-main">
                <div className="mock-hello"><small>{t(m.period)}</small>{t(m.hello)}</div>
                <div className="mock-kpis">
                  <div className="mock-kpi"><span>{t(m.netWorth)}</span><b>159.000.000</b><em>{t(m.growth)}</em></div>
                  <div className="mock-kpi in"><span>{t(m.income)}</span><b>5.000.000</b></div>
                  <div className="mock-kpi out"><span>{t(m.spending)}</span><b>2.000.000</b></div>
                </div>
                <div className="mock-chart" aria-hidden="true">
                  {CHART.map(([a, b], i) => <div key={i}><i style={{ height: `${a}%` }} /><i style={{ height: `${b}%` }} /></div>)}
                </div>
                <div className="mock-health">
                  {m.health.map((h, i) => <span key={i} className={i === 1 ? 'mid' : undefined}>{t(h)}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="proj-info">
          <div className="proj-meta"><span className="proj-n">01</span><span>{t(PROJECTS.meta)}</span><span className="live">{t(PROJECTS.live)}</span></div>
          <h3 id="p1-title">{PROJECTS.name}</h3>
          <p className="pitch">{t(PROJECTS.pitch)}</p>
          <ul className="feats">
            {PROJECTS.features.map((f, i) => <li key={i}><span><Rich text={t(f)} /></span></li>)}
          </ul>
          <div className="built" aria-label={t(PROJECTS.builtLabel)}>
            {PROJECTS.chips.map((c) => <span key={c.icon}><Icon name={c.icon} />{t(c.label)}</span>)}
          </div>
          <div className="proj-actions">
            <a className="btn-key" href={LINKS.liveApp} target="_blank" rel="noopener">{t(PROJECTS.visit)}<Arrow /></a>
            <a className="btn-out" href={LINKS.github} target="_blank" rel="noopener">{t(PROJECTS.github)}<Arrow /></a>
            <button className="btn-ghost" type="button" disabled>{t(PROJECTS.caseStudy)}</button>
          </div>
        </div>
      </article>
      <div className="proj-next">
        <Icon name="Code" />
        <div><b>{t(PROJECTS.nextTitle)}</b>{t(PROJECTS.nextText)}</div>
      </div>
    </section>
  )
}
