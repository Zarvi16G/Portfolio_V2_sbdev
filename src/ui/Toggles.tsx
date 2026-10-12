import { LangToggle } from './LangToggle'
import { QualityToggle } from './QualityToggle'

// EN | ES and Auto | 3D | Lite together: top-right on wide screens ("corner"), inside the keys grid on
// narrower ones ("keys": side by side on tablets, stacked in the free slot of the second row on phones).
export function Toggles({ placement, hidden = false }: { placement: 'corner' | 'keys'; hidden?: boolean }) {
  return (
    <div className={`toggles toggles--${placement}${hidden ? ' is-hidden' : ''}`} inert={hidden}>
      <LangToggle />
      <QualityToggle />
    </div>
  )
}
