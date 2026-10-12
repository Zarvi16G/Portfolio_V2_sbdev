import { PLACEHOLDER } from '../data/content'
import { useLang } from '../i18n/lang'

// Temporary wine card for the sections that are still to build.
export function Placeholder({ title }: { title: string }) {
  const { t } = useLang()
  return (
    <section className="section-card" aria-labelledby="placeholder-title">
      <span className="eyebrow">{t(PLACEHOLDER.eyebrow)}</span>
      <h2 id="placeholder-title">{title}</h2>
      <p>{t(PLACEHOLDER.text)}</p>
    </section>
  )
}
