import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { SKILL_CATEGORIES, SKILLS_UI } from '../data/content'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useLang } from '../i18n/lang'
import type { DieApi } from './SkillsDie'

const SkillsDie = lazy(() => import('./SkillsDie').then((m) => ({ default: m.SkillsDie })))

// Skills: the die on the left and the always-readable summary on the right.
// Chips are plain tags (no pop-up, no years). In the light version: the panel only.
export function Skills({ interactive, light }: { interactive: boolean; light: boolean }) {
  const { t } = useLang()
  const reduceMotion = useReducedMotion()
  const die = useRef<DieApi | null>(null)
  const [selected, setSelected] = useState(-1)
  const listRefs = useRef<(HTMLElement | null)[]>([])

  // face i of the die shows number i + 1 (the order of the table)
  const faces = useMemo(() => SKILL_CATEGORIES.map((c, i) => ({ title: t(c.name), n: i + 1 })), [t])

  const select = (i: number) => {
    setSelected(i)
    listRefs.current[i]?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <>
      {!light && (
        <div className="die-box" role="img" aria-label={t(SKILLS_UI.dieLabel)}>
          <Suspense fallback={null}><SkillsDie faces={faces} interactive={interactive} reduceMotion={reduceMotion} apiRef={die} onSelect={select} /></Suspense>
        </div>
      )}
      <section className={`panel${light ? ' solo' : ''}`} aria-labelledby="skills-title">
        <div className="panel-head">
          <span className="eyebrow">{t(SKILLS_UI.eyebrow)}</span>
          <h1 id="skills-title">{t(SKILLS_UI.title)}</h1>
          {!light && <p>{t(SKILLS_UI.intro)}</p>}
        </div>
        <ul className="list">
          {SKILL_CATEGORIES.map((c, i) => (
            <li key={c.id}>
              <article
                ref={(el) => { listRefs.current[i] = el }}
                className={`item${selected === i ? ' on' : ''}`}
                tabIndex={light ? undefined : 0}
                onMouseEnter={() => die.current?.faceHover(i)}
                onMouseLeave={() => die.current?.faceHover(-1)}
                onFocus={() => die.current?.faceHover(i)}
                onBlur={() => die.current?.faceHover(-1)}
                onClick={() => die.current?.activate(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); die.current?.activate(i) } }}
              >
                <div className="item-top">
                  <h2>{t(c.name)}</h2>
                  <span className="count">{t(SKILLS_UI.count).replace('{n}', String(c.skills.length))}</span>
                </div>
                <div className="chips">
                  {c.skills.map((s) => <span key={s} className="chip">{s}</span>)}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
