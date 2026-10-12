import { CATEGORIES, UI } from '../data/content'
import { useLang } from '../i18n/lang'
import { Icon } from './icons'

// Six tiles at the bottom: icon + name only (no years, levels or brand logos).
// Hover / focus = a projector: a wine beam rises and projects a hologram of the icon + name.
export function CategoryTiles({ hidden = false }: { hidden?: boolean }) {
  const { t } = useLang()
  return (
    <div className={`tiles${hidden ? ' is-hidden' : ''}`} role="list" aria-label={t(UI.tilesNav)} inert={hidden}>
      {CATEGORIES.map((c) => {
        const name = t(c.label)
        return (
          <div key={c.icon} className="tile" role="listitem" tabIndex={0} aria-label={name}>
            <span className="beam" aria-hidden="true" />
            <span className="holo" aria-hidden="true"><Icon name={c.icon} /><b>{name}</b></span>
            <Icon name={c.icon} />
            <span className="name">{name}</span>
          </div>
        )
      })}
    </div>
  )
}
