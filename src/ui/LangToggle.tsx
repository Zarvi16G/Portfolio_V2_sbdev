import type { Lang } from '../data/content'
import { UI } from '../data/content'
import { useLang } from '../i18n/lang'

const OPTIONS: Lang[] = ['en', 'es']

// Two placements: top-right corner (tablet and up) and inside the keys grid on phones.
export function LangToggle({ hidden = false, placement }: { hidden?: boolean; placement: 'corner' | 'keys' }) {
  const { lang, setLang, t } = useLang()
  return (
    <div className={`lang lang--${placement}${hidden ? ' is-hidden' : ''}`} role="group" aria-label={t(UI.langToggle)} inert={hidden}>
      {OPTIONS.map((l, i) => (
        <span key={l} className="lang-opt">
          {i > 0 && <span className="lang-sep" aria-hidden="true">|</span>}
          <button type="button" aria-pressed={lang === l} lang={l} onClick={() => setLang(l)}
            aria-label={l === 'en' ? 'English' : 'Español'}>{l.toUpperCase()}</button>
        </span>
      ))}
    </div>
  )
}
