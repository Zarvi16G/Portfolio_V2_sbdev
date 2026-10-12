import { useState } from 'react'
import { ABOUT, LINKS } from '../data/content'
import { useLang } from '../i18n/lang'
import { CoinFaces } from '../ui/Coin'

// About: an ID badge hanging from a striped wine strap, swinging softly like a pendulum.
// Click / tap / Enter / Space flips it. Its height follows the content.
export function About() {
  const { t } = useLang()
  const [flipped, setFlipped] = useState(false)
  const [isTouch] = useState(() => matchMedia('(hover: none)').matches)
  return (
    <section className="projects" aria-labelledby="about-title">
      <div className="about-head">
        <span className="eyebrow">{t(ABOUT.eyebrow)}</span>
        <h2 id="about-title">{t(ABOUT.title)}</h2>
      </div>
      <div className="badge-stage">
        <div className="pendulum">
          <span className="strap" aria-hidden="true" />
          <span className="clip" aria-hidden="true" />
          <button className={`badge${flipped ? ' flipped' : ''}`} type="button" aria-label={t(ABOUT.badgeAria)} aria-pressed={flipped} onClick={() => setFlipped((f) => !f)}>
            <span className="badge-side badge-front" aria-hidden={flipped}>
              <span className="coin" aria-hidden="true"><CoinFaces label="SB" /></span>
              <h3>{ABOUT.name}</h3>
              <span className="role">{t(ABOUT.role)}</span>
              <dl>
                {ABOUT.rows.map((r, i) => <div key={i}><dt>{t(r.k)}</dt><dd>{t(r.v)}</dd></div>)}
              </dl>
            </span>
            <span className="badge-side badge-back" aria-hidden={!flipped}>
              <h4>{t(ABOUT.studying)}</h4>
              <p><b>{t(ABOUT.study)}</b>{t(ABOUT.school)}</p>
              <h4>{t(ABOUT.availableFor)}</h4>
              <p><b>{t(ABOUT.availability)}</b>{t(ABOUT.place)}</p>
              <span className="stripe" aria-hidden="true" />
              <span className="site">{LINKS.site}</span>
            </span>
          </button>
          <span className="badge-hint">{t(isTouch ? ABOUT.hintTap : ABOUT.hintClick)}</span>
        </div>
      </div>
    </section>
  )
}
