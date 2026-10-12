import type { Lang } from '../data/content'
import { UI } from '../data/content'
import { useLang } from '../i18n/lang'

const OPTIONS: Lang[] = ['en', 'es']

export function LangToggle() {
  const { lang, setLang, t } = useLang()
  return (
    <div className="lang" role="group" aria-label={t(UI.langToggle)}>
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
